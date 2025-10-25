// src/components/Admin/AdminPositions.jsx

import React, { useState, useEffect } from "react";

export default function AdminPositions() {
  const [openPositions, setOpenPositions] = useState([]);
  const [closedPositions, setClosedPositions] = useState([]);
  const [activeTable, setActiveTable] = useState("open");

  // ✅ Fetch all users' open positions from backend
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/all-positions", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setOpenPositions(data.positions);
        } else {
          console.error("Error fetching positions:", data.message);
        }
      } catch (err) {
        console.error("Error fetching positions:", err);
      }
    };

    fetchPositions();

    // Optional: poll every 5s for updates
    const interval = setInterval(fetchPositions, 5000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Send "close" action to backend
  const handleClose = async (userId, symbol, side) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/positions/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, symbol, side }),
      });
      if (res.ok) {
        // Refresh data after closing
        const updatedOpen = openPositions.filter((p) => !(p.userId === userId && p.symbol === symbol && p.side === side));
        setOpenPositions(updatedOpen);
      }
    } catch (err) {
      console.error("Error closing position:", err);
    }
  };

  return (
    <main className="ml-64 flex-1 p-8 overflow-y-auto space-y-10 text-white">
      {/* Title */}
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6">
        <h1 className="text-3xl font-semibold drop-shadow-md">Positions</h1>
      </div>

      {/* Filter + Toggle */}
      <div className="flex justify-between items-center">
        <div>
          <label className="block text-sm font-medium mb-1">Filter by Pair:</label>
          <select className="px-3 py-2 rounded border border-gray-700 bg-black w-48">
            <option>All</option>
            {openPositions.concat(closedPositions).map((p, idx) => (
              <option key={idx}>{p.symbol}</option>
            ))}
          </select>
        </div>

        <div className="space-x-2">
          <button
            onClick={() => setActiveTable("open")}
            className={`px-4 py-2 rounded-full text-sm ${
              activeTable === "open"
                ? "bg-green-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
          >
            Open Positions
          </button>
          <button
            onClick={() => setActiveTable("closed")}
            className={`px-4 py-2 rounded-full text-sm ${
              activeTable === "closed"
                ? "bg-red-600"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            Closed Positions
          </button>
        </div>
      </div>

      {/* Open Positions Table */}
      {activeTable === "open" && (
        <div className="p-[2px] rounded-xl bg-gradient-to-r from-green-400 to-red-500 shadow-[0_0_12px_4px_rgba(34,197,94,0.6)]">
          <div className="rounded-xl bg-black/30 backdrop-blur-md p-6">
            <table className="w-full text-white">
              <thead className="bg-gray-200 text-black rounded-xl">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Symbol</th>
                  <th className="px-4 py-2">Side</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Order Value</th>
                  <th className="px-4 py-2">Open Price</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Open Date</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="bg-black/20">
                {openPositions.length > 0 ? (
                  openPositions.map((pos, idx) => (
                    <tr key={idx} className="border-t border-gray-600">
                      <td className="px-4 py-2">{pos.id}</td>
                      <td className="px-4 py-2">{pos.symbol}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            pos.side.toLowerCase() === "buy" || pos.side.toLowerCase() === "long"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {pos.side}
                        </span>
                      </td>
                      <td className="px-4 py-2">{pos.amount}</td>
                      <td className="px-4 py-2">${pos.value}</td>
                      <td className="px-4 py-2">${pos.price}</td>
                      <td className="px-4 py-2 text-green-600">{pos.status}</td>
                      <td className="px-4 py-2">{pos.openDate}</td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleClose(pos.userId, pos.symbol, pos.side)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs rounded"
                        >
                          Close
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-gray-400">
                      No open positions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Closed Positions Table */}
      {activeTable === "closed" && (
        <div className="p-[2px] rounded-xl bg-gradient-to-r from-green-400 to-red-500 shadow-[0_0_12px_4px_rgba(34,197,94,0.6)]">
          <div className="rounded-xl bg-black/30 backdrop-blur-md p-6">
            <table className="w-full text-white">
              <thead className="bg-gray-200 text-black rounded-xl">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Symbol</th>
                  <th className="px-4 py-2">Side</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Order Value</th>
                  <th className="px-4 py-2">Open Price</th>
                  <th className="px-4 py-2">Close Price</th>
                  <th className="px-4 py-2">Profit</th>
                  <th className="px-4 py-2">PnL</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Open Date</th>
                  <th className="px-4 py-2">Close Date</th>
                </tr>
              </thead>
              <tbody className="bg-black/20">
                {closedPositions.length > 0 ? (
                  closedPositions.map((pos, idx) => (
                    <tr key={idx} className="border-t border-gray-600">
                      <td className="px-4 py-2">{pos.id}</td>
                      <td className="px-4 py-2">{pos.symbol}</td>
                      <td className="px-4 py-2">{pos.side}</td>
                      <td className="px-4 py-2">{pos.amount}</td>
                      <td className="px-4 py-2">{pos.value}</td>
                      <td className="px-4 py-2">{pos.openPrice}</td>
                      <td className="px-4 py-2">{pos.closePrice}</td>
                      <td className="px-4 py-2 text-green-600">{pos.profit}</td>
                      <td className="px-4 py-2 text-green-600">{pos.pnl}</td>
                      <td className="px-4 py-2 text-red-600">{pos.status}</td>
                      <td className="px-4 py-2">{pos.openDate}</td>
                      <td className="px-4 py-2">{pos.closeDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="12" className="text-center py-4 text-gray-400">
                      No closed positions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}