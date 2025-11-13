import React, { useState, useEffect } from "react";
import { useAdminAuth } from "../hooks/useAdminAuth"; // ✅ Import the existing admin auth hook
import "./AdminUsers.css";

export default function Logs() {
  const { admin, loading: authLoading } = useAdminAuth(); // ✅ Get admin info from context
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
        // ✅ Make the request with credentials (this should automatically send the session cookie)
        const res = await fetch("/api/logs", {
          credentials: "include", // ✅ This automatically sends the session cookie containing the JWT
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();
        // ✅ Check if response has 'success' and 'logs'
        if (data.success && Array.isArray(data.logs)) {
          setLogs(data.logs);
        } else {
          throw new Error("Invalid response format: missing 'success' or 'logs' field");
        }
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError(`Unable to load logs: ${err.message}`);
        setLogs([]); // keep table empty
      } finally {
        setLoading(false);
      }
    };

    // ✅ Only fetch logs if the admin is authenticated
    if (admin && !authLoading) {
      fetchLogs();
    } else if (!authLoading && !admin) {
      // ✅ If not authenticated, set error
      setError("You must be logged in as an admin to view logs.");
      setLoading(false);
    }
  }, [admin, authLoading]); // ✅ Re-fetch when admin or authLoading changes

  // Compute unique filter options dynamically
  const users = ["All", ...Array.from(new Set(logs.map((l) => l.userEmail)))];
  const tvIds = ["All TV IDS", ...Array.from(new Set(logs.map((l) => l.tvId)))];
  const exchanges = ["All Exchanges", ...Array.from(new Set(logs.map((l) => l.exchange)))];

  // Apply filters
  const filteredLogs = logs.filter(
    (log) =>
      (userFilter === "All" || log.userEmail === userFilter) &&
      (tvIdFilter === "All TV IDS" || log.tvId === tvIdFilter) &&
      (exchangeFilter === "All Exchanges" || log.exchange === exchangeFilter) &&
      (dateFilter === "" || log.createdAt.includes(dateFilter))
  );

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
        <h1 className="text-3xl font-semibold drop-shadow-md">Critical Logs</h1>
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
                <th className="text-center px-4 py-3 font-semibold">Level</th>
                <th className="text-center px-4 py-3 font-semibold">Created At</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-400">
                    Loading logs...
                  </td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              )}
              {!loading && !error && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-400">
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
                    {/* ✅ User Column: Show email or "N/A" if not available */}
                    <td className="px-4 py-2 text-center">{log.userEmail || "N/A"}</td>
                    <td className="px-4 py-2 text-center">{log.tvId || "N/A"}</td>
                    <td className="px-4 py-2 text-center">{log.exchange || "N/A"}</td>
                    <td className="px-4 py-2 text-center">{log.symbol || "N/A"}</td>
                    {/* ✅ Request Column: Show request data or "N/A" if not available, handle JSON strings */}
                    <td className="px-4 py-2 text-xs break-words text-center">
                      {log.request ? (
                        typeof log.request === 'string' && log.request.startsWith('{') ? (
                          <pre className="text-left">{JSON.stringify(JSON.parse(log.request), null, 2)}</pre>
                        ) : String(log.request) // Convert to string in case it's a number/object
                      ) : "N/A"}
                    </td>
                    <td className={`px-4 py-2 font-semibold text-center ${
                      log.level === "ERROR" 
                        ? "text-red-500" 
                        : log.level === "WARN" 
                          ? "text-yellow-500" 
                          : "text-white"
                    }`}>
                      {log.message}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${
                        log.level === "ERROR" 
                          ? "bg-red-500/30 text-red-400 border border-red-500" 
                          : log.level === "WARN" 
                            ? "bg-yellow-500/30 text-yellow-400 border border-yellow-500" 
                            : "bg-gray-500/30 text-gray-400 border border-gray-500"
                      }`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">{new Date(log.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}