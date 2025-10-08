import { useEffect, useState } from "react";
import Profit from "./Profit";
import UPL from "./UPL";
import FundsDistribution from "./FundsDistribution";
import BalanceGraph from "./BalanceGraph";
import WeeklyRevenue from "./WeeklyRevenue";
import DailyPnL from "./DailyPnL";
import BestTradingPairs from "./BestTradingPairs";
import OpenPositions from "./OpenPositions";

export default function DashboardCards({ userId, isAdmin = false, balanceData }) {
  const [cardsData, setCardsData] = useState({
    profit: null,
    upl: null,
    fundsDistribution: null,
    balanceGraph: null,
    weeklyRevenue: null,
    dailyPnL: null,
    bestTradingPairs: null,
    openPositions: null,
  });

  useEffect(() => {
    console.log("DashboardCards received balanceData:", balanceData);
    if (balanceData && balanceData.length > 0) {
      const balance = balanceData[0] || {};
      setCardsData((prev) => ({
        ...prev,
        fundsDistribution: {
          totalBalance: balance.totalBalance || 0,
          available: balance.available || 0,
          long: 0,
          short: 0,
          totalPositions: balance.totalPositions || 0,
        },
        balanceGraph: {
          balances: {
            data: balance.dailyData || [], // Use dailyData for graphing
          },
        },
        dailyPnL: {
          availableFunds: balance.available || 0, // Map available to a specific field
        },
        // Retain fallbacks for other cards
        profit: prev.profit || { total: 0, long: 0, short: 0 },
        upl: prev.upl || { total: 0, totalPercent: 0, long: 0, longPercent: 0, short: 0, shortPercent: 0 },
        weeklyRevenue: prev.weeklyRevenue || { labels: [], revenues: [] },
        bestTradingPairs: prev.bestTradingPairs || {},
        openPositions: prev.openPositions || {},
      }));
    }
  }, [balanceData]);

  // Add debug logs for each card's data
  console.log("DashboardCards transformed cardsData:", cardsData);

  return (
    <>
      {/* Top row: Profit, UPL, Funds Distribution */}
      <div className="grid grid-cols-3 gap-7 max-lg:grid-cols-1">
        <div className="dashboard-column dashboard-column-cyan">
          <Profit profitData={cardsData.profit} />
        </div>
        <div className="dashboard-column dashboard-column-purple">
          <UPL uplData={cardsData.upl} />
        </div>
        <div className="dashboard-column dashboard-column-green">
          <FundsDistribution
            fundsData={cardsData.fundsDistribution}
            balanceData={balanceData}
          />
        </div>
      </div>

      {/* Middle row: Balance Graph & Weekly Revenue */}
      <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
        <div className="dashboard-column dashboard-column-cyan balance-graph w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <BalanceGraph balanceData={cardsData.balanceGraph} />
        </div>
        <div className="dashboard-column dashboard-column-purple weekly-revenue w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <WeeklyRevenue weeklyData={cardsData.weeklyRevenue} />
        </div>
      </div>

      {/* Bottom row: Daily PnL & Best Trading Pairs */}
      <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
        <div className="dashboard-column dashboard-column-cyan">
          <DailyPnL balanceData={cardsData.dailyPnL} />
        </div>
        <div className="dashboard-column dashboard-column-purple">
          <BestTradingPairs pairsData={cardsData.bestTradingPairs} />
        </div>
      </div>

      {/* Open Positions */}
      <div className="mt-8">
        <div className="dashboard-column dashboard-column-green">
          <OpenPositions positionsData={cardsData.openPositions} />
        </div>
      </div>
    </>
  );
}