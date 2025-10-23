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
      console.log("First position side:", item.openPositions?.[0]?.side);
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

      // Fetch and transform mock data
      Promise.all([
        fetch('/api/user/balance-history', { credentials: 'include' }).then(r => r.json()).catch(() => []),
        fetch('/api/user/daily-pnl', { credentials: 'include' }).then(r => r.json()).catch(() => []),
        fetch('/api/user/weekly-revenue', { credentials: 'include' }).then(r => r.json()).catch(() => ({ labels: [], revenues: [] })),
        fetch('/api/user/best-trading-pairs', { credentials: 'include' }).then(r => r.json()).catch(() => [])
      ]).then(([balanceHistory, dailyPnL, weeklyData, bestPairs]) => {
        // Transform data for cards
        const balanceGraphData = balanceHistory.map(item => ({
          date: item.date,
          balance: item.balance
        }));

        const dailyPnLData = dailyPnL.map(item => ({
          date: item.date,
          pnl: item.pnl,
          pnlPercent: totalBalance > 0 ? ((item.pnl / totalBalance) * 100).toFixed(2) : "0.00"
        }));

        const bestTradingPairsData = bestPairs.map(pair => ({
          pair: pair.pair,
          profit: pair.profit,
          percent: totalBalance > 0 ? ((pair.profit / totalBalance) * 100).toFixed(2) : "0.00"
        }));

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
          balanceGraph: { data: balanceGraphData },
          weeklyRevenue: weeklyData,
          dailyPnL: { data: dailyPnLData },
          bestTradingPairs: { pairs: bestTradingPairsData },
          openPositions: { positions }
        });
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
        <div className="dashboard-column dashboard-column-cyan balance-graph w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <BalanceGraph balanceData={cardsData.balanceGraph} />
        </div>
        <div className="dashboard-column dashboard-column-purple weekly-revenue w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <WeeklyRevenue weeklyData={cardsData.weeklyRevenue} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
        <div className="dashboard-column dashboard-column-cyan">
          <DailyPnL balanceData={cardsData.dailyPnL} />
        </div>
        <div className="dashboard-column dashboard-column-purple">
          <BestTradingPairs pairsData={cardsData.bestTradingPairs} />
        </div>
      </div>

      <div className="mt-8">
        <div className="dashboard-column dashboard-column-green">
          {/* Pass balanceData directly — OpenPositions expects it */}
          <OpenPositions positions={cardsData.openPositions?.positions || []} />
        </div>
      </div>
    </>
  );
}