import React from "react";

export default function FundsDistribution({ fundsData }) {
  const totalBalance = fundsData?.totalBalance || 0;
  const totalBalancePercent = fundsData?.totalBalancePercent || 0;
  const available = fundsData?.available || 0;
  const availablePercent = fundsData?.availablePercent || 0;
  const long = fundsData?.long || 0;
  const longPercent = fundsData?.longPercent || 0;
  const short = fundsData?.short || 0;
  const shortPercent = fundsData?.shortPercent || 0;
  const totalPositions = fundsData?.totalPositions || 0;
  const totalPositionsPercent = fundsData?.totalPositionsPercent || 0;

  const formatAmount = (amount) => amount.toFixed(2);
  const formatPercent = (percent) => percent.toFixed(2);

  return (
    <div className="dashboard-column p-6 text-center border-yellow-400">
      <h2 className="text-lg font-semibold mb-4 text-white-300 drop-shadow">
        Funds Distribution (USDT)
      </h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total Balance</span>
          <span>
            ${formatAmount(totalBalance)} <span className="text-sm text-white-400">({formatPercent(totalBalancePercent)}%)</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span>Available</span>
          <span>
            ${formatAmount(available)} <span className="text-sm text-white-400">({formatPercent(availablePercent)}%)</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span>
            <span className="bg-green-400/30 text-white-200 text-xs font-semibold px-2 py-0.5 rounded border border-green-300">Long</span>
          </span>
          <span>
            ${formatAmount(long)} <span className="text-sm text-white-400">({formatPercent(longPercent)}%)</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span>
            <span className="bg-red-400/30 text-white-200 text-xs font-semibold px-2 py-0.5 rounded border border-red-300">Short</span>
          </span>
          <span>
            ${formatAmount(short)} <span className="text-sm text-white-400">({formatPercent(shortPercent)}%)</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span>Total Positions</span>
          <span>
            ${formatAmount(totalPositions)} <span className="text-sm text-white-400">({formatPercent(totalPositionsPercent)}%)</span>
          </span>
        </div>
      </div>
    </div>
  );
}
