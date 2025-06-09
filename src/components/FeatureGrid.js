import React from "react";
import { motion } from "framer-motion";
import { FaRobot, FaSearch, FaLightbulb, FaClipboardCheck, FaChartLine, FaWrench, FaStar, FaSyncAlt } from "react-icons/fa";

const features = [
  {
    title: "Smart Resume Analysis",
    items: [
      { icon: <FaRobot />, text: "Analyzes keyword optimization for ATS systems" },
      { icon: <FaSearch />, text: "Identifies missing crucial skills or experiences" },
      { icon: <FaLightbulb />, text: "Suggests industry-specific improvements" },
    ],
  },
  {
    title: "Detailed Insights",
    items: [
      { icon: <FaClipboardCheck />, text: "Provides readability score and improvement tips" },
      { icon: <FaChartLine />, text: "Measures impact of achievement statements" },
      { icon: <FaWrench />, text: "Compares against industry benchmarks" },
    ],
  },
  {
    title: "Actionable Recommendations",
    items: [
      { icon: <FaStar />, text: "Offers word choice alternatives for stronger impact" },
      { icon: <FaSearch />, text: "Highlights areas needing quantifiable results" },
      { icon: <FaWrench />, text: "Provides formatting optimization tips" },
    ],
  },
];

const whyChoose = [
  {
    title: "Tailored Scoring for Job Descriptions",
    text: "Your resume score is a measure of how well it aligns with a specific job description. Uploading the job description helps us evaluate its relevance."
  },
  {
    title: "Empowering You with Multiple AI Perspectives",
    text: "We use various cutting-edge AI models so you receive diverse and rich feedback—just like different companies use different ATS systems."
  },
  {
    title: "Continuous Innovation for Better Results",
    text: "We integrate the latest AI models from OpenAI and Anthropic, ensuring you’re always a step ahead of the competition."
  },
  {
    title: "Understanding Variability in Results",
    text: "Different AI models see resumes differently. We give you those perspectives so you can refine and adapt accordingly."
  },
];

const FeatureGrid = () => {
  return (
    <div className="bg-[#0d0d1e] py-16 px-4 md:px-16 text-white font-sans space-y-20">
      {/* Section 1-3: Features in 3 boxes */}
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((section, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.03 }}
            className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-md backdrop-blur-lg"
          >
            <h3 className="text-xl font-semibold text-cyan-300 mb-4">{section.title}</h3>
            <ul className="space-y-3 text-sm text-gray-200">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="text-cyan-400 mt-1">{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Section 4: Why Choose - 2 Boxes per row */}
      <div className="grid md:grid-cols-2 gap-10">
        {whyChoose.map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            className="bg-white/10 border border-white/20 p-6 rounded-2xl shadow-md backdrop-blur-lg"
          >
            <h4 className="text-lg font-bold text-purple-300 mb-2">{item.title}</h4>
            <p className="text-sm text-gray-300">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default FeatureGrid;
