import React, { useEffect, useState } from "react";

export default function OpenPositions() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPositions() {
      try {
        const response = await fetch("/api/positions/active"); // ✅ Adjust to your backend route
        const data = await response.json();

        console.log("Fetched positions:", data); // 🔍 Debug log

        // ✅ Ensure we always store an array
        if (Array.isArray(data)) {
          setPositions(data);
        } else if (data && Array.isArray(data.positions)) {
          setPositions(data.positions);
        } else {
          console.warn("Unexpected data format:", data);
          setPositions([]);
        }
      } catch (error) {
        console.error("Error fetching active positions:", error);
        setPositions([]);
      } finally {
        setLoading(false);
      }
    }

    fetchPositions();
  }, []);

  return (
    <div className="dashboard-column open-positions p-4 text-center border-emerald-400">
      <h2 className="text-lg font-semibold mb-4 text-white drop-shadow">
        Active Positions
      </h2>

      <div className="overflow-x-auto">
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
