import React from 'react';

function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-8 py-4 shadow-lg fixed top-0 w-full z-50">
      <div className="flex justify-between items-center">
        <div className="text-xl font-bold">ResumeAI</div>
        <ul className="flex gap-6 text-sm">
          <li className="hover:text-indigo-400 cursor-pointer">Home</li>
          <li className="hover:text-indigo-400 cursor-pointer">Features</li>
          <li className="hover:text-indigo-400 cursor-pointer">About</li>
          <li className="hover:text-indigo-400 cursor-pointer">Contact</li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
