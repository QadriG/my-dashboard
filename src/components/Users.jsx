import React, { useEffect, useState } from "react";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/users", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      } else {
        setError(data.error || "Failed to fetch users");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // User status based on lastActivity
  const getStatus = (lastActivity) => {
    if (!lastActivity) return "Inactive";
    const last = new Date(lastActivity);
    const now = new Date();
    const diffHours = (now - last) / 36e5;
    return diffHours <= 24 ? "Active" : "Inactive";
  };

  const getStatusColor = (status) =>
    status === "Active" ? "text-green-400" : "text-red-400";

  // Filter users based on search term
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const status = getStatus(user.updatedAt).toLowerCase();
    if (!term) return true;
    if (term === "free" && user.free > 0) return true;
    if (term === "active" && status === "active") return true;
    if (term === "inactive" && status === "inactive") return true;
    const apiNames = user.apis?.map((a) => a.exchangeName.toLowerCase()).join(", ") || "";
    return (
      (user.email && user.email.toLowerCase().includes(term)) ||
      (user.name && user.name.toLowerCase().includes(term)) ||
      apiNames.includes(term)
    );
  });

  // Generic action handler (Pause, Disable, Delete)
  const handleAction = async (userId, action) => {
    try {
      let url = `http://localhost:5000/api/admin/users/${userId}`;
      let method = "PATCH";

      if (action === "delete") {
        method = "DELETE";
      } else {
        url += `/${action}`;
      }

      const res = await fetch(url, { method, credentials: "include" });
      const data = await res.json();
      alert(data.message);

      if (action === "delete") {
        setUsers(users.filter((u) => u.id !== userId));
      } else {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      alert("Action failed");
    }
  };

  // Stats button handler
  const handleStats = async (userId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/users/${userId}/stats`,
        { method: "GET", credentials: "include" }
      );
      const data = await res.json();
      alert(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
      alert("Failed to fetch stats");
    }
  };

  // Positions button handler
  const handlePositions = async (userId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/users/${userId}/positions`,
        { method: "GET", credentials: "include" }
      );
      const data = await res.json();
      alert(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(err);
      alert("Failed to fetch positions");
    }
  };

  if (loading)
    return <p className="text-white text-center mt-8">Loading users...</p>;
  if (error) return <p className="text-red-500 text-center mt-8">{error}</p>;

  return (
    <main className="ml-64 p-8 overflow-y-auto space-y-10">
      {/* Title */}
      <div className="w-full py-4 px-6 mb-6">
        <h1 className="text-3xl font-semibold drop-shadow-md">Users</h1>
      </div>

      {/* Search */}
      <div className="flex items-center mb-4">
        <input
          type="text"
          placeholder="Search"
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
                <th className="px-2 py-2 font-semibold w-16">Total USDT</th>
                <th className="px-2 py-2 font-semibold w-20">Created At</th>
                <th className="px-2 py-2 font-semibold w-16">Status</th>
                <th className="px-2 py-2 font-semibold w-64">Manage</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const status = getStatus(user.updatedAt);
                const apiNames = user.apis?.map((a) => a.exchangeName).join(", ") || "-";
                return (
                  <tr
                    key={user.id}
                    className="relative overflow-hidden rounded-xl border border-cyan-400 mb-6 text-center"
                  >
                    <td className="px-2 py-2 font-semibold">{user.id}</td>
                    <td className="px-2 py-2 truncate">{user.email}</td>
                    <td className="px-2 py-2 truncate">{user.name}</td>
                    <td className="px-2 py-2 truncate">{apiNames}</td>
                    <td className="px-2 py-2">{user.free?.toFixed(2) || 0}</td>
                    <td className="px-2 py-2">{user.used?.toFixed(2) || 0}</td>
                    <td className="px-2 py-2">{user.total?.toFixed(2) || 0}</td>
                    <td className="px-2 py-2">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className={`px-2 py-2 text-sm font-medium ${getStatusColor(status)}`}>
                      {status}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex gap-1 justify-between">
                        <button
                          onClick={() => handleAction(user.id, "pause")}
                          className="bg-yellow-400 text-black px-3 py-2 rounded text-sm flex-1"
                        >
                          Pause
                        </button>
                        <button
                          onClick={() => handleAction(user.id, "disable")}
                          className="bg-blue-600 text-white px-3 py-2 rounded text-sm flex-1"
                        >
                          Disable
                        </button>
                        <button
                          onClick={() => handleStats(user.id)}
                          className="bg-blue-500 text-white px-3 py-2 rounded text-sm flex-1"
                        >
                          Stats
                        </button>
                        <button
                          onClick={() => handlePositions(user.id)}
                          className="bg-yellow-500 text-black px-3 py-2 rounded text-sm flex-1"
                        >
                          Positions
                        </button>
                        <button
                          onClick={() => handleAction(user.id, "delete")}
                          className="bg-red-500 text-white px-3 py-2 rounded text-sm flex-1"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
