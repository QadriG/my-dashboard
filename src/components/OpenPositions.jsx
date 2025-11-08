// src/components/Users/OpenPositions.jsx

import React, { useEffect, useState } from "react";

export default function OpenPositions({ positions = [], userId }) { // ✅ Accept positions and userId props
  const [loading, setLoading] = useState(false); // We don't need to load if we're getting data via prop
  const [error, setError] = useState(null);

  return (
    <div className="dashboard-column open-positions p-4 text-center border-emerald-400">
      <h2 className="text-lg font-semibold mb-4 text-white drop-shadow">
        Active Positions
      </h2>

      <div className="overflow-x-auto">
        {/* Show loading state only if needed */}
        {loading ? (
          <p className="text-gray-400">Loading positions...</p>
        ) : positions.length === 0 ? (
          <p className="text-gray-400">No active positions found.</p>
        ) : (
          <table className="min-w-full table-auto text-sm text-left text-white">
            <thead className="bg-gray-800 text-white font-semibold">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Symbol</th>
                <th className="p-2">Side</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Order Value</th>
                <th className="p-2">Open Price</th>
                <th className="p-2">Status</th>
                <th className="p-2">Open Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-700">
              {positions.map((pos, index) => (
                <tr key={index}>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded ${
                        pos.side === "Long"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {pos.id || index + 1}
                    </span>
                  </td>
                  <td className="p-2">{pos.symbol}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded ${
                        pos.side?.toLowerCase() === 'buy' || pos.side?.toLowerCase() === 'long'
                          ? 'bg-green-500 text-white border border-green-500'
                          : 'bg-red-500 text-white border border-red-500'
                      }`}
                    >
                      {pos.side?.toLowerCase() === 'buy' ? 'Buy' : pos.side?.toLowerCase() === 'sell' ? 'Sell' : pos.side}
                    </span>
                  </td>
                  <td className="p-2">{(pos.size || 0).toFixed(4)}</td> {/* ✅ Use 'size' if available */}
                  <td className="p-2">${((pos.size || 0) * (pos.entryPrice || 0)).toFixed(2)}</td> {/* ✅ Calculate Order Value */}
                  <td className="p-2">${pos.entryPrice?.toFixed(2)}</td> {/* ✅ Use 'entryPrice' if available */}
                  <td className="p-2 text-green-400">{pos.status}</td>
                  <td className="p-2">
                    {new Date(pos.updateTime || Date.now()).toLocaleDateString()} {/* ✅ Use 'updateTime' or fallback */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}