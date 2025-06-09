import React from 'react';
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const WelcomeDashboard = ({ user, onNewScan }) => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 text-white flex flex-col items-center justify-center">
      <div className="flex items-center gap-4 mb-6">
        <Sparkles className="text-white w-10 h-10" />
        <h1 className="text-4xl font-bold">Welcome back, {user.name?.toUpperCase()}! 👋</h1>
      </div>
      <p className="text-lg text-blue-100 mb-6">Let's optimize your next resume</p>
      <Button onClick={onNewScan} className="rounded-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 text-lg">
        ✨ New Resume Scan
      </Button>
    </div>
  );
};

export default WelcomeDashboard;
