import React from "react";
import "../../styles/globals.css";
import "../../styles/sidebar.css";
import { useTheme } from "../../context/ThemeContext";
import UserSidebar from "./Sidebar.jsx";

export default function OpenPositions() {
  const { isDarkMode } = useTheme();

  const positions = [
    { id: "2S", symbol: "XMR/USDT:USDT", side: "Short", amount: "0.0800", value: "0.0000", price: "328.8800", status: "Open", date: "03/25/2025" },
    { id: "1L", symbol: "UNI/USDT:USDT", side: "Long", amount: "2.7000", value: "0.0000", price: "10.5086", status: "Open", date: "05/13/2025" },
    { id: "1L", symbol: "AVAX/USDT:USDT", side: "Long", amount: "1.1000", value: "0.0000", price: "25.9260", status: "Open", date: "06/07/2023" },
    { id: "2S", symbol: "1000PEPE/USDT:USDT", side: "Short", amount: "2100.0000", value: "0.0000", price: "0.0130", status: "Open", date: "06/07/2023" },
    { id: "1L", symbol: "XRP/USDT:USDT", side: "Long", amount: "10.0000", value: "0.0000", price: "3.4871", status: "Open", date: "06/07/2023" },
    { id: "2S", symbol: "SOL/USDT:USDT", side: "Short", amount: "0.1000", value: "0.0000", price: "187.6700", status: "Open", date: "06/07/2023" },
  ];

  return (
    <div className="flex">
      {/* Sidebar */}
      <UserSidebar isOpen={true} />

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8 overflow-y-auto">
        <div className="shimmer-wrapper w-full py-4 px-6 mb-6 relative flex justify-between items-center">
          <h1 className="text-3xl font-semibold drop-shadow-md text-white">
            Open Positions
          </h1>
        </div>

        {/* Positions Table Container with Neon Glow */}
        <div className={`dashboard-column open-positions glass-box neon-row-hover p-4 rounded-xl border-emerald-400 transition-transform duration-300 hover:scale-[1.02]`}>
          <h2 className="text-lg font-semibold mb-4 text-white drop-shadow">
            Active Positions
          </h2>

          <div className="overflow-x-auto">
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
                {positions.map((pos, idx) => (
                  <tr
                    key={idx}
                    className="neon-row-hover transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                  >
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded ${pos.side === "Long" ? "bg-green-600" : "bg-red-600"} text-white`}>
                        {pos.id}
                      </span>
                    </td>
                    <td className="p-2">{pos.symbol}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded ${pos.side === "Long" ? "bg-green-600" : "bg-red-600"} text-white`}>
                        {pos.side}
                      </span>
                    </td>
                    <td className="p-2">{pos.amount}</td>
                    <td className="p-2">{pos.value}</td>
                    <td className="p-2">{pos.price}</td>
                    <td className={`p-2 ${pos.status === "Open" ? "text-green-400" : "text-red-400"}`}>
                      {pos.status}
                    </td>
                    <td className="p-2">{pos.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
