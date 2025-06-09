require("dotenv").config(); // Load environment variables
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const pdfParse = require("pdf-parse");

const app = express();
const PORT = process.env.PORT || 5010;

// Configure Gemini API with fallback models
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Try different models in order of preference for free tier
const models = [
  { name: "gemini-1.5-flash", instance: null },
  { name: "gemini-pro", instance: null }
];

// Initialize models
models.forEach(model => {
  try {
    model.instance = genAI.getGenerativeModel({ model: model.name });
    console.log(`✅ Initialized ${model.name}`);
  } catch (error) {
    console.warn(`⚠️ Could not initialize ${model.name}:`, error.message);
  }
});

// Rate limiting for free tier
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 5000; // 5 seconds between requests
let dailyRequestCount = 0;
const DAILY_REQUEST_LIMIT = 50; // Conservative limit for free tier

// MongoDB connection
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Define job template schema to match existing DB structure from nlp.py
const jobTemplateSchema = new mongoose.Schema({
  title: String,
  skills: [String],          // Matches the schema in nlp.py
  experience: [String],      // Matches the schema in nlp.py
  education: String,         // Matches the schema in nlp.py
  description: String
});

const JobTemplate = mongoose.model("job_templates", jobTemplateSchema);

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Extract text from PDF
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

// Default job template if none specified - matches your nlp.py schema
const defaultJobTemplate = {
  title: "Software Engineer",
  skills: [
    "JavaScript", "React", "Node.js", "API Development", 
    "Git", "Problem Solving", "TypeScript", "AWS", "Docker", 
    "CI/CD", "MongoDB", "Express"
  ],
  experience: [
    "Web application development",
    "Frontend development",
    "Backend development",
    "API integration"
  ],
  education: "Bachelor's degree in Computer Science or related field",
  description: "Looking for a software engineer with strong JavaScript skills and experience with modern web frameworks."
};

// Rate limiting helper
async function waitForRateLimit() {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
    console.log(`⏳ Rate limiting: waiting ${waitTime}ms...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  lastRequestTime = Date.now();
}

// Enhanced fallback analysis when AI is unavailable
function generateFallbackAnalysis(resumeText, jobTemplate) {
  console.log("🔄 Using fallback analysis (AI quota reached)");
  
  const resumeLower = resumeText.toLowerCase();
  const requiredSkills = jobTemplate.skills || [];
  const requiredExperience = jobTemplate.experience || [];
  
  // Advanced keyword matching
  function findSkillMatches(skill, text) {
    const skillLower = skill.toLowerCase();
    const variations = [
      skillLower,
      skillLower.replace(/\./g, ''), // Node.js -> nodejs
      skillLower.replace(/\s+/g, ''), // Remove spaces
      skillLower.replace(/-/g, '') // Remove hyphens
    ];
    return variations.some(variant => text.includes(variant));
  }
  
  const skillsMatched = requiredSkills.filter(skill => 
    findSkillMatches(skill, resumeLower)
  );
  
  const skillsMissing = requiredSkills.filter(skill => 
    !findSkillMatches(skill, resumeLower)
  );
  
  const experienceMatched = requiredExperience.filter(exp => {
    const expWords = exp.toLowerCase().split(' ');
    return expWords.some(word => word.length > 3 && resumeLower.includes(word));
  });
  
  const experienceMissing = requiredExperience.filter(exp => {
    const expWords = exp.toLowerCase().split(' ');
    return !expWords.some(word => word.length > 3 && resumeLower.includes(word));
  });
  
  // Calculate scores
  const skillsScore = Math.round((skillsMatched.length / Math.max(requiredSkills.length, 1)) * 100);
  const experienceScore = Math.round((experienceMatched.length / Math.max(requiredExperience.length, 1)) * 100);
  const overallScore = Math.round((skillsScore + experienceScore) / 2);
  
  // Education check
  const educationKeywords = ['bachelor', 'master', 'degree', 'university', 'college', 'phd'];
  const hasEducation = educationKeywords.some(keyword => resumeLower.includes(keyword));
  
  // Generate suggestions
  const suggestions = [];
  if (skillsMissing.length > 0) {
    const topMissing = skillsMissing.slice(0, 3).join(', ');
    suggestions.push(`Consider adding experience with ${topMissing} to better match the job requirements.`);
  }
  if (experienceMissing.length > 0) {
    suggestions.push("Highlight relevant project experience that demonstrates your technical expertise.");
  }
  if (!hasEducation && jobTemplate.education) {
    suggestions.push("Include your educational background or relevant certifications.");
  }
  suggestions.push("Quantify your achievements with specific metrics and results.");
  suggestions.push("Use industry-specific keywords throughout your resume.");
  
  return {
    overallScore: Math.max(overallScore, 25),
    requirementsScore: Math.max(skillsScore, 20),
    keywordsScore: Math.max(skillsScore + 10, 30),
    skillsMatched,
    skillsMissing: skillsMissing.slice(0, 8),
    experienceMatched,
    experienceMissing: experienceMissing.slice(0, 5),
    educationMatch: hasEducation,
    suggestions: suggestions.slice(0, 5)
  };
}

// Analyze resume using Gemini API with proper free tier handling
async function analyzeResumeWithAI(resumeText, jobTemplate = defaultJobTemplate) {
  // Check daily limit
  if (dailyRequestCount >= DAILY_REQUEST_LIMIT) {
    console.log("📊 Daily API limit reached, using fallback analysis");
    return generateFallbackAnalysis(resumeText, jobTemplate);
  }
  
  await waitForRateLimit();
  
  // Truncate resume text to avoid token limits
  const truncatedResumeText = resumeText.length > 2500 
    ? resumeText.substring(0, 2500) + "..."
    : resumeText;
  
  const prompt = `
Analyze this resume for the ${jobTemplate.title} position. Return ONLY valid JSON with this exact structure:

{
  "overallScore": number_0_to_100,
  "requirementsScore": number_0_to_100,
  "keywordsScore": number_0_to_100,
  "skillsMatched": ["skill1", "skill2"],
  "skillsMissing": ["skill3", "skill4"],
  "experienceMatched": ["exp1", "exp2"],
  "experienceMissing": ["exp3", "exp4"],
  "educationMatch": boolean,
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}

Job Requirements:
- Title: ${jobTemplate.title}
- Skills: ${jobTemplate.skills ? jobTemplate.skills.join(", ") : ""}
- Experience: ${jobTemplate.experience ? jobTemplate.experience.join(", ") : ""}
- Education: ${jobTemplate.education || ""}

Resume Text:
${truncatedResumeText}

Return only the JSON object, no other text.`;

  // Try each available model
  for (const modelConfig of models) {
    if (!modelConfig.instance) continue;
    
    try {
      console.log(`🤖 Trying ${modelConfig.name}...`);
      
      const result = await modelConfig.instance.generateContent(prompt);
      const response = result.response;
      const responseText = response.text();
      
      // Extract JSON more robustly
      let jsonStr = responseText.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      // Find JSON object
      const jsonMatch = jsonStr.match(/{[\s\S]*}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      const parsed = JSON.parse(jsonStr);
      
      // Validate required fields
      if (typeof parsed.overallScore === 'number' && 
          Array.isArray(parsed.suggestions)) {
        dailyRequestCount++;
        console.log(`✅ AI analysis successful with ${modelConfig.name}`);
        return parsed;
      }
      
    } catch (error) {
      console.error(`❌ ${modelConfig.name} failed:`, error.message);
      
      // If quota exceeded, wait and try fallback
      if (error.message.includes('429') || error.message.includes('quota')) {
        console.log(`⚠️ ${modelConfig.name} quota exceeded`);
        // Don't try other models if we hit quota limit
        break;
      }
      continue;
    }
  }
  
  // If all AI attempts fail, use fallback
  console.log("🔄 All AI models failed, using enhanced fallback");
  return generateFallbackAnalysis(resumeText, jobTemplate);
}

// Fetch a job template from DB or use default
async function getJobTemplate(jobTitle) {
  try {
    if (!jobTitle) return defaultJobTemplate;
    
    const template = await JobTemplate.findOne({ 
      title: { $regex: new RegExp(jobTitle, "i") } 
    });
    
    return template || defaultJobTemplate;
  } catch (error) {
    console.error("Error fetching job template:", error);
    return defaultJobTemplate;
  }
}

// Resume analysis route
app.post("/analyze", upload.single("resume"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No resume uploaded" });
  }

  const resumePath = req.file.path;
  const jobTitle = req.body.jobTitle || null;

  try {
    // Extract text from PDF
    const resumeText = await extractTextFromPDF(resumePath);
    
    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error("Could not extract text from PDF. Please ensure the PDF contains readable text.");
    }
    
    // Get job template
    const jobTemplate = await getJobTemplate(jobTitle);
    
    // Analyze resume
    const analysisResult = await analyzeResumeWithAI(resumeText, jobTemplate);
    
    // Clean up uploaded file
    fs.unlink(resumePath, (err) => {
      if (err) console.warn("Could not delete file:", err.message);
    });
    
    return res.json({
      success: true,
      dailyRequestsUsed: dailyRequestCount,
      dailyRequestsRemaining: Math.max(0, DAILY_REQUEST_LIMIT - dailyRequestCount),
      overallScore: analysisResult.overallScore || 70,
      requirementsScore: analysisResult.requirementsScore || 60,
      keywordsScore: analysisResult.keywordsScore || 50,
      suggestions: analysisResult.suggestions || ["No suggestions generated."],
      skillsMatched: analysisResult.skillsMatched || [],
      skillsMissing: analysisResult.skillsMissing || [],
      experienceMatched: analysisResult.experienceMatched || [],
      experienceMissing: analysisResult.experienceMissing || [],
      educationMatch: analysisResult.educationMatch || false
    });
  } catch (error) {
    console.error("Analysis Error:", error);
    
    // Clean up uploaded file on error
    if (fs.existsSync(resumePath)) {
      fs.unlink(resumePath, () => {});
    }
    
    return res.status(500).json({
      success: false,
      error: "Resume analysis failed",
      details: error.message || "Unknown error"
    });
  }
});

// Create/update job templates
app.post("/job-templates", async (req, res) => {
  try {
    const { title, skills, experience, education, description } = req.body;
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: "Job title is required" });
    }
    
    // Find existing template or create new one
    let template = await JobTemplate.findOne({ title });
    
    if (template) {
      // Update existing template
      template.skills = skills || template.skills;
      template.experience = experience || template.experience;
      template.education = education || template.education;
      template.description = description || template.description;
      await template.save();
    } else {
      // Create new template
      template = new JobTemplate({
        title,
        skills: skills || [],
        experience: experience || [],
        education: education || "",
        description: description || ""
      });
      await template.save();
    }
    
    res.status(201).json(template);
  } catch (error) {
    console.error("Error creating/updating job template:", error);
    res.status(500).json({ error: "Failed to create/update job template" });
  }
});

// Get all job templates
app.get("/job-templates", async (req, res) => {
  try {
    const templates = await JobTemplate.find({}).sort({ title: 1 });
    res.json(templates);
  } catch (error) {
    console.error("Error fetching job templates:", error);
    res.status(500).json({ error: "Failed to fetch job templates" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    availableModels: models.filter(m => m.instance).map(m => m.name),
    dailyRequestsUsed: dailyRequestCount,
    dailyRequestsRemaining: Math.max(0, DAILY_REQUEST_LIMIT - dailyRequestCount)
  });
});

// Reset daily counter at midnight (simple version)
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    dailyRequestCount = 0;
    console.log("🔄 Daily API counter reset");
  }
}, 60000); // Check every minute

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Resume analyzer server running at http://localhost:${PORT}`);
  console.log(`🤖 Available models: ${models.filter(m => m.instance).map(m => m.name).join(', ')}`);
  console.log(`📊 Daily API limit: ${DAILY_REQUEST_LIMIT} requests`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});