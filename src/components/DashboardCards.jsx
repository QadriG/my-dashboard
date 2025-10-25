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

      // 🔹 Use real data from balanceData[0] where available
      const dailyPnLSnapshots = item.dailyPnLSnapshots || [];
      const tradeEvents = item.tradeEvents || []; // assuming this is the field for closed trades

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
        // ✅ Pass real data for the updated cards
        balanceGraph: { data: dailyPnLSnapshots }, // used by BalanceGraph
        weeklyRevenue: { labels: [], revenues: [] }, // WeeklyRevenue will calculate from dailyPnLSnapshots
        dailyPnL: { data: dailyPnLSnapshots }, // used by DailyPnL
        bestTradingPairs: { pairs: tradeEvents }, // used by BestTradingPairs
        openPositions: { positions }
      });
    }
  }, [balanceData]);

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
            balanceData={balanceData}
          />
        </div>
      </div>

      <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
        {/* ✅ Pass full balanceData to these cards */}
        <div className="dashboard-column dashboard-column-cyan balance-graph w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <BalanceGraph balanceData={balanceData} />
        </div>
        <div className="dashboard-column dashboard-column-purple weekly-revenue w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <WeeklyRevenue isDarkMode={false} balanceData={balanceData} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
        {/* ✅ Pass full balanceData to these cards */}
        <div className="dashboard-column dashboard-column-cyan">
          <DailyPnL balanceData={balanceData} />
        </div>
        <div className="dashboard-column dashboard-column-purple">
          <BestTradingPairs balanceData={balanceData} />
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