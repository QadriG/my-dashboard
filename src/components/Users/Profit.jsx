// src/components/Profit.jsx
import React from "react";

export default function Profit({ profitData, balanceData }) {
  // Ensure values always exist and are numbers with fallback to balanceData
  const total = Number(profitData?.total ?? (balanceData && balanceData[0]?.totalProfit != null ? balanceData[0].totalProfit : 0));
  const long = Number(profitData?.long ?? (balanceData && balanceData[0]?.longProfit != null ? balanceData[0].longProfit : 0));
  const short = Number(profitData?.short ?? (balanceData && balanceData[0]?.shortProfit != null ? balanceData[0].shortProfit : 0));

  return (
    <div className="dashboard-column p-6 text-center border-cyan-400">
      <h2 className="text-lg font-bold mb-4 text-white-300 drop-shadow">Profit</h2>

      <div className="space-y-2">
        {/* Total Profit */}
        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>
          <span className="text-white-300 drop-shadow">
            ${total.toFixed(2)}
          </span>
        </div>

        {/* Long Profit */}
        <div className="flex justify-between">
          <span>
            <span className="bg-green-400/30 text-white-200 text-sm font-semibold px-2 py-0.5 rounded border border-green-300">
              Long
            </span>
          </span>
          <span className="text-white-300">
            ${long.toFixed(2)}
          </span>
        </div>

        {/* Short Profit */}
        <div className="flex justify-between">
          <span>
            <span className="bg-red-400/30 text-white-200 text-sm font-semibold px-2 py-0.5 rounded border border-red-300">
              Short
            </span>
          </span>
          <span className="text-white-300">
            ${short.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}