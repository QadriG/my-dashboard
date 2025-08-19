import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_BASE = "http://localhost:5000/api/auth";

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Password reset successful! Redirecting to login...");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(data.error || "Reset failed");
      }
    } catch {
      setError("Server error");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen text-white">
      <div className="glass-box p-8 max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold mb-6">Reset Password</h2>
        <form onSubmit={handleReset}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field w-full mb-4 px-4 py-3 rounded-lg bg-transparent text-white placeholder-white border border-white focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field w-full mb-6 px-4 py-3 rounded-lg bg-transparent text-white placeholder-white border border-white focus:outline-none"
            required
          />
          <button type="submit" className="neon-button w-full py-3 rounded-lg">
            Reset Password
          </button>
        </form>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {success && <p className="text-green-500 mt-2">{success}</p>}
      </div>
    </div>
  );
}
