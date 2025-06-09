import React, { useState } from "react";
import ResumeAnalysis from "./components/ResumeAnalysis";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import FeatureGrid from "./components/FeatureGrid"; // <-- New section
import { GoogleOAuthProvider, googleLogout } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

function App() {
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setUser({ name: decoded.name });
  };

  const handleLogout = () => {
    googleLogout();
    setUser(null);
  };

  return (
    <GoogleOAuthProvider clientId="323284304297-jkgbletetsfo635q4q1kphfa8pond76r.apps.googleusercontent.com">
      <div className="bg-black min-h-screen text-white font-sans">
        <Navbar user={user} onSignOut={handleLogout} />
        <ResumeAnalysis onLoginSuccess={handleLoginSuccess} user={user} />
        <FeatureGrid /> {/* <-- Add this line for the 8 content boxes */}
        <Footer />
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
