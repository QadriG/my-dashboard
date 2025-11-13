import React, { useState, useEffect } from "react";
import { useAdminAuth } from "../hooks/useAdminAuth"; // ✅ Import the existing admin auth hook
import "./AdminUsers.css";
export default function ManualPush() {
  const { admin, loading: authLoading } = useAdminAuth(); // ✅ Get admin info from context
  const [positionData, setPositionData] = useState(`{
  "id": "1L",
  "exchange": "bybit",
  "password": "5555",
  "action": "buy",
  "market_position": "long",
  "symbol": "BTC/USDT:USDT",
  "qty": "3",
  "tp": 3
}`);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ Start with false, set to true only during API calls
  const [error, setError] = useState("");
  const [showNoUserError, setShowNoUserError] = useState(false); // ✅ New state for the specific error
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
  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true); // ✅ Set loading only during fetch
        setError("");
        // ✅ Make the request with credentials (this should automatically send the session cookie)
        const res = await fetch("/api/admin/users", {
          credentials: "include", // ✅ This automatically sends the session cookie containing the JWT
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        // ✅ Check if response has 'success' and 'users'
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
          // ✅ Set selectedUsers to empty array initially
          setSelectedUsers([]);
        } else {
          throw new Error("Invalid response format: missing 'success' or 'users' field");
        }
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(`Unable to load users: ${err.message}`);
        setUsers([]); // keep table empty
      } finally {
        setLoading(false); // ✅ Stop loading after fetch completes
      }
    };
    // ✅ Only fetch users if the admin is authenticated
    if (admin && !authLoading) {
      fetchUsers();
    } else if (!authLoading && !admin) {
      // ✅ If not authenticated, set error
      setError("You must be logged in as an admin to view users.");
      setLoading(false);
    }
  }, [admin, authLoading]); // ✅ Re-fetch when admin or authLoading changes
  const handleUserSelect = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };
  const handlePushPositions = async () => {
    // ✅ Reset previous "no user" error
    setShowNoUserError(false);
    // ✅ Validate selected users first
    if (selectedUsers.length === 0) {
      setShowNoUserError(true); // ✅ Show the specific error
      return; // ✅ Exit early, don't proceed
    }
    // ✅ If users are selected, hide the "no user" error and proceed
    setShowNoUserError(false);
    try {
      setLoading(true); // ✅ Set loading only during API call
      setError("");
      // ✅ Parse position data
      let position;
      try {
        position = JSON.parse(positionData);
      } catch (parseErr) {
        setError("Invalid position data: " + parseErr.message);
        setLoading(false);
        return;
      }
      // ✅ Validate position data
      if (!position.id || !position.exchange || !position.password || !position.action || !position.market_position || !position.symbol || !position.qty || position.tp === undefined) {
        setError("Position data is missing required fields");
        setLoading(false);
        return;
      }
      // ✅ Send position data to backend
      const res = await fetch("/api/admin/manual-push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          position,
          userIds: selectedUsers,
        }),
        credentials: "include", // ✅ This automatically sends the session cookie containing the JWT
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success) {
        alert("Positions pushed successfully");
        // ✅ Reset form
        setPositionData(`{
  "id": "1L",
  "exchange": "bybit",
  "password": "5555",
  "action": "buy",
  "market_position": "long",
  "symbol": "BTC/USDT:USDT",
  "qty": "3",
  "tp": 3
}`);
        setSelectedUsers([]);
      } else {
        throw new Error(data.message || "Failed to push positions");
      }
    } catch (err) {
      console.error("Error pushing positions:", err);
      setError(`Unable to push positions: ${err.message}`);
    } finally {
      setLoading(false); // ✅ Stop loading after API call completes
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
      {/* Error Message for No Users Selected - Centered and outside both boxes */}
      {showNoUserError && (
        <div className="text-center mb-4">
          <p className="text-red-500 font-semibold text-lg">Please select at least one user.</p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        {/* Position Data */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-green-400 to-red-500 shadow-lg">
          <div className={`rounded-xl p-4 ${isDarkMode ? "bg-black/30" : "bg-white/10"} backdrop-blur-md`}>
            <h2 className="text-xl font-semibold mb-4">Position Data</h2>
            <textarea
              value={positionData}
              onChange={(e) => setPositionData(e.target.value)}
              className={`w-full h-64 p-4 rounded-xl border border-cyan-400 shadow-md focus:outline-none ${
                isDarkMode ? "bg-black text-white" : "bg-white text-black"
              }`}
              placeholder="Enter position data as JSON"
            />
            <button
              onClick={handlePushPositions}
              disabled={loading}
              className={`mt-4 px-4 py-2 rounded-xl ${
                loading
                  ? "bg-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              {loading ? "Pushing..." : "Push Positions"}
            </button>
          </div>
        </div>
        {/* Select User */}
        <div className="p-6 rounded-xl bg-gradient-to-r from-green-400 to-red-500 shadow-lg">
          <div className={`rounded-xl p-4 ${isDarkMode ? "bg-black/30" : "bg-white/10"} backdrop-blur-md`}>
            <h2 className="text-xl font-semibold mb-4">Select User</h2>
            {loading && !users.length ? ( // ✅ Show loading only during initial fetch
              <p className="text-gray-400">Loading users...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <>
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedUsers.length === users.length}
                    onChange={handleSelectAll}
                    className="mr-2"
                  />
                  <label htmlFor="selectAll" className="text-sm">
                    Select All ({users.length} connected)
                  </label>
                </div>
                {users.length === 0 ? (
                  <p className="text-gray-400">No users found.</p>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleUserSelect(user.id)}
                          className="mr-2"
                        />
                        <label htmlFor={`user-${user.id}`} className="text-sm">
                          {user.email} ({user.name}) - Balance: ${user.total.toFixed(2)} Free: ${user.free.toFixed(2)}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                {/* ✅ Removed the error message from here */}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}