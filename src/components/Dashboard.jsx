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
  const { logout } = useAdminAuth();
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

        setCardsData({
          activeUsers: aggregated.activeUsers,
          activeExchange: aggregated.activeExchange,
          activePositions: aggregated.activePositions,
          totalBalances: aggregated.totalBalances,
          profit: null,
          upl: null,
          fundsDistribution: null,
          balanceGraph: null,
          weeklyRevenue: null,
          dailyPnL: null,
          bestTradingPairs: null,
          openPositions: null,
        });

        // ✅ Pass adminDashboard directly — matches user dashboard structure
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
      {/* Title */}
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6 flex justify-between items-center">
        <h1
          className={`text-4xl font-semibold drop-shadow-md ${
            isDarkMode ? "text-white" : "text-black"
          }`}
        >
          Admin Dashboard
        </h1>
        <LightModeToggle />
      </div>

      {/* Dashboard content */}
      <div className="dashboard-content">
        {/* First Row - Top 4 Aggregated Cards */}
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

        {/* Reuse User Dashboard Cards */}
        <DashboardCards isAdmin={true} dashboardData={balanceData} />
      </div>
    </Layout>
  );
}

// Reuse the existing DashboardCards component
function DashboardCards({ dashboardData }) {
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