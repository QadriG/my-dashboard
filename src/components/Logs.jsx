import React, { useState, useEffect } from "react";
import "./AdminUsers.css";

export default function Logs() {
  const [userFilter, setUserFilter] = useState("All");
  const [tvIdFilter, setTvIdFilter] = useState("All TV IDS");
  const [exchangeFilter, setExchangeFilter] = useState("All Exchanges");
  const [dateFilter, setDateFilter] = useState("");

  const [logs, setLogs] = useState([]);
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

  // Fetch logs from backend
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/logs", { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch logs");
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load logs");
        setLogs([]); // keep table empty
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Compute unique filter options dynamically
  const users = ["All", ...Array.from(new Set(logs.map((l) => l.user)))];
  const tvIds = ["All TV IDS", ...Array.from(new Set(logs.map((l) => l.tvId)))];
  const exchanges = ["All Exchanges", ...Array.from(new Set(logs.map((l) => l.exchange)))];

  // Apply filters
  const filteredLogs = logs.filter(
    (log) =>
      (userFilter === "All" || log.user === userFilter) &&
      (tvIdFilter === "All TV IDS" || log.tvId === tvIdFilter) &&
      (exchangeFilter === "All Exchanges" || log.exchange === exchangeFilter) &&
      (dateFilter === "" || log.createdAt.includes(dateFilter))
  );

  return (
    <main className="ml-64 flex-1 p-8 overflow-y-auto space-y-10">
      {/* Title */}
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6">
        <h1 className="text-3xl font-semibold drop-shadow-md">Logs</h1>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-4 gap-4 mb-4 w-full">
        <select
          value={userFilter}
          onChange={(e) => setUserFilter(e.target.value)}
          className={`w-full p-2 rounded-xl border border-cyan-400 shadow-md focus:outline-none ${
            isDarkMode ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          {users.map((user, idx) => (
            <option key={idx}>{user}</option>
          ))}
        </select>

        <select
          value={tvIdFilter}
          onChange={(e) => setTvIdFilter(e.target.value)}
          className={`w-full p-2 rounded-xl border border-cyan-400 shadow-md focus:outline-none ${
            isDarkMode ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          {tvIds.map((tvId, idx) => (
            <option key={idx}>{tvId}</option>
          ))}
        </select>

        <select
          value={exchangeFilter}
          onChange={(e) => setExchangeFilter(e.target.value)}
          className={`w-full p-2 rounded-xl border border-cyan-400 shadow-md focus:outline-none ${
            isDarkMode ? "bg-black text-white" : "bg-white text-black"
          }`}
        >
          {exchanges.map((exchange, idx) => (
            <option key={idx}>{exchange}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={`w-full p-2 rounded-xl border border-cyan-400 shadow-md focus:outline-none ${
            isDarkMode ? "bg-black text-white" : "bg-white text-black"
          }`}
        />
      </div>

      {/* Logs Table */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-green-400 to-red-500 shadow-lg overflow-x-auto">
        <div
          className={`rounded-xl p-4 ${
            isDarkMode ? "bg-black/30" : "bg-white/10"
          } backdrop-blur-md`}
        >
          <table className="w-full table-fixed border-collapse">
            <thead
              className={`${
                isDarkMode ? "bg-black/40 text-white" : "bg-gray-100 text-black"
              }`}
            >
              <tr className={isDarkMode ? "border-b border-cyan-400" : "border-b border-gray-400"}>
                <th className="text-center px-4 py-3 font-semibold">User</th>
                <th className="text-center px-4 py-3 font-semibold">TV ID</th>
                <th className="text-center px-4 py-3 font-semibold">Exchange</th>
                <th className="text-center px-4 py-3 font-semibold">Symbol</th>
                <th className="text-center px-4 py-3 font-semibold">Request</th>
                <th className="text-center px-4 py-3 font-semibold">Log</th>
                <th className="text-center px-4 py-3 font-semibold">Created At</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400">
                    Loading logs...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-gray-400">
                    No logs found.
                  </td>
                </tr>
              )}
              {!loading &&
                !error &&
                filteredLogs.map((log, idx) => (
                  <tr
                    key={idx}
                    className={`shimmer-row transition-all duration-300 ${
                      isDarkMode
                        ? "border-b border-cyan-400 hover:bg-white/5"
                        : "border-b border-gray-300 hover:bg-gray-200/10"
                    }`}
                  >
                    <td className="px-4 py-2 text-center">{log.user}</td>
                    <td className="px-4 py-2 text-center">{log.tvId}</td>
                    <td className="px-4 py-2 text-center">{log.exchange}</td>
                    <td className="px-4 py-2 text-center">{log.symbol}</td>
                    <td className="px-4 py-2 text-xs break-words text-center">{log.request}</td>
                    <td className="px-4 py-2 text-red-500 font-semibold text-center">{log.log}</td>
                    <td className="px-4 py-2 text-center">{log.createdAt}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
