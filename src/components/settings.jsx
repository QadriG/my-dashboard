import React, { useRef, useEffect } from "react";
import "./../styles/globals.css";

export default function Settings() {
  const audioRef = useRef(null);

  useEffect(() => {
    const playHoverSound = () => {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => console.error("Audio play error:", err));
      }
    };

    const buttons = document.querySelectorAll(".sidebar-button");
    buttons.forEach((button) => {
      button.addEventListener("mouseenter", playHoverSound);
    });

    return () => {
      buttons.forEach((button) => {
        button.removeEventListener("mouseenter", playHoverSound);
      });
    };
  }, []);

  return (
    <div className="bg-black text-white min-h-screen">
      <audio ref={audioRef} id="hover-sound" preload="auto">
        <source src="/assets/click.mp3" type="audio/mpeg" />
      </audio>

      {/* Main Content (assumes sidebar is handled by parent) */}
      <main className="ml-64 p-8 overflow-y-auto space-y-10">
        <div className="shimmer-wrapper w-full py-4 px-6 mb-6">
          <h1 className="text-3xl font-semibold drop-shadow-md">Settings</h1>
        </div>

        {/* Reset Password Section */}
        <div className="bg-black/30 backdrop-blur-md border-2 border-green-400 hover:shadow-[0_0_12px_4px_rgba(34,197,94,0.6)] text-white p-6 rounded-xl w-full mb-10 transition-transform duration-300 transform hover:scale-[1.02] overflow-hidden will-change-transform">
          <h2 className="text-2xl font-semibold mb-4 text-white">Reset Password</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block font-medium mb-1 text-white">
                Current Password
              </label>
              <input
                type="password"
                id="current-password"
                className="w-full p-2 border border-cyan-300 bg-transparent text-white rounded placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block font-medium mb-1 text-white">
                New Password
              </label>
              <input
                type="password"
                id="new-password"
                className="w-full p-2 border border-cyan-300 bg-transparent text-white rounded placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block font-medium mb-1 text-white">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirm-password"
                className="w-full p-2 border border-cyan-300 bg-transparent text-white rounded placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              />
            </div>
            <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded shadow-lg hover:shadow-white-500/50 transition duration-300">
              Save Password
            </button>
          </div>
        </div>

        {/* Leverage Setting Section */}
        <div className="w-full py-4">
          <div className="w-full bg-black/30 backdrop-blur-md border-2 border-red-400 hover:shadow-[0_0_12px_4px_rgba(239,68,68,0.6)] text-white rounded-xl transition-transform duration-300 transform hover:scale-[1.02] overflow-hidden will-change-transform px-6 py-6">
            <h2 className="text-2xl font-semibold mb-4">Set Default Leverage</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="leverage" className="block font-medium mb-1">
                  Choose Leverage (1x - 150x)
                </label>
                <select
                  id="leverage"
                  className="w-full p-2 border border-gray-300 rounded text-black"
                >
                  <option value="1">1x</option>
                  <option value="5">5x</option>
                  <option value="10">10x</option>
                  <option value="20">20x</option>
                  <option value="50">50x</option>
                  <option value="100">100x</option>
                  <option value="150">150x</option>
                </select>
                <p className="text-sm text-gray-300">
                  This will be auto-synced with the exchange based on their allowed leverage.
                </p>
              </div>
              <button className="bg-purple-600 hover:shadow-white-500/50 transition duration-300 text-white px-4 py-2 rounded">
                Set Leverage
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}