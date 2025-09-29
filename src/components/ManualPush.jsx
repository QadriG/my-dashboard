import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "../styles/globals.css";
import "../styles/sidebar.css";

export default function ManualPush() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [jsonInput, setJsonInput] = useState(`{
  "id": "1L",
  "exchange": "bybit",
  "password": "5555",
  "action": "buy",
  "market_position": "long",
  "symbol": "BTC/USDT:USDT",
  "qty": "3",
  "tp": 3
}`);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const textareaRef = useRef(null);

  // Fetch users from backend
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/users"); // Adjust endpoint if needed
        setUsers(res.data || []);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch users");
        setLoading(false);
      }
    };

    fetchUsers();
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Handle checkbox selection
  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  // Push JSON to backend
  const handlePush = async () => {
    if (selectedUsers.length === 0) {
      alert("Please select at least one user to push.");
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const payload = {
        users: selectedUsers,
        data: parsed,
      };

      const res = await axios.post("/api/manual-push", payload); // Backend endpoint
      setSuccessMessage("Push successful!");
      console.log("Push response:", res.data);
    } catch (err) {
      console.error("Push failed:", err);
      alert("Push failed! Check console for details.");
    }
  };

  return (
    <main className="ml-64 flex-1 p-8 overflow-y-auto space-y-10">
      {/* Title */}
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6">
        <h1 className="text-3xl font-semibold drop-shadow-md">Manual Push</h1>
      </div>

      {/* Error / Success Messages */}
      {error && <p className="text-red-500 font-semibold">{error}</p>}
      {successMessage && <p className="text-green-500 font-semibold">{successMessage}</p>}

      {/* Push JSON Section */}
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        {/* JSON Input */}
        <div className="glass-box neon-hover rounded-xl p-6 w-full border border-cyan-400 transition duration-300">
          <textarea
            ref={textareaRef}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className={`w-full h-60 border rounded p-4 font-mono resize-none ${
              isDarkMode
                ? "bg-black text-white border-cyan-400"
                : "bg-white text-black border-gray-400"
            }`}
          />
          <button
            onClick={handlePush}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-10 rounded transition"
          >
            Push
          </button>
        </div>

        {/* Users List */}
        <div className="glass-box neon-hover rounded-xl p-6 w-full border border-cyan-400 transition duration-300">
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <div className="max-h-[30rem] overflow-y-auto space-y-2">
              {users.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center justify-between border border-cyan-400 rounded-lg p-2 transition hover:scale-[1.01] neon-row-hover"
                >
                  <span>
                    {user.id} : {user.name} (${user.balance})
                  </span>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                  />
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
