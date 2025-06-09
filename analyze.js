const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 5010;

// Middleware
app.use(cors());
app.use(express.json());

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// File upload route
app.post('/upload', upload.single('resume'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filePath = req.file.path;
  console.log('📄 File received:', filePath);

  const python = spawn('python', ['nlp.py', filePath]);

  let output = '';
  let errorOutput = '';

  python.stdout.on('data', (data) => {
    output += data.toString();
  });

  python.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.error('❌ Python stderr:', data.toString());
  });

  python.on('close', (code) => {
    console.log(`🚪 Python process exited with code: ${code}`);

    if (code !== 0) {
      return res.status(500).json({ error: 'AI analysis failed', details: errorOutput });
    }

    try {
      const result = JSON.parse(output);
      return res.status(200).json(result);
    } catch (parseErr) {
      console.error('❌ JSON parse error:', parseErr);
      return res.status(500).json({ error: 'Error parsing Python output' });
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
