import React, { useState, useEffect } from "react";
import { useAdminAuth } from "../hooks/useAdminAuth";
import "./AdminUsers.css";
export default function ManualPush() {
  const { admin, loading: authLoading } = useAdminAuth();
  const [positionData, setPositionData] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  // Dark mode detection
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);
  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/admin/users", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err) {
        console.error(err);
        setError("Unable to load users");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);
  // Handle user selection
  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };
  // Handle push
  const handlePush = async () => {
    try {
      setLoading(true);
      setError("");
      const parsedData = JSON.parse(positionData);
      const payload = {
        positionData: parsedData,
        selectedUsers: selectedUsers
      };
      const res = await fetch("/api/admin/manual-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to push position data");
      alert("Position data pushed successfully!");
      setPositionData("");
      setSelectedUsers([]);
    } catch (err) {
      console.error(err);
      setError(`Failed to push position data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  if (authLoading) {
    return <div className="text-white text-center mt-20">Checking authentication...</div>;
  }
  if (!admin) {
    return <div className="text-red-500 text-center mt-20">Access denied: Admins only</div>;
  }
  return (
    <main className="ml-64 flex-1 p-8 overflow-y-auto space-y-10">
      {/* Title */}
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6">
        <h1 className="text-3xl font-semibold drop-shadow-md">Manual Push</h1>
      </div>
      {/* Main Content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Position Data Section */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border-2 border-cyan-400">
          <h2 className="text-xl font-semibold mb-4">Position Data</h2>
          <textarea
            value={positionData}
            onChange={(e) => setPositionData(e.target.value)}
            placeholder='{
  "id": "1L",
  "exchange": "bybit",
  "password": "5555",
  "action": "buy",
  "market_position": "long",
  "symbol": "BTCUSDT",
  "side": "buy",
  "amount": 1,
  "price": 60000
}'
            className={`w-full h-64 p-3 rounded-xl border border-cyan-400 shadow-md focus:outline-none ${
              isDarkMode ? "bg-black text-white" : "bg-white text-black"
            }`}
          />
          <button
            onClick={handlePush}
            disabled={loading || !positionData.trim()}
            className={`mt-4 px-4 py-2 rounded-xl ${
              loading || !positionData.trim()
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
          >
            {loading ? "Pushing..." : "Push"}
          </button>
        </div>
        {/* Select User Section */}
        <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border-2 border-cyan-400">
          <h2 className="text-xl font-semibold mb-4">Select User</h2>
          {loading ? (
            <p className="text-gray-400">Loading users...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="selectAll"
                  onChange={() => {
                    if (selectedUsers.length === users.length) {
                      setSelectedUsers([]);
                    } else {
                      setSelectedUsers(users.map(u => u.id));
                    }
                  }}
                  checked={selectedUsers.length === users.length && users.length > 0}
                  className="mr-2"
                />
                <label htmlFor="selectAll" className="text-sm">
                  Select All ({users.length} connected)
                </label>
              </div>
              {users.map(user => (
                <div key={user.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`user-${user.id}`}
                    onChange={() => handleUserSelect(user.id)}
                    checked={selectedUsers.includes(user.id)}
                    className="mr-2"
                  />
                  <label htmlFor={`user-${user.id}`} className="text-sm">
                    {user.name} ({user.email}) - Balance: ${user.balance?.toFixed(2) || "0"} Free: ${user.free?.toFixed(2) || "0"}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}