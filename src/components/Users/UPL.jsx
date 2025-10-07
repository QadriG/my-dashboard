import React from "react";

export default function UPL({ uplData, balanceData }) {
  // Use uplData if available, fall back to balanceData, default to 0
  const total = Number(uplData?.total ?? (balanceData && balanceData[0]?.totalUPL != null ? balanceData[0].totalUPL : 0));
  const totalPercent = Number(uplData?.totalPercent ?? (balanceData && balanceData[0]?.totalUPLPercent != null ? balanceData[0].totalUPLPercent : 0));
  const long = Number(uplData?.long ?? (balanceData && balanceData[0]?.longUPL != null ? balanceData[0].longUPL : 0));
  const longPercent = Number(uplData?.longPercent ?? (balanceData && balanceData[0]?.longUPLPercent != null ? balanceData[0].longUPLPercent : 0));
  const short = Number(uplData?.short ?? (balanceData && balanceData[0]?.shortUPL != null ? balanceData[0].shortUPL : 0));
  const shortPercent = Number(uplData?.shortPercent ?? (balanceData && balanceData[0]?.shortUPLPercent != null ? balanceData[0].shortUPLPercent : 0));

  const formatAmount = (amount) => Number(amount).toFixed(2);
  const formatPercent = (percent) => Number(percent).toFixed(2);

  return (
    <div className="dashboard-column p-6 text-center border-pink-400">
      <h2 className="text-lg font-semibold mb-4 text-white-300 drop-shadow">
        uP&amp;L
      </h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total</span>
          <span className="text-white-300 drop-shadow">
            ${formatAmount(total)}{" "}
            <span className="text-sm text-gray-400">
              ({formatPercent(totalPercent)}%)
            </span>
          </span>
        </div>
        <div className="flex justify-between">
          <span>
            <span className="bg-green-400/30 text-white-200 text-xs font-semibold px-2 py-0.5 rounded border border-green-300">
              Long
            </span>
          </span>
          <span className="text-white-300">
            ${formatAmount(long)}{" "}
            <span className="text-sm text-gray-400">
              ({formatPercent(longPercent)}%)
            </span>
          </span>
        </div>
        <div className="flex justify-between">
          <span>
            <span className="bg-red-400/30 text-white-200 text-xs font-semibold px-2 py-0.5 rounded border border-red-300">
              Short
            </span>
          </span>
          <span className="text-white-300">
            ${formatAmount(short)}{" "}
            <span className="text-sm text-gray-400">
              ({formatPercent(shortPercent)}%)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}