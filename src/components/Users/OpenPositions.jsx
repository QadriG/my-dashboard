// src/components/OpenPositions.jsx
import React, { useEffect, useState } from "react";

export default function OpenPositions({ balanceData }) {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (balanceData && balanceData.length > 0) {
      const latestData = balanceData[0];
      setPositions(latestData.positions || []);
      setLoading(false);
    } else {
      async function fetchPositions() {
        try {
          const response = await fetch("/api/positions/active", { credentials: "include" });
          const data = await response.json();
          setPositions(data || []);
        } catch (error) {
          console.error("Error fetching active positions:", error);
        } finally {
          setLoading(false);
        }
      }
      fetchPositions();
    }
  }, [balanceData]);

  return (
    <div className="dashboard-column open-positions p-4 text-center border-emerald-400">
      {/* Section title */}
      <h2 className="text-lg font-semibold mb-4 text-white drop-shadow">
        Active Positions
      </h2>

      {/* Responsive wrapper */}
      <div className="overflow-x-auto">
        {loading ? (
          <p className="text-gray-400">Loading positions...</p>
        ) : positions.length === 0 ? (
          <p className="text-gray-400">No active positions found.</p>
        ) : (
          <table className="min-w-full table-auto text-sm text-left text-white">
            {/* Table Header */}
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

            {/* Table Body */}
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
                        pos.side === "Long"
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {pos.side}
                    </span>
                  </td>
                  <td className="p-2">{pos.amount}</td>
                  <td className="p-2">{pos.orderValue}</td>
                  <td className="p-2">{pos.openPrice}</td>
                  <td className="p-2 text-green-400">{pos.status}</td>
                  <td className="p-2">
                    {new Date(pos.openDate).toLocaleDateString()}
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