// src/components/Users/DailyPnL.jsx

import React, { useEffect, useRef, useState } from "react";

export default function DailyPnL({ balanceData }) {
  const tableRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [range, setRange] = useState("all");

  useEffect(() => {
    const snapshots = balanceData?.dailyPnL || [];
    
    const enriched = snapshots.map(item => ({
      coin: item.symbol || 'USDT',
      balance: item.balance || 0,
      pnl: typeof item.pnl === 'number' ? item.pnl : 0,
      pnlPercent: typeof item.pnlPercent === 'number' ? item.pnlPercent : 0,
      date: item.date || '',
      side: item.side || '',
      qty: item.qty || 0,
    }));

    const sorted = [...enriched].sort((a, b) => new Date(b.date) - new Date(a.date));
    setRows(sorted);
  }, [balanceData]);

  return (
    <div className="dashboard-column p-6 text-center border-emerald-400">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white drop-shadow">
          Daily Balance & P&L
          {balanceData?.lastUpdated && (
            <span className="text-xs opacity-75 ml-2">(Updated: {balanceData.lastUpdated})</span>
          )}
        </h2>
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
                <td className="py-1 px-2">{row.coin}</td>
                <td className="py-1 px-2">${row.balance.toFixed(2)}</td>
                <td className={`py-1 px-2 ${row.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${row.pnl.toFixed(2)}
                </td>
                <td className={`py-1 px-2 ${row.pnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {row.pnlPercent.toFixed(2)}%
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