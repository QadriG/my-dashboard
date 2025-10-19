 /* eslint no-undef: "off" */
import React, { useRef, useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { useTheme } from "../context/ThemeContext";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
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
  const audioRef = useRef(null);
  const { isDarkMode } = useTheme();
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const socket = useSocket("http://localhost:5000");

  const [expandedCard, setExpandedCard] = useState(null);

  // --- Centralized state for all cards ---
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

  // --- State for balance data ---
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

  // --- Fetch balance data for all users ---
  useEffect(() => {
  const fetchAllBalances = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/users", { credentials: "include" });
      const data = await res.json();
      if (data.success) {
        setBalanceData(data.users.map(user => ({ ...user, balanceData: user.balanceData || [] })));
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to fetch balances");
    } finally {
      setLoading(false);
    }
  };
  fetchAllBalances();
}, []);

  // --- Real-time data subscription for admin ---
  useEffect(() => {
    if (!socket) return;

    // Admin channel: all users & system-wide data
    socket.on("dashboard/all", (update) => {
      setCardsData((prev) => ({ ...prev, ...update }));
    });

    return () => socket.off("dashboard/all");
  }, [socket]);

  const handleCardClick = (key) => {
    if (!isMobile) setExpandedCard(expandedCard === key ? null : key);
  };

  const cards = {
    activeUsers: <ActiveUsers data={cardsData.activeUsers} />,
    activeExchange: <ActiveExchange data={cardsData.activeExchange} />,
    activePositions: <ActivePositions data={cardsData.activePositions} />,
    totalBalances: <TotalBalances data={cardsData.totalBalances || balanceData} />,
    profit: <Profit profitData={cardsData.profit} />,
    upl: <UPL uplData={cardsData.upl} />,
    fundsDistribution: <FundsDistribution fundsData={cardsData.fundsDistribution} />,
    balanceGraph: <BalanceGraph balanceData={cardsData.balanceGraph || balanceData} />,
    weeklyRevenue: <WeeklyRevenue weeklyData={cardsData.weeklyRevenue} />,
    dailyPnL: <DailyPnL dailyData={cardsData.dailyPnL} />,
    bestTradingPairs: <BestTradingPairs pairsData={cardsData.bestTradingPairs} />,
    openPositions: <OpenPositions positionsData={cardsData.openPositions} />,
  };

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

      {/* Display Balance Data */}
      {loading && <p>Loading balances...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {balanceData.length > 0 && (
        <div className="mt-6 p-4 bg-black/30 rounded-lg">
          <h2 className="text-xl font-semibold">User Balances</h2>
          {balanceData.map((userBalance, index) => (
            <div key={index} className="mt-2">
              <p>User: {userBalance.email} (ID: {userBalance.userId})</p>
              {userBalance.balance && userBalance.balance.length > 0 ? (
                userBalance.balance.map((data, idx) => (
                  <div key={idx} className="ml-4">
                    <p>Exchange: {data.exchange}</p>
                    <p>Balance: {JSON.stringify(data.balances)}</p>
                    <p>Open Orders - Spot: {data.openOrders.spot}</p>
                    <p>Open Orders - Futures: {data.openOrders.futures}</p>
                    <p>Positions: {JSON.stringify(data.positions)}</p>
                  </div>
                ))
              ) : (
                <p className="ml-4">No balance data for this user</p>
              )}
            </div>
          ))}
        </div>
      )}
      {!loading && !error && balanceData.length === 0 && (
        <p className="mt-6">No balance data available</p>
      )}

      {/* Dashboard content */}
      <div className="dashboard-content">
        {/* First Row */}
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

        {/* Profit, UPL, Funds */}
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

        {/* Balance + Weekly */}
        <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
          <div
            className="dashboard-column dashboard-column-cyan w-full lg:w-1/2"
            onClick={() => handleCardClick("balanceGraph")}
          >
            {cards.balanceGraph}
          </div>
          <div
            className="dashboard-column dashboard-column-purple w-full lg:w-1/2"
            onClick={() => handleCardClick("weeklyRevenue")}
          >
            {cards.weeklyRevenue}
          </div>
        </div>

        {/* Daily + Best Pairs */}
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

        {/* Open Positions */}
        <div className="mt-8">
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("openPositions")}
          >
            {cards.openPositions}
          </div>
        </div>

        {/* View All Positions */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => navigate("/admin/positions")}
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold transition-all"
          >
            View All Positions
          </button>
        </div>
      </div>
    </Layout>
  );
}

// Note: `fetchUserExchangeData` is assumed to be available globally or via a helper. If not, import it from "server/services/exchangeDataSync.mjs" and ensure server-side access or use a proxy.