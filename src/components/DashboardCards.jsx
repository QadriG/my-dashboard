import { useEffect, useState, useCallback } from "react";
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

  const fetchDashboardData = useCallback(async () => {
    try {
      const url = isAdmin
        ? `http://localhost:5000/api/admin/dashboard?userId=${userId}`
        : `http://localhost:5000/api/user/dashboard?userId=${userId}`;

      const res = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: { "Cache-Control": "no-store" },
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Dashboard API Response:", data);
        setCardsData((prev) => ({
          ...prev,
          profit: data.profit || prev.profit || { total: 0, long: 0, short: 0 },
          upl: data.upl || prev.upl || { total: 0, totalPercent: 0, long: 0, longPercent: 0, short: 0, shortPercent: 0 },
          fundsDistribution: data.fundsDistribution || prev.fundsDistribution || { totalBalance: 0, available: 0, long: 0, short: 0, totalPositions: 0 },
          balanceGraph: data.balanceGraph || prev.balanceGraph || { balances: { data: [] } },
          weeklyRevenue: data.weeklyRevenue || prev.weeklyRevenue || { labels: [], revenues: [] },
          dailyPnL: data.dailyPnL || prev.dailyPnL || {},
          bestTradingPairs: data.bestTradingPairs || prev.bestTradingPairs || {},
          openPositions: data.openPositions || prev.openPositions || {},
        }));
      } else {
        console.error("Failed to fetch dashboard data:", await res.text());
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  }, [isAdmin, userId]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  return (
    <>
      {/* Top row: Profit, UPL, Funds Distribution */}
      <div className="grid grid-cols-3 gap-7 max-lg:grid-cols-1">
        <div className="dashboard-column dashboard-column-cyan">
          <Profit profitData={cardsData.profit || { total: 0, long: 0, short: 0 }} />
        </div>
        <div className="dashboard-column dashboard-column-purple">
          <UPL uplData={cardsData.upl || { total: 0, totalPercent: 0, long: 0, longPercent: 0, short: 0, shortPercent: 0 }} />
        </div>
        <div className="dashboard-column dashboard-column-green">
          <FundsDistribution
            fundsData={cardsData.fundsDistribution || { totalBalance: 0, available: 0, long: 0, short: 0, totalPositions: 0 }}
            balanceData={balanceData}
          />
        </div>
      </div>

      {/* Middle row: Balance Graph & Weekly Revenue */}
      <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
        <div className="dashboard-column dashboard-column-cyan balance-graph w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <BalanceGraph balanceData={cardsData.balanceGraph || { balances: { data: [] } }} />
        </div>
        <div className="dashboard-column dashboard-column-purple weekly-revenue w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <WeeklyRevenue weeklyData={cardsData.weeklyRevenue || { labels: [], revenues: [] }} />
        </div>
      </div>

      {/* Bottom row: Daily PnL & Best Trading Pairs */}
      <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
        <div className="dashboard-column dashboard-column-cyan">
          <DailyPnL dailyData={cardsData.dailyPnL || {}} />
        </div>
        <div className="dashboard-column dashboard-column-purple">
          <BestTradingPairs pairsData={cardsData.bestTradingPairs || {}} />
        </div>
      </div>

      {/* Open Positions */}
      <div className="mt-8">
        <div className="dashboard-column dashboard-column-green">
          <OpenPositions positionsData={cardsData.openPositions || {}} />
        </div>
      </div>
    </>
  );
}