import React from "react";

export default function UPL() {
  return (
    <div className="dashboard-column p-6 text-center border-pink-400">
      <h2 className="text-lg font-semibold mb-4 text-white-300 drop-shadow">uP&amp;L</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total</span>
          <span className="text-white-300 drop-shadow">$-3.77 <span className="text-sm text-gray-400">(-0.02%)</span></span>
        </div>
        <div className="flex justify-between">
          <span>
            <span className="bg-green-400/30 text-white-200 text-xs font-semibold px-2 py-0.5 rounded border border-green-300">Long</span>
          </span>
          <span className="text-white-300">$-6.35 <span className="text-sm text-gray-400">(-0.03%)</span></span>
        </div>
        <div className="flex justify-between">
          <span>
            <span className="bg-red-400/30 text-white-200 text-xs font-semibold px-2 py-0.5 rounded border border-red-300">Short</span>
          </span>
          <span className="text-white-300">$2.58 <span className="text-sm text-gray-400">(0.01%)</span></span>
        </div>
      </div>
    </div>
  );
}