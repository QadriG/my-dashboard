import React, { useRef, useEffect } from "react";
import "../../styles/globals.css";

export default function UserSettings() {
  const audioRef = useRef(null);

  useEffect(() => {
    const playHoverSound = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    };
    const buttons = document.querySelectorAll(".sidebar-button");
    buttons.forEach((btn) => btn.addEventListener("mouseenter", playHoverSound));
    return () => {
      buttons.forEach((btn) => btn.removeEventListener("mouseenter", playHoverSound));
    };
  }, []);

  return (
    <div className="bg-black text-white min-h-screen">
      <audio ref={audioRef} preload="auto">
        <source src="/assets/click.mp3" type="audio/mpeg" />
      </audio>

      {/* MAIN CONTENT: NO SIDEBAR, NO LEFT MARGIN */}
      <div className="p-8 space-y-10">
        <h1 className="text-3xl font-semibold drop-shadow-md">Settings</h1>

        {/* Reset Password Section */}
        <div className="bg-black/30 backdrop-blur-md border-2 border-green-400 p-6 rounded-xl transition-transform transform hover:scale-[1.02]">
          <h2 className="text-2xl font-semibold mb-4">Reset Password</h2>
          <div className="space-y-4">
            <input type="password" placeholder="Current Password" className="w-full p-2 border rounded" />
            <input type="password" placeholder="New Password" className="w-full p-2 border rounded" />
            <input type="password" placeholder="Confirm Password" className="w-full p-2 border rounded" />
            <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded">Save Password</button>
          </div>
        </div>

        {/* Leverage Section */}
        <div className="bg-black/30 backdrop-blur-md border-2 border-red-400 p-6 rounded-xl transition-transform transform hover:scale-[1.02]">
          <h2 className="text-2xl font-semibold mb-4">Set Default Leverage</h2>
          <select className="w-full p-2 border rounded mb-2">
            <option>1x</option>
            <option>5x</option>
            <option>10x</option>
            <option>20x</option>
            <option>50x</option>
            <option>100x</option>
            <option>150x</option>
          </select>
          <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">Set Leverage</button>
        </div>
      </div>
    </div>
  );
}
