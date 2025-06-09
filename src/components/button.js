import React from 'react';

export const Button = ({ children, onClick, className = "", ...props }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:opacity-90 transition duration-300 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
