import React, { useState } from "react";

export default function Settings() {
  // State for password reset
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  // State for leverage
  const [leverage, setLeverage] = useState("1");
  const [leverageMessage, setLeverageMessage] = useState("");

  // Submit password reset
  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage("❌ New password and confirm password do not match.");
      return;
    }

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordMessage("✅ Password updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage(`❌ ${data.message || "Error updating password."}`);
      }
    } catch (err) {
      setPasswordMessage("❌ Server error. Please try again later.");
    }
  };

  // Submit leverage setting
  const handleLeverageSet = async () => {
    try {
      const res = await fetch("/api/set-leverage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leverage }),
      });

      const data = await res.json();
      if (res.ok) {
        setLeverageMessage("✅ Leverage updated successfully.");
      } else {
        setLeverageMessage(`❌ ${data.message || "Error setting leverage."}`);
      }
    } catch (err) {
      setLeverageMessage("❌ Server error. Please try again later.");
    }
  };

  return (
    <main className="ml-64 p-8 overflow-y-auto space-y-10">
      {/* Title */}
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6">
        <h1 className="text-3xl font-semibold drop-shadow-md">Settings</h1>
      </div>

      {/* Reset Password Section */}
      <div className="bg-black/30 backdrop-blur-md border-2 border-green-400 hover:shadow-[0_0_12px_4px_rgba(34,197,94,0.6)] p-6 rounded-xl w-full mb-10 transition-transform duration-300 transform hover:scale-[1.02] overflow-hidden">
        <h2 className="text-2xl font-semibold mb-4">Reset Password</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="current-password" className="block font-medium mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-2 border border-cyan-300 bg-transparent rounded placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block font-medium mb-1">
              New Password
            </label>
            <input
              type="password"
              id="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border border-cyan-300 bg-transparent rounded placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block font-medium mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border border-cyan-300 bg-transparent rounded placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>
          <button
            onClick={handlePasswordReset}
            className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded shadow-lg hover:shadow-white-500/50 transition duration-300"
          >
            Save Password
          </button>
          {passwordMessage && (
            <p className="mt-2 text-sm">{passwordMessage}</p>
          )}
        </div>
      </div>

      {/* Leverage Setting Section */}
      <div className="w-full py-4">
        <div className="w-full bg-black/30 backdrop-blur-md border-2 border-red-400 hover:shadow-[0_0_12px_4px_rgba(239,68,68,0.6)] rounded-xl transition-transform duration-300 transform hover:scale-[1.02] overflow-hidden px-6 py-6">
          <h2 className="text-2xl font-semibold mb-4">Set Default Leverage</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="leverage" className="block font-medium mb-1">
                Choose Leverage (1x - 150x)
              </label>
              <select
                id="leverage"
                value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            <button
              onClick={handleLeverageSet}
              className="bg-purple-600 hover:bg-purple-700 transition duration-300 text-white px-4 py-2 rounded"
            >
              Set Leverage
            </button>
            {leverageMessage && (
              <p className="mt-2 text-sm">{leverageMessage}</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
