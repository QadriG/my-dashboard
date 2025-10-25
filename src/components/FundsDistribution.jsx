// src/components/FundsDistribution.jsx

import React from "react";

export default function FundsDistribution({ fundsData, balanceData }) {
  // Use fundsData if available, fall back to balanceData, default to 0
  const totalBalance = Number(fundsData?.totalBalance ?? (balanceData && balanceData[0]?.totalBalance != null ? balanceData[0].totalBalance : 0));
  const available = Number(fundsData?.available ?? (balanceData && balanceData[0]?.available != null ? balanceData[0].available : 0));
  const long = Number(fundsData?.long ?? (balanceData && balanceData[0]?.long != null ? balanceData[0].long : 0));
  const short = Number(fundsData?.short ?? (balanceData && balanceData[0]?.short != null ? balanceData[0].short : 0));
  const totalPositions = Number(fundsData?.totalPositions ?? (balanceData && balanceData[0]?.totalPositions != null ? balanceData[0].totalPositions : 0));

  // Percentages (safe default to 0 if totalBalance is 0)
  const availablePercent = totalBalance > 0 ? ((available / totalBalance) * 100).toFixed(2) : "0";
  const longPercent = totalBalance > 0 ? ((long / totalBalance) * 100).toFixed(2) : "0";
  const shortPercent = totalBalance > 0 ? ((short / totalBalance) * 100).toFixed(2) : "0";
  const positionsPercent = totalBalance > 0 ? ((totalPositions / totalBalance) * 100).toFixed(2) : "0";

  const formatAmount = (val) => Number(val).toFixed(2);

  return (
    <div className="dashboard-column p-6 text-center border-yellow-400">
      <h2 className="text-lg font-semibold mb-4 text-white-300 drop-shadow">
        Funds Distribution (USDT)
      </h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total Balance</span>
          <span>
            ${formatAmount(totalBalance)}{" "}
            <span className="text-sm text-white-400">(100.00%)</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span>Available</span>
          <span>
            ${formatAmount(available)}{" "}
            <span className="text-sm text-white-400">({availablePercent}%)</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span>
            <span className="bg-green-400/30 text-white-200 text-xs font-semibold px-2 py-0.5 rounded border border-green-300">
              Long
            </span>
          </span>
          <span>
            ${formatAmount(long)}{" "}
            <span className="text-sm text-white-400">({longPercent}%)</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span>
            <span className="bg-red-400/30 text-white-200 text-xs font-semibold px-2 py-0.5 rounded border border-red-300">
              Short
            </span>
          </span>
          <span>
            ${formatAmount(short)}{" "}
            <span className="text-sm text-white-400">({shortPercent}%)</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span>Total Positions</span>
          <span>
            ${formatAmount(totalPositions)}{" "}
            <span className="text-sm text-white-400">({positionsPercent}%)</span>
          </span>
        </div>
      </div>
    </div>
  );
}