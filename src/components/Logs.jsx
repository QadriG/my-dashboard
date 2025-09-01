import React, { useState, useRef, useEffect } from "react";
import "./AdminUsers.css";

export default function Logs() {
  const [userFilter, setUserFilter] = useState("All");
  const [tvIdFilter, setTvIdFilter] = useState("All TV IDS");
  const [exchangeFilter, setExchangeFilter] = useState("All Exchanges");
  const [dateFilter, setDateFilter] = useState("");

  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const [logs] = useState([
    {
      user: "970 – Joseph",
      tvId: "7L",
      exchange: "bybit",
      symbol: "ETH/USDT:USDT",
      request: `{"url":"/webhook","request":"{'id':'7L','exchange':'bybit','action':'buy','market_position':'long','symbol':'ETH/USDT:USDT','qty':'10','tp':5,'sl':10}"}`,
      log: "'No Exchanges exist'",
      createdAt: "05:01:09 7/27/2025",
    },
    {
      user: "969 – haidangnguyenvi@gmail.com",
      tvId: "7L",
      exchange: "bybit",
      symbol: "ETH/USDT:USDT",
      request: `{"url":"/webhook","request":"{'id':'7L','exchange':'bybit','action':'buy','market_position':'long','symbol':'ETH/USDT:USDT','qty':'10','tp':5,'sl':10}"}`,
      log: "'No Exchanges exist'",
      createdAt: "05:01:09 7/27/2025",
    },
    {
      user: "968 – hashim",
      tvId: "7L",
      exchange: "bybit",
      symbol: "ETH/USDT:USDT",
      request: `{"url":"/webhook","request":"{'id':'7L','exchange':'bybit','action':'buy','market_position':'long','symbol':'ETH/USDT:USDT','qty':'10','tp':5,'sl':10}"}`,
      log: "'last'",
      createdAt: "05:01:09 7/27/2025",
    },
  ]);

  const filteredLogs = logs.filter(
    (log) =>
      (userFilter === "All" || log.user === userFilter) &&
      (tvIdFilter === "All TV IDS" || log.tvId === tvIdFilter) &&
      (exchangeFilter === "All Exchanges" || log.exchange === exchangeFilter) &&
      (dateFilter === "" || log.createdAt.includes(dateFilter))
  );

  const dropdownTextColor = isDarkMode ? "text-white" : "text-black";

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
    className={`w-full p-2 rounded-xl border border-cyan-400 shadow-md shadow-cyan-500/30 focus:outline-none transition duration-300 shimmer-wrapper hover:animate-shimmer ${
      isDarkMode ? "bg-black text-white" : "bg-white text-black"
    }`}
  >
    <option>All</option>
    <option>970 - Joseph</option>
    <option>969 - haidangnguyenvi@gmail.com</option>
    <option>968 - hashim</option>
  </select>

  <select
    value={tvIdFilter}
    onChange={(e) => setTvIdFilter(e.target.value)}
    className={`w-full p-2 rounded-xl border border-cyan-400 shadow-md shadow-cyan-500/30 focus:outline-none transition duration-300 shimmer-wrapper hover:animate-shimmer ${
      isDarkMode ? "bg-black text-white" : "bg-white text-black"
    }`}
  >
    <option>All TV IDS</option>
    <option>7L</option>
  </select>

  <select
    value={exchangeFilter}
    onChange={(e) => setExchangeFilter(e.target.value)}
    className={`w-full p-2 rounded-xl border border-cyan-400 shadow-md shadow-cyan-500/30 focus:outline-none transition duration-300 shimmer-wrapper hover:animate-shimmer ${
      isDarkMode ? "bg-black text-white" : "bg-white text-black"
    }`}
  >
    <option>All Exchanges</option>
    <option>bybit</option>
    <option>binance</option>
  </select>

  <input
    type="date"
    value={dateFilter}
    onChange={(e) => setDateFilter(e.target.value)}
    className={`w-full p-2 rounded-xl border border-cyan-400 shadow-md shadow-cyan-500/30 focus:outline-none transition duration-300 shimmer-wrapper hover:animate-shimmer ${
      isDarkMode ? "bg-black text-white" : "bg-white text-black"
    }`}
  />
</div>


      {/* Logs Table */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-green-400 to-red-500 shadow-[0_0_12px_4px_rgba(34,197,94,0.6)] overflow-x-auto">
  <div className={`rounded-xl p-4 ${isDarkMode ? "bg-black/30" : "bg-white/10"} backdrop-blur-md`}>
    <table className="w-full table-fixed border-collapse">
      <thead className={`${isDarkMode ? "bg-black/40 text-white" : "bg-gray-100 text-black"} rounded-xl`}>
        <tr className={`${isDarkMode ? "border-b border-cyan-400" : "border-b border-gray-400"}`}>
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
        {filteredLogs.map((log, idx) => (
          <tr
            key={idx}
            className={`shimmer-row transition-all duration-300 ${isDarkMode ? "border-b border-cyan-400 hover:bg-white/5" : "border-b border-gray-300 hover:bg-gray-200/10"}`}
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
