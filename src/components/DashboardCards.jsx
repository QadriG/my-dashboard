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
        balanceGraph: { balances: { data: balance.dailyData || [] } },
        dailyPnL: { availableFunds: balance.available || 0 },
        profit: prev.profit || { total: 0, long: 0, short: 0 },
        upl: prev.upl || {
          total: 0,
          totalPercent: 0,
          long: 0,
          longPercent: 0,
          short: 0,
          shortPercent: 0,
        },
        weeklyRevenue: prev.weeklyRevenue || { labels: [], revenues: [] },
        bestTradingPairs: prev.bestTradingPairs || {},
        openPositions: prev.openPositions || [],
      }));
    }
  }, [balanceData]);

  return (
    <>
      <div className="grid grid-cols-3 gap-7 max-lg:grid-cols-1">
        <div><Profit profitData={cardsData.profit} /></div>
        <div><UPL uplData={cardsData.upl} /></div>
        <div><FundsDistribution fundsData={cardsData.fundsDistribution} balanceData={balanceData} /></div>
      </div>

      <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
        <div className="w-full lg:w-1/2"><BalanceGraph balanceData={cardsData.balanceGraph} /></div>
        <div className="w-full lg:w-1/2"><WeeklyRevenue weeklyData={cardsData.weeklyRevenue} /></div>
      </div>

      <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
        <div><DailyPnL balanceData={cardsData.dailyPnL} /></div>
        <div><BestTradingPairs pairsData={cardsData.bestTradingPairs} /></div>
      </div>

      <div className="mt-8">
        <OpenPositions positionsData={cardsData.openPositions} />
      </div>
    </>
  );
}
