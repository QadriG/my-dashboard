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
    if (dashboardData && dashboardData.balances && dashboardData.balances.length > 0) {
      const item = dashboardData.balances[0];
      const totalBalance = dashboardData.balances.reduce((sum, acc) => sum + (acc.balance?.totalBalance || 0), 0);
      const available = dashboardData.balances.reduce((sum, acc) => sum + (acc.balance?.available || 0), 0);

      let totalLongValue = 0;
      let totalShortValue = 0;
      let totalLongUPL = 0;
      let totalShortUPL = 0;

      const allPositions = dashboardData.positions || [];
      allPositions.forEach(pos => {
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

      // ✅ Use the `dailyPnL` data directly from dashboardData
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
        fundsDistribution: {
          totalBalance,
          available,
          long: totalLongValue,
          short: totalShortValue,
          totalPositions: totalPositionsValue
        },
        // ✅ Pass the historical data from dashboardData
        balanceGraph: dashboardData.balanceHistory || [],
        weeklyRevenue: dashboardData.weeklyRevenue || [],
        dailyPnL: dashboardData.dailyPnL || [],
        bestTradingPairs: dashboardData.bestTradingPairs || [],
        openPositions: { positions: allPositions }
      });
    }
  }, [dashboardData]);

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
        {/* ✅ Pass full balanceData to these cards */}
        <div className="dashboard-column dashboard-column-cyan w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <BalanceGraph balanceData={dashboardData} />
        </div>
        <div className="dashboard-column dashboard-column-purple w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <WeeklyRevenue isDarkMode={false} balanceData={dashboardData} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
        {/* ✅ Pass full balanceData to these cards */}
        <div className="dashboard-column dashboard-column-cyan">
          <DailyPnL balanceData={dashboardData} />
        </div>
        <div className="dashboard-column dashboard-column-purple">
          <BestTradingPairs balanceData={dashboardData} />
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