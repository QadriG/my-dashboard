// src/components/DashboardCards.jsx
import { useEffect, useState } from "react";
import Profit from "./Users/Profit";
import UPL from "./Users/UPL";
import FundsDistribution from "./Users/FundsDistribution";
import BalanceGraph from "./Users/BalanceGraph";
import WeeklyRevenue from "./Users/WeeklyRevenue";
import DailyPnL from "./Users/DailyPnL";
import BestTradingPairs from "./Users/BestTradingPairs";
import OpenPositions from "./Users/OpenPositions";

export default function DashboardCards({ userId, isAdmin = false, dashboardData }) {
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
    // ✅ Use dummy data for testing
    const dummyData = {
      profit: { total: 1000, long: 600, short: 400 },
      upl: { total: 50, totalPercent: 5, long: 30, longPercent: 3, short: 20, shortPercent: 2 },
      fundsDistribution: { totalBalance: 1000, available: 200, long: 600, short: 400, totalPositions: 1000 },
      balanceGraph: [
        { date: "2025-10-20", balance: 800 },
        { date: "2025-10-21", balance: 900 },
        { date: "2025-10-22", balance: 1000 },
        { date: "2025-10-23", balance: 1100 },
        { date: "2025-10-24", balance: 1200 },
        { date: "2025-10-25", balance: 1300 },
        { date: "2025-10-26", balance: 1400 },
        { date: "2025-10-27", balance: 1500 },
      ],
      weeklyRevenue: [
        { date: "2025-10-20", balance: 800 },
        { date: "2025-10-27", balance: 1500 },
      ],
      dailyPnL: [
        { date: "2025-10-20", pnl: 0, pnlPercent: 0 },
        { date: "2025-10-21", pnl: 100, pnlPercent: 12.5 },
        { date: "2025-10-22", pnl: 100, pnlPercent: 11.11 },
        { date: "2025-10-23", pnl: 100, pnlPercent: 10 },
        { date: "2025-10-24", pnl: 100, pnlPercent: 9.09 },
        { date: "2025-10-25", pnl: 100, pnlPercent: 8.33 },
        { date: "2025-10-26", pnl: 100, pnlPercent: 7.69 },
        { date: "2025-10-27", pnl: 100, pnlPercent: 7.14 },
      ],
      bestTradingPairs: [
        { pair: "BTC/USDT", volume: 10000, pnl: 500 },
        { pair: "ETH/USDT", volume: 8000, pnl: 400 },
        { pair: "SOL/USDT", volume: 6000, pnl: 300 },
      ],
      openPositions: { positions: [] },
    };

    // ✅ Set cardsData with dummy data
    setCardsData(dummyData);
  }, []);

  return (
    <>
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
            balanceData={dashboardData}
          />
        </div>
      </div>

      <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
        <div className="dashboard-column dashboard-column-cyan w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <BalanceGraph data={cardsData.balanceGraph} />
        </div>
        <div className="dashboard-column dashboard-column-purple w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <WeeklyRevenue data={cardsData.weeklyRevenue} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
        <div className="dashboard-column dashboard-column-cyan">
          <DailyPnL data={cardsData.dailyPnL} />
        </div>
        <div className="dashboard-column dashboard-column-purple">
          <BestTradingPairs data={cardsData.bestTradingPairs} />
        </div>
      </div>

      <div className="mt-8">
        <div className="dashboard-column dashboard-column-green">
          <OpenPositions positions={cardsData.openPositions?.positions || []} />
        </div>
      </div>
    </>
  );
}