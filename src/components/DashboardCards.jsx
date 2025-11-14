// src/components/DashboardCards.jsx

import { useEffect, useState } from "react";
import Profit from "./Users/Profit";
import UPL from "./Users/UPL";
import FundsDistribution from "./Users/FundsDistribution";
import BalanceGraph from "./Users/BalanceGraph";
import WeeklyRevenue from "./Users/WeeklyRevenue";
import DailyPnL from "./Users/DailyPnL";
import BestTradingPairs from "./Users/BestTradingPairs";
import OpenPositions from "./Users/OpenPositions"; // ✅ Ensure this is the updated component

export default function DashboardCards({ userId, isAdmin = false, dashboardData }) { // ✅ Accept userId and isAdmin props
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
        balanceGraph: dashboardData.balanceHistory || [], // ✅ Pass the correct data
        weeklyRevenue: dashboardData.weeklyRevenue || [], // ✅ Pass the correct data
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
        <div className="dashboard-column dashboard-column-cyan w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          {/* ✅ Pass the computed cardsData.balanceGraph to BalanceGraph */}
          <BalanceGraph balanceData={{ balanceHistory: cardsData.balanceGraph }} />
        </div>
        <div className="dashboard-column dashboard-column-purple w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          {/* ✅ Pass the computed cardsData.weeklyRevenue to WeeklyRevenue */}
          <WeeklyRevenue isDarkMode={false} balanceData={{ weeklyRevenue: cardsData.weeklyRevenue }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
        <div className="dashboard-column dashboard-column-cyan">
          <DailyPnL balanceData={dashboardData} />
        </div>
        <div className="dashboard-column dashboard-column-purple">
          <BestTradingPairs balanceData={dashboardData} />
        </div>
      </div>

      <div className="mt-8">
        <div className="dashboard-column dashboard-column-green">
          {/* ✅ Pass userId and isAdmin to OpenPositions */}
          <OpenPositions positions={cardsData.openPositions?.positions || []} userId={userId} isAdmin={isAdmin} />
        </div>
      </div>
    </>
  );
}