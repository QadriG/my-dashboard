/* eslint no-undef: "off" */
import React, { useRef, useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { useTheme } from "../context/ThemeContext";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useNavigate } from "react-router-dom";
import "../styles/globals.css";
import Layout from "./Layout";

// Dashboard components
import ActiveUsers from "../components/ActiveUsers.jsx";
import ActiveExchange from "../components/ActiveExchange.jsx";
import ActivePositions from "../components/ActivePositions.jsx";
import TotalBalances from "../components/TotalBalances.jsx";
import Profit from "../components/Profit.jsx";
import UPL from "../components/UPL.jsx";
import FundsDistribution from "../components/FundsDistribution.jsx";
import BalanceGraph from "../components/BalanceGraph.jsx";
import WeeklyRevenue from "../components/WeeklyRevenue.jsx";
import DailyPnL from "../components/DailyPnL.jsx";
import BestTradingPairs from "../components/BestTradingPairs.jsx";
import OpenPositions from "../components/OpenPositions.jsx";

// Reusable LightModeToggle
export function LightModeToggle({ className, style }) {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className || ""}`}
      style={style}
      onMouseEnter={(e) =>
        (e.target.style.boxShadow = isDarkMode
          ? "0 0 15px #00ffff, 0 0 25px #00ffff, 0 0 40px #00ffff"
          : "0 0 15px #0000ff, 0 0 25px #0000ff, 0 0 40px #0000ff")
      }
      onMouseLeave={(e) =>
        (e.target.style.boxShadow = isDarkMode
          ? "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff"
          : "0 0 10px #0000ff, 0 0 20px #0000ff, 0 0 30px #0000ff")
      }
    >
      {isDarkMode ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

// ---------------------
// AdminDashboard
// ---------------------
export default function AdminDashboard() {
  const audioRef = useRef(null);
  const { isDarkMode } = useTheme();
  const { logout, admin } = useAdminAuth(); // get admin info
  const navigate = useNavigate();

  const [expandedCard, setExpandedCard] = useState(null);

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

  const handleCardClick = (key) => {
    if (!isMobile) setExpandedCard(expandedCard === key ? null : key);
  };

  const cards = {
    activeUsers: <ActiveUsers />,
    activeExchange: <ActiveExchange />,
    activePositions: <ActivePositions />,
    totalBalances: <TotalBalances />,
    profit: <Profit />,
    upl: <UPL />,
    fundsDistribution: <FundsDistribution />,
    balanceGraph: <BalanceGraph />,
    weeklyRevenue: <WeeklyRevenue />,
    dailyPnL: <DailyPnL />,
    bestTradingPairs: <BestTradingPairs />,
    openPositions: <OpenPositions />,
  };

  return (
    <Layout onLogout={logout}>
      {/* Title */}
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6 relative flex justify-between items-center">
        <h1
          className={`text-4xl font-semibold drop-shadow-md inline-block ${
            isDarkMode ? "text-white" : "text-black"
          }`}
        >
          Dashboard
        </h1>
        <LightModeToggle />
      </div>

      {/* Dashboard content */}
      <div className="dashboard-content">
        {!isMobile && (
          <div className="grid grid-cols-4 gap-7 max-lg:grid-cols-2 max-sm:grid-cols-1 mb-6">
            <div
              className="dashboard-column dashboard-column-cyan"
              onClick={() => handleCardClick("activeUsers")}
            >
              {cards.activeUsers}
            </div>
            <div
              className="dashboard-column dashboard-column-purple"
              onClick={() => handleCardClick("activeExchange")}
            >
              {cards.activeExchange}
            </div>
            <div
              className="dashboard-column dashboard-column-green"
              onClick={() => handleCardClick("activePositions")}
            >
              {cards.activePositions}
            </div>
            <div
              className="dashboard-column dashboard-column-teal"
              onClick={() => handleCardClick("totalBalances")}
            >
              {cards.totalBalances}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-7 max-lg:grid-cols-1">
          <div
            className="dashboard-column dashboard-column-cyan"
            onClick={() => handleCardClick("profit")}
          >
            {cards.profit}
          </div>
          <div
            className="dashboard-column dashboard-column-purple"
            onClick={() => handleCardClick("upl")}
          >
            {cards.upl}
          </div>
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("fundsDistribution")}
          >
            {cards.fundsDistribution}
          </div>
        </div>

        <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
          <div
            className="dashboard-column dashboard-column-cyan balance-graph w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden"
            onClick={() => handleCardClick("balanceGraph")}
          >
            {cards.balanceGraph}
          </div>
          <div
            className="dashboard-column dashboard-column-purple weekly-revenue w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden"
            onClick={() => handleCardClick("weeklyRevenue")}
          >
            {cards.weeklyRevenue}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
          <div
            className="dashboard-column dashboard-column-cyan"
            onClick={() => handleCardClick("dailyPnL")}
          >
            {cards.dailyPnL}
          </div>
          <div
            className="dashboard-column dashboard-column-purple"
            onClick={() => handleCardClick("bestTradingPairs")}
          >
            {cards.bestTradingPairs}
          </div>
        </div>

        <div className="mt-8">
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("openPositions")}
          >
            {cards.openPositions}
          </div>
        </div>

        {/* View All Positions Button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => navigate("/admin/positions")}
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-[0_0_10px_#ff1a1a] hover:shadow-[0_0_20px_5px_#ff1a1a] hover:scale-[1.05]"
          >
            View All Positions
          </button>
        </div>
      </div>
    </Layout>
  );
}
