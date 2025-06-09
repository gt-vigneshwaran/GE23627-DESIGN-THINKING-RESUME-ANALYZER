import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-900 text-white text-center py-4 mt-20">
      <p className="text-sm">&copy; {new Date().getFullYear()} ResumeAI. All rights reserved.</p>
    </footer>
  );
}

export default Footer;
