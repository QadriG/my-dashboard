// src/components/DailyPnL.jsx
import React, { useEffect, useRef, useState } from "react";

export default function DailyPnL({ balanceData }) {
  const tableRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [range, setRange] = useState("10d"); // ✅ Default: last 10 days
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🔁 Fetch PnL data from backend
  async function fetchDailyPnL(selectedRange = "10d") {
    setLoading(true);
    setError(null);

    try {
      // Build query params
      const params = new URLSearchParams({ range: selectedRange });
      if (selectedRange === "custom") {
        // You can extend this later with start/end dates
        // For now, fall back to 10d
        params.set("range", "10d");
      }

      const res = await fetch(`/api/user/daily-pnl?${params.toString()}`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const data = await res.json();
      console.log("✅ DailyPnL data received:", data);

      // Validate and normalize data
      const normalized = (Array.isArray(data) ? data : [])
        .filter(item => item.date && (item.pnl !== undefined || item.balance !== undefined))
        .map(item => ({
          coin: item.coin || "USDT",
          balance: parseFloat(item.balance) || 0,
          pnl: parseFloat(item.pnl) || 0,
          pnlPercent: parseFloat(item.pnlPercent) || (item.balance ? ((item.pnl / item.balance) * 100).toFixed(2) : "0.00"),
          date: item.date, // should be in YYYY-MM-DD or ISO format
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // newest first

      setRows(normalized);
    } catch (err) {
      console.error("❌ Failed to fetch Daily PnL:", err);
      setError(err.message);
      setRows([]);

      // Fallback to balanceData if available
      if (balanceData?.[0]?.balance?.totalBalance) {
        const fallback = [{
          coin: "USDT",
          balance: balanceData[0].balance.totalBalance,
          pnl: 0,
          pnlPercent: "0.00",
          date: new Date().toISOString().split('T')[0],
        }];
        setRows(fallback);
      }
    } finally {
      setLoading(false);
    }
  }

  // 🔄 Fetch on range change
  useEffect(() => {
    fetchDailyPnL(range);
  }, [range]);

  // 🎨 Apply row coloring based on PnL trend
  useEffect(() => {
    if (!tableRef.current) return;
    const rows = tableRef.current.querySelectorAll("tbody tr");
    rows.forEach(row => {
      row.classList.remove("bg-green-600", "bg-red-600", "text-white");
    });

    for (let i = 0; i < rows.length - 1; i++) {
      const currentPnL = parseFloat(rows[i].children[2]?.textContent) || 0;
      const nextPnL = parseFloat(rows[i + 1].children[2]?.textContent) || 0;

      if (currentPnL > nextPnL) {
        rows[i].classList.add("bg-green-600", "text-white");
      } else if (currentPnL < nextPnL) {
        rows[i].classList.add("bg-red-600", "text-white");
      }
    }
  }, [rows]);

  return (
    <div className="dashboard-column p-6 text-center border-emerald-400">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white drop-shadow">Daily Balance & P&L</h2>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="bg-emerald-900/80 text-white px-2 py-1 rounded text-sm border border-emerald-500"
        >
          <option value="7d">Last 7 Days</option>
          <option value="10d">Last 10 Days</option> {/* ✅ Added */}
          <option value="30d">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading PnL data...</p>
      ) : error ? (
        <p className="text-red-400">Error: {error}</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-400">No PnL data available</p>
      ) : (
        <table className="w-full text-sm text-left" ref={tableRef}>
          <thead className="bg-emerald-900/80 text-white font-semibold">
            <tr>
              <th className="py-1 px-2">Coin</th>
              <th className="py-1 px-2">Balance</th>
              <th className="py-1 px-2">PnL</th>
              <th className="py-1 px-2">PnL%</th>
              <th className="py-1 px-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td className="py-1 px-2">{row.coin}</td>
                <td className="py-1 px-2">${row.balance.toFixed(2)}</td>
                <td className={`py-1 px-2 ${row.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${row.pnl.toFixed(2)}
                </td>
                <td className={`py-1 px-2 ${row.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {row.pnlPercent}%
                </td>
                <td className="py-1 px-2">{row.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}