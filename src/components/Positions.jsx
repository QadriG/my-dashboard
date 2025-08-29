import React, { useState } from "react";

export default function AdminPositions() {
  // sample static data (replace with API later)
  const [openPositions, setOpenPositions] = useState([
    {
      id: "2S",
      symbol: "XMR/USDT:USDT",
      side: "Short",
      amount: 0.08,
      value: 26.3104,
      price: 328.88,
      status: "Open",
      openDate: "3/25/2025",
    },
    {
      id: "1L",
      symbol: "UNI/USDT:USDT",
      side: "Long",
      amount: 2.7,
      value: 28.3733,
      price: 10.5086,
      status: "Open",
      openDate: "5/13/2025",
    },
  ]);

  const [closedPositions] = useState([
    {
      id: "001",
      symbol: "BTCUSDT",
      side: "Long",
      amount: 0.5,
      value: 13000,
      openPrice: 26000,
      closePrice: 27000,
      profit: 500,
      pnl: "3.85%",
      status: "Closed",
      openDate: "2025-08-01",
      closeDate: "2025-08-03",
    },
  ]);

  const [activeTable, setActiveTable] = useState("open");

  const handleClose = (posId) => {
    // simple demo: remove from open and move to closed
    const pos = openPositions.find((p) => p.id === posId);
    if (pos) {
      setOpenPositions(openPositions.filter((p) => p.id !== posId));
      // Ideally, add it to closedPositions
      // but for demo we just remove it
    }
  };

  return (
    <main className="ml-64 flex-1 p-8 overflow-y-auto space-y-10 text-white">
      {/* Title */}
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6">
        <h1 className="text-3xl font-semibold drop-shadow-md">Positions</h1>
      </div>

      {/* Filter + Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium mb-1">
            Filter by Pair:
          </label>
          <select className="px-3 py-2 rounded border border-gray-700 bg-black w-48">
            <option>All</option>
            <option>XMR/USDT:USDT</option>
            <option>UNI/USDT:USDT</option>
            <option>BTC/USDT:USDT</option>
            <option>SOL/USDT:USDT</option>
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
                {openPositions.map((pos, idx) => (
                  <tr key={idx} className="border-t border-gray-600">
                    <td className="px-4 py-2">{pos.id}</td>
                    <td className="px-4 py-2">{pos.symbol}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded ${
                          pos.side === "Long"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {pos.side}
                      </span>
                    </td>
                    <td className="px-4 py-2">{pos.amount}</td>
                    <td className="px-4 py-2">{pos.value}</td>
                    <td className="px-4 py-2">{pos.price}</td>
                    <td className="px-4 py-2 text-green-600">{pos.status}</td>
                    <td className="px-4 py-2">{pos.openDate}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleClose(pos.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs rounded"
                      >
                        Close
                      </button>
                    </td>
                  </tr>
                ))}
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
                {closedPositions.map((pos, idx) => (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
