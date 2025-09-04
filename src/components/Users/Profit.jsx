import React from "react";

export default function Profit({ profitData }) {
  // Default to 0 if no data yet
  const total = profitData?.total || 0;
  const long = profitData?.long || 0;
  const short = profitData?.short || 0;

  return (
    <div className="dashboard-column p-6 text-center border-cyan-400">
      <h2 className="text-lg font-bold mb-4 text-white-300 drop-shadow">Profit</h2>
      <div className="space-y-2">
        <div className="flex justify-between text-3x1 font-bold">
          <span>Total</span>
          <span className="text-white-300 drop-shadow">${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>
            <span className="bg-green-400/30 text-white-200 text-3x1 font-bold px-2 py-0.5 rounded border border-green-300">
              Long
            </span>
          </span>
          <span className="text-white-300">${long.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>
            <span className="bg-red-400/30 text-white-200 text-3x1 font-bold px-2 py-0.5 rounded border border-red-300">
              Short
            </span>
          </span>
          <span className="text-white-300">${short.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
