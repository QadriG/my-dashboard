// src/components/DashboardCards.jsx
import { useEffect, useState } from "react";
import Profit from "./Profit";
import UPL from "./UPL";
import FundsDistribution from "./FundsDistribution";
import BalanceGraph from "./BalanceGraph";
import WeeklyRevenue from "./WeeklyRevenue";
import DailyPnL from "./DailyPnL";
import BestTradingPairs from "./BestTradingPairs";
import OpenPositions from "./OpenPositions"; // ← dashboard card

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
  if (balanceData && balanceData.length > 0) {
    const item = balanceData[0];
    const totalBalance = item.balance?.totalBalance || 0;
    const available = item.balance?.available || 0;

    let totalLongValue = 0;
    let totalShortValue = 0;
    let totalLongUPL = 0;
    let totalShortUPL = 0;

    const positions = item.openPositions || [];
    positions.forEach(pos => {
      const notional = (pos.size || 0) * (pos.entryPrice || 0);
      const upl = parseFloat(pos.unrealizedPnl) || 0;
      const side = (pos.side || '').toLowerCase();
      if (side === 'buy' || side === 'long') {
        totalLongValue += notional;
        totalLongUPL += upl;
      } else if (side === 'sell' || side === 'short') {
        totalShortValue += notional;
        totalShortUPL += upl;
      }
    });

    const totalPositionsValue = totalLongValue + totalShortValue;
    const totalUPL = totalLongUPL + totalShortUPL;

    // Fetch mock data
    Promise.all([
      fetch('/api/user/balance-history', { credentials: 'include' }).then(r => r.json()).catch(() => []),
      fetch('/api/user/daily-pnl', { credentials: 'include' }).then(r => r.json()).catch(() => []),
      fetch('/api/user/weekly-revenue', { credentials: 'include' }).then(r => r.json()).catch(() => ({ labels: [], revenues: [] })),
      fetch('/api/user/best-trading-pairs', { credentials: 'include' }).then(r => r.json()).catch(() => [])
    ]).then(([balanceHistory, dailyPnL, weeklyData, bestPairs]) => {
      setCardsData({
        profit: { total: totalBalance, long: totalLongValue, short: totalShortValue },
        upl: { 
          total: totalUPL, 
          totalPercent: totalBalance > 0 ? (totalUPL / totalBalance) * 100 : 0,
          long: totalLongUPL,
          longPercent: totalBalance > 0 ? (totalLongUPL / totalBalance) * 100 : 0,
          short: totalShortUPL,
          shortPercent: totalBalance > 0 ? (totalShortUPL / totalBalance) * 100 : 0,
        },
        fundsDistribution: { totalBalance, available, long: totalLongValue, short: totalShortValue, totalPositions: totalPositionsValue },
        balanceGraph: {  balanceHistory },
        weeklyRevenue: weeklyData,
        dailyPnL: {  dailyPnL },
        bestTradingPairs: { pairs: bestPairs },
        openPositions: { positions }
      });
    });
  }
}, [balanceData]);

  return (
    <>
      {/* Top row */}
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

      {/* Middle row */}
      <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
        <div className="dashboard-column dashboard-column-cyan balance-graph w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <BalanceGraph balanceData={cardsData.balanceGraph} />
        </div>
        <div className="dashboard-column dashboard-column-purple weekly-revenue w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <WeeklyRevenue weeklyData={cardsData.weeklyRevenue} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
        <div className="dashboard-column dashboard-column-cyan">
          <DailyPnL balanceData={cardsData.dailyPnL} />
        </div>
        <div className="dashboard-column dashboard-column-purple">
          <BestTradingPairs pairsData={cardsData.bestTradingPairs} />
        </div>
      </div>

      {/* Active Positions Card */}
      <div className="mt-8">
        <div className="dashboard-column dashboard-column-green">
          <OpenPositions positionsData={cardsData.openPositions} />
        </div>
      </div>
    </>
  );
}