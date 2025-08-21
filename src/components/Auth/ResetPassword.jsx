import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) return setError("Passwords do not match");

    try {
      const res = await fetch(`http://localhost:5000/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Password reset successful! Redirecting to login...");
        setTimeout(() => navigate("/my-dashboard/login"), 2000);
      } else setError(data.message || "Failed to reset password");
    } catch {
      setError("Server error");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen w-screen text-white bg-black">
      <form onSubmit={handleReset} className="p-8 bg-gray-900 rounded-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">Reset Password</h2>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-gray-800"
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full mb-6 p-3 rounded bg-gray-800"
          required
        />
        <button type="submit" className="w-full p-3 bg-orange-500 rounded">Reset Password</button>
        {error && <p className="text-red-500 mt-2">{error}</p>}
        {success && <p className="text-green-500 mt-2">{success}</p>}
      </form>
    </div>
  );
}
