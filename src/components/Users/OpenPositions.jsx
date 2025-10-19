// src/components/OpenPositions.jsx
import React, { useEffect, useState } from "react";

export default function OpenPositions({ balanceData }) {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    if (balanceData && balanceData.length > 0) {
      const latestData = balanceData[0];
      setPositions(latestData.openPositions || []);
    }
  }, [balanceData]);

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
                    <span className={`px-2 py-1 rounded text-xs ${
                      pos.side === 'buy' || pos.side === 'long'
                        ? 'bg-green-400/30 text-green-200 border border-green-300'
                        : 'bg-red-400/30 text-red-200 border border-red-300'
                    }`}>
                      {pos.side === 'buy' ? 'Buy' : pos.side === 'sell' ? 'Sell' : pos.side}
                    </span>
                  </td>
                  <td className="p-2">{(pos.size || 0).toFixed(4)}</td>
                  <td className="p-2">${((pos.size || 0) * (pos.entryPrice || 0)).toFixed(2)}</td>
                  <td className="p-2">${pos.entryPrice?.toFixed(2)}</td>
                  <td className="p-2 text-green-400">{pos.status}</td>
                  <td className="p-2">
                    {new Date(pos.updateTime || Date.now()).toLocaleDateString()}
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