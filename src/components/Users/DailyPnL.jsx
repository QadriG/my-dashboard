// src/components/DailyPnL.jsx
import React, { useEffect, useRef, useState } from "react";

export default function DailyPnL({ balanceData }) {
  const tableRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [range, setRange] = useState("all"); // ✅ Default: show all data

  useEffect(() => {
    if (balanceData && balanceData.length > 0) {
      const item = balanceData[0];
      const snapshots = item.dailyPnLSnapshots || [];

      // Sort by date descending
      const sorted = [...snapshots].sort((a, b) => new Date(b.date) - new Date(a.date));

      setRows(sorted);
    }
  }, [balanceData]);

  useEffect(() => {
    if (!tableRef.current) return;
    const trs = tableRef.current.querySelectorAll("tbody tr");
    for (let i = 0; i < trs.length - 1; i++) {
      const current = parseFloat(trs[i].children[2].textContent);
      const next = parseFloat(trs[i + 1].children[2].textContent);
      if (current > next) {
        trs[i].classList.add("bg-green-600", "text-white");
      } else if (current < next) {
        trs[i].classList.add("bg-red-600", "text-white");
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
          <option value="all">All Time</option>
          <option value="7d">Last 7 Days</option>
          <option value="10d">Last 10 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

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
          {rows.length > 0 ? (
            rows.map((row, idx) => (
              <tr key={idx}>
                <td className="py-1 px-2">{row.coin || 'USDT'}</td>
                <td className="py-1 px-2">${row.balance.toFixed(2)}</td>
                <td className={`py-1 px-2 ${row.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${row.pnl.toFixed(2)}
                </td>
                <td className={`py-1 px-2 ${row.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {row.pnlPercent}%
                </td>
                <td className="py-1 px-2">{row.date}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-2 text-gray-400">
                No PnL data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}