// ResumeAnalysis.js
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaUpload, FaSignOutAlt } from "react-icons/fa";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ResumeAnalysis = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [user, setUser] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      alert("Please upload a PDF resume first!");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5010/analyze", {
        method: "POST",
        body: formData,
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        alert("Invalid response format from server.");
        setLoading(false);
        return;
      }

      if (response.ok) {
        setAnalysis(data);
      } else {
        alert(data.error || "Failed to analyze resume.");
      }
    } catch (error) {
      alert("Server error: Unable to connect.");
    }

    setLoading(false);
  };

  const handleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setUser(decoded);
  };

  const handleDownload = async () => {
    const element = document.getElementById("result-box");
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("resume_analysis.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-[#0c0c25] to-[#1a0f2b] text-white flex flex-col items-center justify-center px-4 pt-16 space-y-10 font-sans relative">

      {user && (
        <div className="absolute top-4 right-4 z-50 flex items-center space-x-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-md">
          <img
            src={user.picture}
            alt="Profile"
            className="w-8 h-8 rounded-full border border-white"
          />
          <span className="text-sm font-semibold">{user.given_name}</span>
          <button
            onClick={() => window.location.reload()}
            className="text-red-400 hover:text-red-500 text-lg"
            title="Logout"
          >
            <FaSignOutAlt />
          </button>
        </div>
      )}

      {!user ? (
        <>
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-transparent bg-clip-text text-center drop-shadow-md"
          >
            Welcome to AI Resume Analyzer
          </motion.h1>
          <GoogleLogin
            onSuccess={handleLoginSuccess}
            onError={() => alert("Login Failed")}
          />
        </>
      ) : (
        <>
          <motion.h1
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white drop-shadow-md mt-16"
          >
            Hello, {user.given_name}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-xl w-full max-w-xl flex flex-col items-center space-y-5 border border-white/20"
          >
            <label className="flex items-center space-x-3 cursor-pointer">
              <FaUpload className="text-2xl text-cyan-400" />
              <span className="text-lg">Upload Resume (PDF)</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {file && <p className="text-sm text-gray-300">{file.name}</p>}

            <button
              className={`mt-2 px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-lg transition-all duration-300 ${
                loading ? "opacity-60 cursor-not-allowed" : "hover:brightness-125"
              }`}
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze Resume"}
            </button>
          </motion.div>

          {analysis && (
            <motion.div
              id="result-box"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 bg-white/5 backdrop-blur-lg p-6 rounded-2xl shadow-[0_0_20px_#00f2ff33] w-full max-w-xl border border-white/20 hover:shadow-[0_0_30px_#00f2ff99] transition"
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white text-center mb-4">Resume Score</h2>

                <div className="text-left w-full mb-3">
                  <p className="text-sm text-gray-300 mb-1">Overall Score</p>
                  <div className="w-full bg-white/10 rounded-full h-4">
                    <motion.div
                      className="bg-cyan-400 h-4 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis?.overallScore || 0}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <p className="text-xs text-right text-gray-300 mt-1">{analysis?.overallScore || 0}%</p>
                </div>

                <div className="text-left w-full mb-3">
                  <p className="text-sm text-gray-300 mb-1">Requirements Match</p>
                  <div className="w-full bg-white/10 rounded-full h-4">
                    <motion.div
                      className="bg-purple-400 h-4 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis?.requirementsScore || 0}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <p className="text-xs text-right text-gray-300 mt-1">{analysis?.requirementsScore || 0}%</p>
                </div>

                <div className="text-left w-full mb-3">
                  <p className="text-sm text-gray-300 mb-1">Keyword Score</p>
                  <div className="w-full bg-white/10 rounded-full h-4">
                    <motion.div
                      className="bg-fuchsia-400 h-4 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis?.keywordsScore || 0}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <p className="text-xs text-right text-gray-300 mt-1">{analysis?.keywordsScore || 0}%</p>
                </div>
              </div>

              <div className="text-left mt-4">
                <h3 className="font-bold text-cyan-300 mb-2">AI Suggestions:</h3>
                <ul className="text-sm text-gray-200 list-disc pl-5 space-y-1">
                  {Array.isArray(analysis?.suggestions) && analysis.suggestions.length > 0 ? (
                    analysis.suggestions.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))
                  ) : (
                    <li>No major corrections detected.</li>
                  )}
                </ul>
              </div>

              <button
                onClick={handleDownload}
                className="mt-6 w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-xl shadow hover:shadow-[0_0_15px_#00fff7]"
              >
                Download as PDF
              </button>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default ResumeAnalysis;
