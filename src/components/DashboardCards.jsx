// src/components/DashboardCards.jsx
import { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import Profit from "./Profit";
import UPL from "./UPL";
import FundsDistribution from "./FundsDistribution";
import BalanceGraph from "./BalanceGraph";
import WeeklyRevenue from "./WeeklyRevenue";
import DailyPnL from "./DailyPnL";
import BestTradingPairs from "./BestTradingPairs";
import OpenPositions from "./OpenPositions";

export default function DashboardCards({ userId, isAdmin = false }) {
  const socket = useSocket("http://localhost:5000");

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

  // Subscribe to live dashboard updates
  useEffect(() => {
    if (!socket) return;

    const channel = isAdmin ? "dashboard/all" : `dashboard/${userId}`;
    socket.on(channel, (update) => {
      setCardsData((prev) => ({ ...prev, ...update }));
    });

    return () => socket.off(channel);
  }, [socket, userId, isAdmin]);

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
          <FundsDistribution fundsData={cardsData.fundsDistribution} />
        </div>
      </div>

      {/* Middle row: Balance Graph & Weekly Revenue */}
      <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
        <div className="dashboard-column dashboard-column-cyan balance-graph w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden">
          <BalanceGraph balanceData={cardsData.balanceGraph} />
        </div>
        <div className="dashboard-column dashboard-column-purple weekly-revenue w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden">
          <WeeklyRevenue weeklyData={cardsData.weeklyRevenue} />
        </div>
      </div>

      {/* Bottom row: Daily PnL & Best Trading Pairs */}
      <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
        <div className="dashboard-column dashboard-column-cyan">
          <DailyPnL dailyData={cardsData.dailyPnL} />
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
