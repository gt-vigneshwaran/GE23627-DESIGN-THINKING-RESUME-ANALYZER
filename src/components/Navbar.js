import React from "react";

function Navbar({ user, onSignOut }) {
  return (
    <nav className="bg-gray-950 text-white px-6 py-4 flex justify-between items-center shadow-md">
      <h1 className="text-2xl font-bold text-purple-400">Resume Analyzer</h1>
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm font-medium">{user.name}</span>
            <button
              onClick={onSignOut}
              className="bg-red-600 px-3 py-1 rounded-md text-sm hover:bg-red-700"
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
