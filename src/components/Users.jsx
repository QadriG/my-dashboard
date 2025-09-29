import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState({}); // e.g. { "3_pause": true }
  const navigate = useNavigate();

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/admin/users", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok || data.success) {
        // API returns { success: true, users: [...] } or just users array
        setUsers(data.users || data || []);
      } else {
        setError(data.message || data.error || "Failed to fetch users");
      }
    } catch (err) {
      console.error("fetchUsers error:", err);
      setError("Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // derive friendly status display & color
  const statusDisplay = (user) => {
    // prefer explicit user.status if present, else fallback to recent activity
    const s = (user.status || "").toLowerCase();
    if (s === "paused") return "Paused";
    if (s === "disabled") return "Disabled";
    // fallback based on lastActivity recency
    if (user.lastActivity) {
      const diffHours = (new Date() - new Date(user.lastActivity)) / 36e5;
      return diffHours <= 24 ? "Active" : "Inactive";
    }
    return "Inactive";
  };

  const statusClass = (user) => {
    const s = (user.status || "").toLowerCase();
    if (s === "paused") return "text-amber-400";
    if (s === "disabled") return "text-red-400";
    // fallback to activity
    if (user.lastActivity) {
      const diffHours = (new Date() - new Date(user.lastActivity)) / 36e5;
      return diffHours <= 24 ? "text-green-400" : "text-red-400";
    }
    return "text-red-400";
  };

  // Filter users by search term (email, name, apis, status, free)
  const filteredUsers = users.filter((user) => {
    const term = (searchTerm || "").trim().toLowerCase();
    if (!term) return true;

    if (term === "free" && user.free > 0) return true;
    const status = (user.status || statusDisplay(user) || "").toLowerCase();
    if (term === "active" && status === "active") return true;
    if (term === "inactive" && status === "inactive") return true;
    if (term === "paused" && status === "paused") return true;
    if (term === "disabled" && status === "disabled") return true;

    const apiNames = (user.apis || []).map((a) => a.exchangeName || "").join(" ").toLowerCase();

    return (
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.name && user.name.toLowerCase().includes(term)) ||
      apiNames.includes(term)
    );
  });

  // helper to set action loading flag
  const setActionFlag = (key, value) =>
    setActionLoading((prev) => ({ ...prev, [key]: value }));

  // Generic action handler (pause / disable / delete)
  const handleAction = async (userId, action) => {
    const key = `${userId}_${action}`;
    if (action === "delete" && !window.confirm("Are you sure you want to DELETE this user? This is permanent.")) return;
    if (action === "disable" && !window.confirm("Disable this user? They will be prevented from logging in.")) return;

    try {
      setActionFlag(key, true);

      let url = `http://localhost:5000/api/admin/users/${userId}`;
      let method = "PATCH";
      if (action === "delete") method = "DELETE";
      else if (action === "pause" || action === "unpause" || action === "disable" || action === "enable") {
        url += `/${action === "unpause" ? "unpause" : action === "enable" ? "enable" : action}`;
      } else {
        return window.alert("Invalid action");
      }

      const res = await fetch(url, { method, credentials: "include" });
      const data = await res.json();

      if (!res.ok && !data.success) {
        const msg = data.message || data.error || "Action failed";
        window.alert(msg);
        return;
      }

      window.alert(data.message || `${action} successful`);

      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          if (action === "delete") return u; // will remove below
          if (action === "pause" || action === "unpause") return { ...u, status: action === "pause" ? "paused" : "active", updatedAt: new Date().toISOString() };
          if (action === "disable" || action === "enable") return { ...u, status: action === "disable" ? "disabled" : "active", updatedAt: new Date().toISOString() };
          return u;
        })
      );

      if (action === "delete") {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (err) {
      console.error("handleAction error:", err);
      window.alert("Action failed (network error)");
    } finally {
      setActionFlag(key, false);
    }
  };

  // Navigate admin to user's dashboard (for stats) and positions pages
  const handleStats = (userId) => {
    navigate(`/admin/users/${userId}/dashboard`, { state: { adminView: true } });
  };

  const handlePositions = (userId) => {
    navigate(`/admin/users/${userId}/positions`, { state: { adminView: true } });
  };

  if (loading) return <p className="text-white text-center mt-8">Loading users...</p>;
  if (error) return <p className="text-red-500 text-center mt-8">{error}</p>;

  return (
    <main className="ml-64 p-8 overflow-y-auto space-y-10">
      {/* Title */}
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6">
        <h1 className="text-3xl font-semibold drop-shadow-md">Users</h1>
      </div>


      {/* Search */}
      <div className="flex items-center mb-4">
        <input
          type="text"
          placeholder="Search (email, name, api, status)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 bg-white text-black rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setSearchTerm(searchTerm)}
          className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Search
        </button>
        <button
          onClick={() => fetchUsers()}
          className="ml-2 bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 rounded"
          title="Refresh"
        >
          Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="p-[2px] rounded-xl bg-gradient-to-r from-green-400 to-red-500 shadow-[0_0_12px_4px_rgba(34,197,94,0.6)]">
        <div className="rounded-xl bg-black/30 backdrop-blur-md p-6">
          <table className="w-full text-white table-fixed border-collapse">
            <thead className="bg-black/40 backdrop-blur-md text-white rounded-xl">
              <tr className="border border-cyan-400 rounded-xl text-center">
                <th className="px-2 py-2 font-semibold w-8">ID</th>
                <th className="px-2 py-2 font-semibold w-36">Email</th>
                <th className="px-2 py-2 font-semibold w-24">Name</th>
                <th className="px-2 py-2 font-semibold w-32">APIs</th>
                <th className="px-2 py-2 font-semibold w-12">Free</th>
                <th className="px-2 py-2 font-semibold w-12">Used</th>
                <th className="px-2 py-2 font-semibold w-16">Total</th>
                <th className="px-2 py-2 font-semibold w-20">Created At</th>
                <th className="px-2 py-2 font-semibold w-16">Status</th>
                <th className="px-2 py-2 font-semibold w-64">Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const disp = statusDisplay(user);
                const apiNames = user.apis?.map((a) => a.exchangeName).join(", ") || "-";
                const pauseKey = `${user.id}_pause`;
                const disableKey = `${user.id}_disable`;
                const deleteKey = `${user.id}_delete`;

                return (
                  <tr
                    key={user.id}
                    className="relative overflow-hidden rounded-xl border border-cyan-400 mb-6 text-center"
                  >
                    <td className="px-2 py-2 font-semibold">{user.id}</td>
                    <td className="px-2 py-2 truncate">{user.email}</td>
                    <td className="px-2 py-2 truncate">{user.name || "-"}</td>
                    <td className="px-2 py-2 truncate">{apiNames}</td>
                    <td className="px-2 py-2">{(user.free ?? 0).toFixed(2)}</td>
                    <td className="px-2 py-2">{(user.used ?? 0).toFixed(2)}</td>
                    <td className="px-2 py-2">{(user.total ?? 0).toFixed(2)}</td>
                    <td className="px-2 py-2">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className={`px-2 py-2 text-sm font-medium ${statusClass(user)}`}>
                      {disp}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1 justify-between">
                        {/* Pause / Unpause */}
                        <button
                          onClick={() =>
                            handleAction(user.id, user.status === "paused" ? "unpause" : "pause")
                          }
                          disabled={!!actionLoading[pauseKey]}
                          className={`px-3 py-2 rounded text-sm flex-1 ${
                            actionLoading[pauseKey]
                              ? "opacity-60"
                              : user.status === "paused"
                              ? "bg-green-400 text-black"
                              : "bg-yellow-400 text-black"
                          }`}
                        >
                          {actionLoading[pauseKey]
                            ? user.status === "paused"
                              ? "Unpausing..."
                              : "Pausing..."
                            : user.status === "paused"
                            ? "Unpause"
                            : "Pause"}
                        </button>

                        {/* Disable / Enable */}
                        <button
                          onClick={() =>
                            handleAction(
                              user.id,
                              user.status === "disabled" ? "enable" : "disable"
                            )
                          }
                          disabled={!!actionLoading[disableKey]}
                          className={`px-3 py-2 rounded text-sm flex-1 ${
                            actionLoading[disableKey]
                              ? "opacity-60"
                              : user.status === "disabled"
                              ? "bg-green-600 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {actionLoading[disableKey]
                            ? user.status === "disabled"
                              ? "Enabling..."
                              : "Disabling..."
                            : user.status === "disabled"
                            ? "Enable"
                            : "Disable"}
                        </button>

                        {/* Stats */}
                        <button
                          onClick={() => handleStats(user.id)}
                          className="bg-blue-500 text-white px-3 py-2 rounded text-sm flex-1"
                        >
                          Stats
                        </button>

                        {/* Positions */}
                        <button
                          onClick={() => handlePositions(user.id)}
                          className="bg-yellow-500 text-black px-3 py-2 rounded text-sm flex-1"
                        >
                          Positions
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleAction(user.id, "delete")}
                          disabled={!!actionLoading[deleteKey]}
                          className={`px-3 py-2 rounded text-sm flex-1 ${
                            actionLoading[deleteKey]
                              ? "opacity-60"
                              : "bg-red-500 text-white"
                          }`}
                        >
                          {actionLoading[deleteKey] ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr><td colSpan={10} className="py-6 text-center text-gray-400">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}