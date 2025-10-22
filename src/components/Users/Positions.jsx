// src/components/Users/PositionsTable.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";

export default function PositionsTable({ userId }) {
  const { isDarkMode } = useTheme();
  const [openPositions, setOpenPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]); // placeholder
  const [tableType, setTableType] = useState("open");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [filterSymbol, setFilterSymbol] = useState("All");
  const [loading, setLoading] = useState(true);

  // Fetch open positions via REST
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await fetch('/api/positions/active', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setOpenPositions(data);
        }
      } catch (err) {
        console.error('Failed to fetch positions:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchPositions();
  }, [userId]);

  const positions = tableType === "open" ? openPositions : closedPositions;
  const filteredPositions =
    filterSymbol === "All" ? positions : positions.filter((p) => p.symbol === filterSymbol);
  const totalPages = Math.max(1, Math.ceil(filteredPositions.length / pageSize));
  const paginated = filteredPositions.slice((page - 1) * pageSize, page * pageSize);

  const changePage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const selectClass = `px-3 py-2 rounded border w-48 ${
    isDarkMode ? "border-gray-700 bg-black text-white" : "border-gray-300 bg-white text-black"
  }`;

  const smallSelectClass = `px-2 py-1 rounded border ${
    isDarkMode ? "bg-black text-white border-gray-700" : "bg-white text-black border-gray-300"
  }`;

  return (
    <div>
      <div className="flex justify-between mb-4 flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Filter by Pair:</label>
          <select
            className={selectClass}
            value={filterSymbol}
            onChange={(e) => {
              setFilterSymbol(e.target.value);
              setPage(1);
            }}
          >
            <option>All</option>
            {[...new Set([...openPositions, ...closedPositions].map((p) => p.symbol))].map(
              (sym, i) => <option key={i}>{sym}</option>
            )}
          </select>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => {
              setTableType("open");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm ${
              tableType === "open" ? "bg-green-500" : "bg-green-700 hover:bg-green-600"
            }`}
          >
            Open Positions
          </button>
          <button
            onClick={() => {
              setTableType("closed");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-full text-sm ${
              tableType === "closed" ? "bg-red-500" : "bg-red-700 hover:bg-red-600"
            }`}
            disabled={closedPositions.length === 0}
          >
            Closed Positions
          </button>
        </div>
      </div>

      <div className="p-[2px] rounded-xl bg-gradient-to-r from-green-400 to-red-500 shadow-[0_0_12px_4px_rgba(34,197,94,0.6)]">
        <div className="rounded-xl bg-black/30 backdrop-blur-md p-6 transition-transform duration-300 hover:scale-[1.01]">
          <table className="w-full">
            <thead className={`rounded-xl ${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-black"}`}>
              <tr>
                {tableType === "open" ? (
                  <>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Symbol</th>
                    <th className="px-4 py-2 text-left">Side</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Order Value</th>
                    <th className="px-4 py-2 text-left">Open Price</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Open Date</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-2 text-left">ID</th>
                    <th className="px-4 py-2 text-left">Symbol</th>
                    <th className="px-4 py-2 text-left">Side</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Order Value</th>
                    <th className="px-4 py-2 text-left">Open Price</th>
                    <th className="px-4 py-2 text-left">Close Price</th>
                    <th className="px-4 py-2 text-left">Profit</th>
                    <th className="px-4 py-2 text-left">PnL</th>
                    <th className="px-4 py-2 text-left">Status</th>
                    <th className="px-4 py-2 text-left">Open Date</th>
                    <th className="px-4 py-2 text-left">Close Date</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className={`${isDarkMode ? "bg-black/20" : "bg-white/5"}`}>
              {paginated.length > 0 ? (
                paginated.map((pos, i) => (
                  <tr key={i} className="border-t border-gray-600">
                    {tableType === "open" ? (
                      <>
                        <td className="px-4 py-2">{i + 1}</td>
                        <td className="px-4 py-2">{pos.symbol}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            pos.side === 'buy' || pos.side === 'long'
                              ? 'bg-green-400/30 text-green-200 border border-green-300'
                              : 'bg-red-400/30 text-red-200 border border-red-300'
                          }`}>
                            {pos.side === 'buy' ? 'Buy' : pos.side === 'sell' ? 'Sell' : pos.side}
                          </span>
                        </td>
                        <td className="px-4 py-2">{(pos.size || 0).toFixed(4)}</td>
                        <td className="px-4 py-2">${((pos.size || 0) * (pos.entryPrice || 0)).toFixed(2)}</td>
                        <td className="px-4 py-2">${pos.entryPrice?.toFixed(2)}</td>
                        <td className="px-4 py-2 text-green-400">{pos.status}</td>
                        <td className="px-4 py-2">
                          {new Date(pos.updateTime || Date.now()).toLocaleDateString()}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2">{i + 1}</td>
                        <td className="px-4 py-2">{pos.symbol}</td>
                        <td className="px-4 py-2">{pos.side}</td>
                        <td className="px-4 py-2">{pos.amount || '-'}</td>
                        <td className="px-4 py-2">{pos.orderValue || '-'}</td>
                        <td className="px-4 py-2">{pos.openPrice || '-'}</td>
                        <td className="px-4 py-2">{pos.closePrice || '-'}</td>
                        <td className="px-4 py-2 text-green-600 font-semibold">{pos.profit || '-'}</td>
                        <td className="px-4 py-2 text-green-600 font-semibold">{pos.pnl || '-'}</td>
                        <td className="px-4 py-2 text-red-600 font-semibold">{pos.status || '-'}</td>
                        <td className="px-4 py-2">{pos.openDate || '-'}</td>
                        <td className="px-4 py-2">{pos.closeDate || '-'}</td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={tableType === "open" ? 8 : 12} className="text-center py-4 text-gray-400">
                    {loading ? "Loading..." : "No positions found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center px-4 py-2 mt-2">
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(parseInt(e.target.value));
            setPage(1);
          }}
          className={smallSelectClass}
        >
          {[10, 20, 30, 40].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <div className={`flex gap-1 ${isDarkMode ? "text-white" : "text-black"}`}>
          <button
            disabled={page === 1}
            onClick={() => changePage(page - 1)}
            className="px-2 py-1 bg-gray-700 rounded text-sm disabled:opacity-50"
          >
            « Prev
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => changePage(i + 1)}
              className={`px-2 py-1 rounded text-sm ${page === i + 1 ? "bg-blue-600" : "bg-gray-700"}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => changePage(page + 1)}
            className="px-2 py-1 bg-gray-700 rounded text-sm disabled:opacity-50"
          >
            Next »
          </button>
        </div>
      </div>
    </div>
  );
}