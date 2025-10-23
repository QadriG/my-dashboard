// src/components/OpenPositions.jsx
import React from "react";

export default function OpenPositions({ positions = [] }) {
  return (
    <div className="dashboard-column open-positions p-4 text-center border-emerald-400">
      <h2 className="text-lg font-semibold mb-4 text-white drop-shadow">Active Positions</h2>
      <div className="overflow-x-auto">
        {positions.length === 0 ? (
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
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{pos.symbol}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      pos.side?.toLowerCase() === 'buy' || pos.side?.toLowerCase() === 'long'
                        ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                        : 'bg-red-500/20 text-red-300 border border-red-500/50'
                    }`}>
                      {pos.side?.toLowerCase() === 'buy' ? 'Buy' : pos.side?.toLowerCase() === 'sell' ? 'Sell' : pos.side}
                    </span>
                  </td>
                  <td className="p-2">{(pos.size || 0).toFixed(4)}</td>
                  <td className="p-2">${((pos.size || 0) * (pos.entryPrice || 0)).toFixed(2)}</td>
                  <td className="p-2">${pos.entryPrice?.toFixed(2)}</td>
                  <td className="p-2 text-green-400">{pos.status}</td>
                  <td className="p-2">{pos.openDate || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}