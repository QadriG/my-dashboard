import React, { useState } from "react";
import "./AdminUsers.css"; // We'll add the shimmer CSS here

export default function AdminUsers() {
  const [users, setUsers] = useState([
    {
      id: 3,
      email: "alice@example.com",
      name: "Alice",
      api: "Binance",
      free: 50,
      used: 15,
      total: 65,
      createdAt: "7/11/2025",
      lastActivity: "2025-07-27T10:00:00Z",
      emailVerified: true,
    },
    {
      id: 2,
      email: "bob@example.com",
      name: "Bob",
      api: "OKX",
      free: 30,
      used: 10,
      total: 40,
      createdAt: "7/12/2025",
      lastActivity: "2025-07-26T09:30:00Z",
      emailVerified: true,
    },
    {
      id: 1,
      email: "eve@example.com",
      name: "Eve",
      api: "Binance",
      free: 18,
      used: 7,
      total: 25,
      createdAt: "7/13/2025",
      lastActivity: "2025-07-24T17:30:00Z",
      emailVerified: true,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const getStatus = (lastActivity) => {
    const last = new Date(lastActivity);
    const now = new Date();
    const diffHours = (now - last) / 36e5;
    return diffHours <= 24 ? "Active" : "Inactive";
  };

  const getStatusColor = (status) =>
    status === "Active" ? "text-green-400" : "text-red-400";

  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    const status = getStatus(user.lastActivity).toLowerCase();
    if (!term) return true;
    if (term === "free" && user.free > 0) return true;
    if (term === "active" && status === "active") return true;
    if (term === "inactive" && status === "inactive") return true;
    return (
      user.email.toLowerCase().includes(term) ||
      user.name.toLowerCase().includes(term) ||
      user.api.toLowerCase().includes(term)
    );
  });

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
          placeholder="Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 bg-white text-black rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        <button
          onClick={() => setSearchTerm(searchTerm)}
          className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shimmer-button"
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
      <th className="px-2 py-2 font-semibold w-20">API</th>
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
      const status = getStatus(user.lastActivity);
      return (
        <tr
          key={user.id}
          className={`relative overflow-hidden rounded-xl border border-cyan-400 shimmer-row mb-6 text-center`}
        >
          <td className="px-2 py-2 font-semibold">{user.id}</td>
          <td className="px-2 py-2 truncate">{user.email}</td>
          <td className="px-2 py-2 truncate">{user.name}</td>
          <td className="px-2 py-2 truncate">{user.api}</td>
          <td className="px-2 py-2">{user.free.toFixed(2)}</td>
          <td className="px-2 py-2">{user.used.toFixed(2)}</td>
          <td className="px-2 py-2">{user.total.toFixed(2)}</td>
          <td className="px-2 py-2">{user.createdAt}</td>
          <td className={`px-2 py-2 text-sm font-medium ${getStatusColor(status)}`}>
            {status}
          </td>
          <td className="px-2 py-2">
            <div className="flex justify-between">
              <button className="bg-yellow-400 text-black px-3 py-2 rounded text-sm shimmer-button flex-1 mx-0.5">
                Pause
              </button>
              <button className="bg-blue-600 text-white px-3 py-2 rounded text-sm shimmer-button flex-1 mx-0.5">
                Disable
              </button>
              <button className="bg-blue-500 text-white px-3 py-2 rounded text-sm shimmer-button flex-1 mx-0.5">
                Stats
              </button>
              <button className="bg-yellow-500 text-black px-3 py-2 rounded text-sm shimmer-button flex-1 mx-0.5">
                Positions
              </button>
              <button className="bg-red-500 text-white px-3 py-2 rounded text-sm shimmer-button flex-1 mx-0.5">
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
