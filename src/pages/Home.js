import React from 'react';

function Home() {
  return (
    <div className="pt-24 text-white text-center px-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to ResumeAI</h1>
      <p className="text-lg text-gray-300 mb-8">
        Upload your resume and get instant feedback powered by AI.
      </p>
      <button className="bg-indigo-600 px-6 py-2 rounded-full text-white hover:bg-indigo-700 transition">
        Upload Resume
      </button>
    </div>
  );
}

export default Home;
