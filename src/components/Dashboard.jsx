// src/components/Admin/AdminDashboard.jsx

import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useNavigate } from "react-router-dom";
import "../styles/globals.css";
import Layout from "./Layout";

// Import Dashboard Card Components
import ActiveUsers from "../components/ActiveUsers";
import ActiveExchange from "../components/ActiveExchange";
import ActivePositions from "../components/ActivePositions";
import TotalBalances from "../components/TotalBalances";
import Profit from "../components/Profit";
import UPL from "../components/UPL";
import FundsDistribution from "../components/FundsDistribution";
import BalanceGraph from "../components/BalanceGraph";
import WeeklyRevenue from "../components/WeeklyRevenue";
import DailyPnL from "../components/DailyPnL";
import BestTradingPairs from "../components/BestTradingPairs";
import OpenPositions from "../components/OpenPositions";

// ✅ Import the shared DashboardCards component
import DashboardCards from "../components/DashboardCards";

// ---------------------
// LightModeToggle
// ---------------------
export function LightModeToggle({ className, style }) {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className || ""}`}
      style={style}
    >
      {isDarkMode ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

// ---------------------
// AdminDashboard
// ---------------------
export default function AdminDashboard() {
  const { isDarkMode } = useTheme();
  const { user: adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();

  const [cardsData, setCardsData] = useState({
    activeUsers: null,
    activeExchange: null,
    activePositions: null,
    totalBalances: null,
    profit: null,
    upl: null,
    fundsDistribution: null,
    balanceGraph: null,
    weeklyRevenue: null,
    dailyPnL: null,
    bestTradingPairs: null,
    openPositions: null,
  });

  const [balanceData, setBalanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // JWT check on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/check-auth", {
          method: "GET",
          credentials: "include",
          headers: { "Cache-Control": "no-store" },
        });
        const data = await res.json();
        if (!res.ok || data.role !== "admin") logout();
      } catch {
        logout();
      }
    };
    checkAuth();
  }, [logout]);

  // --- Fetch Aggregated and Detailed Data for Cards ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:5000/api/admin/users", {
          credentials: "include",
        });
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.message || "Failed to fetch admin dashboard data");
        }

        const { aggregated, adminDashboard } = result;

        // ✅ Compute Profit, UPL, Funds from adminDashboard
        let totalBalance = 0;
        let totalLongValue = 0;
        let totalShortValue = 0;
        let totalLongUPL = 0;
        let totalShortUPL = 0;

        if (adminDashboard.balances) {
          adminDashboard.balances.forEach(acc => {
            totalBalance += acc.balance?.totalBalance || 0;
          });
        }

        if (adminDashboard.positions) {
          adminDashboard.positions.forEach(pos => {
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
        }

        const totalUPL = totalLongUPL + totalShortUPL;

        const profitData = {
          total: totalBalance,
          long: totalLongValue,
          short: totalShortValue,
        };

        const uplData = {
          total: totalUPL,
          totalPercent: totalBalance > 0 ? (totalUPL / totalBalance) * 100 : 0,
          long: totalLongUPL,
          longPercent: totalBalance > 0 ? (totalLongUPL / totalBalance) * 100 : 0,
          short: totalShortUPL,
          shortPercent: totalBalance > 0 ? (totalShortUPL / totalBalance) * 100 : 0,
        };

        const fundsData = {
          totalBalance,
          available: 0, // or sum of available from balances
          long: totalLongValue,
          short: totalShortValue,
          totalPositions: totalLongValue + totalShortValue,
        };

        setCardsData({
          activeUsers: aggregated.activeUsers,
          activeExchange: aggregated.activeExchange,
          activePositions: aggregated.activePositions,
          totalBalances: aggregated.totalBalances,
          profit: profitData,
          upl: uplData,
          fundsDistribution: fundsData,
          balanceGraph: adminDashboard.balanceHistory || [],
          weeklyRevenue: adminDashboard.weeklyRevenue || [],
          dailyPnL: adminDashboard.dailyPnL || [],
          bestTradingPairs: adminDashboard.bestTradingPairs || [],
          openPositions: { positions: adminDashboard.positions || [] },
        });

        setBalanceData(adminDashboard);

      } catch (err) {
        console.error("Admin Dashboard fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="p-8 text-white">Loading admin dashboard...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading dashboard: {error}</div>;

  return (
    <Layout onLogout={logout}>
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6 flex justify-between items-center">
        <h1 className={`text-4xl font-semibold drop-shadow-md ${isDarkMode ? "text-white" : "text-black"}`}>
          Admin Dashboard
        </h1>
        <LightModeToggle />
      </div>

      <div className="dashboard-content">
        {/* Top 4 Cards */}
        <div className="grid grid-cols-4 gap-7 max-lg:grid-cols-2 max-sm:grid-cols-1 mb-6">
          <div className="dashboard-column dashboard-column-cyan">
            <ActiveUsers data={cardsData.activeUsers} />
          </div>
          <div className="dashboard-column dashboard-column-purple">
            <ActiveExchange data={cardsData.activeExchange} />
          </div>
          <div className="dashboard-column dashboard-column-green">
            <ActivePositions data={cardsData.activePositions} />
          </div>
          <div className="dashboard-column dashboard-column-teal">
            <TotalBalances data={cardsData.totalBalances} />
          </div>
        </div>

        {/* ✅ Use the shared DashboardCards component */}
        {/* Pass admin's ID as userId, isAdmin=true, and the fetched dashboardData */}
        <DashboardCards
          userId={adminUser?.id || null} // ✅ Pass the logged-in admin's ID
          isAdmin={true}                 // ✅ Indicate this is an admin view
          dashboardData={{
            // Pass original data fetched for admin
            balances: balanceData.balances || [],
            positions: balanceData.positions || [],
            openOrders: balanceData.openOrders || [],
            balanceHistory: balanceData.balanceHistory || [],
            weeklyRevenue: balanceData.weeklyRevenue || [],
            dailyPnL: balanceData.dailyPnL || [],
            bestTradingPairs: balanceData.bestTradingPairs || [],
            // ✅ CRITICAL: Pass computed card data
            profit: cardsData.profit,
            upl: cardsData.upl,
            fundsDistribution: cardsData.fundsDistribution,
          }}
        />
      </div>
    </Layout>
  );
}


// Reuse the existing DashboardCards component
function DashboardCard({ dashboardData }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-7 max-lg:grid-cols-1">
        <div className="dashboard-column dashboard-column-cyan">
          <Profit profitData={dashboardData.profit} />
        </div>
        <div className="dashboard-column dashboard-column-purple">
          <UPL uplData={dashboardData.upl} />
        </div>
        <div className="dashboard-column dashboard-column-green">
          <FundsDistribution fundsData={dashboardData.fundsDistribution} balanceData={dashboardData} />
        </div>
      </div>

      <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
        <div className="dashboard-column dashboard-column-cyan w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <BalanceGraph balanceData={dashboardData} />
        </div>
        <div className="dashboard-column dashboard-column-purple w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
          <WeeklyRevenue isDarkMode={false} balanceData={dashboardData} />
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
          <OpenPositions positions={dashboardData.positions || []} />
        </div>
      </div>
    </>
  );
}