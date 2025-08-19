import React from "react";

export default function FundsDistribution() {
  return (
    <div className="dashboard-column p-6 text-center border-yellow-400">
      <h2 className="text-lg font-semibold mb-4 text-white-300 drop-shadow">Funds Distribution (USDT)</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total Balance</span>
          <span>$1,973.48 <span className="text-sm text-white-400">(100.00%)</span></span>
        </div>
        <div className="flex justify-between">
          <span>Available</span>
          <span>$553.33 <span className="text-sm text-white-400">(28.04%)</span></span>
        </div>
        <div className="flex justify-between">
          <span>
            <span className="bg-green-400/30 text-white-200 text-xs font-semibold px-2 py-0.5 rounded border border-green-300">Long</span>
          </span>
          <span>$63.39 <span className="text-sm text-white-400">(3.21%)</span></span>
        </div>
        <div className="flex justify-between">
          <span>
            <span className="bg-red-400/30 text-white-200 text-xs font-semibold px-2 py-0.5 rounded border border-red-300">Short</span>
          </span>
          <span>$72.42 <span className="text-sm text-white-400">(3.67%)</span></span>
        </div>
        <div className="flex justify-between">
          <span>Total Positions</span>
          <span>$1,420.15 <span className="text-sm text-white-400">(71.96%)</span></span>
        </div>
      </div>
    </div>
  );
}