import React, { useEffect, useRef, useState } from "react";

export default function DailyPnL({ balanceData }) {
  const tableRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]); // New state for filtered/sorted rows
  const [range, setRange] = useState("all");
  const [maxRows, setMaxRows] = useState(10); // Default to 10 rows

  // Filter and sort rows based on range
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

    // Apply date range filter (simplified example)
    let filtered = [...enriched];
    if (range !== "all") {
      const now = new Date();
      let cutoffDate = new Date();
      if (range === "7d") cutoffDate.setDate(now.getDate() - 7);
      else if (range === "10d") cutoffDate.setDate(now.getDate() - 10);
      else if (range === "30d") cutoffDate.setDate(now.getDate() - 30);
      // For "custom", you'd need date pickers

      filtered = filtered.filter(row => new Date(row.date) >= cutoffDate);
    }

    const sorted = filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredRows(sorted);
  }, [balanceData, range]);

  // Limit rows based on maxRows state
  useEffect(() => {
    setRows(filteredRows.slice(0, maxRows));
  }, [filteredRows, maxRows]);

  return (
    <div className="dashboard-column p-6 text-center border-emerald-400">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white drop-shadow">
          Daily Balance & P&L
          {balanceData?.lastUpdated && (
            <span className="text-xs opacity-75 ml-2">(Updated: {balanceData.lastUpdated})</span>
          )}
        </h2>
        <div className="flex items-center gap-2">
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
          <select
            value={maxRows}
            onChange={(e) => setMaxRows(Number(e.target.value))}
            className="bg-emerald-900/80 text-white px-2 py-1 rounded text-sm border border-emerald-500"
          >
            <option value={10}>10 Rows</option>
            <option value={20}>20 Rows</option>
            <option value={30}>30 Rows</option>
            <option value={50}>50 Rows</option>
          </select>
        </div>
      </div>

      {/* Container for table with scroll */}
      <div className="overflow-y-auto max-h-60"> {/* Add max height and overflow */}
        <table className="w-full text-sm text-left" ref={tableRef}>
          <thead className="bg-emerald-900/80 text-white font-semibold sticky top-0"> {/* Make header sticky */}
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
      {/* Optional: Show "Load More" button if there are more rows */}
      {filteredRows.length > maxRows && (
        <div className="mt-2 text-center">
          <button
            onClick={() => setMaxRows(prev => prev + 10)}
            className="px-4 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}