import React from "react";

function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8 px-4 mt-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
        <div>
          <h2 className="font-semibold text-lg mb-2">About</h2>
          <p>
            Resume Analyzer helps you analyze resumes using AI, ensuring your
            CV stands out with keyword insights and tailored feedback.
          </p>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-2">Features</h2>
          <ul className="space-y-1">
            <li>✅ AI-Powered Resume Review</li>
            <li>✅ Real-time Suggestions</li>
            <li>✅ Clean Visual Report</li>
            <li>✅ PDF Upload & Parsing</li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-lg mb-2">Contact</h2>
          <p>📞 +91 8015044479</p>
          <p>📧 vignesh.gopu@gmail.com</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
