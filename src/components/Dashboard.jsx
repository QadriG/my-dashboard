/* eslint no-undef: "off" */
import React, { useRef, useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
import { useTheme } from "../context/ThemeContext";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import "../styles/globals.css";
import Layout from "./Layout";

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

export default function AdminDashboard() {
  const API_BASE_URL = process.env.REACT_APP_API_URL;
  const audioRef = useRef(null);
  const { isDarkMode } = useTheme();
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const socket = useSocket(API_BASE_URL);

  const [expandedCard, setExpandedCard] = useState(null);
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

  // 🔒 JWT check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/check-auth`, {
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
  }, [logout, API_BASE_URL]);

  // 💰 Fetch all user balances
  useEffect(() => {
    const fetchAllBalances = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setBalanceData(
            data.users.map((user) => ({
              ...user,
              balanceData: user.balanceData || [],
            }))
          );
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
  }, [API_BASE_URL]);

  // 🔄 Real-time updates via socket
  useEffect(() => {
    if (!socket) return;
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

      {loading && <p>Loading balances...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="dashboard-content">
        {/* Key cards */}
        <div className="grid grid-cols-4 gap-7 max-lg:grid-cols-2 max-sm:grid-cols-1 mb-6">
          <div onClick={() => handleCardClick("activeUsers")}>{cards.activeUsers}</div>
          <div onClick={() => handleCardClick("activeExchange")}>{cards.activeExchange}</div>
          <div onClick={() => handleCardClick("activePositions")}>{cards.activePositions}</div>
          <div onClick={() => handleCardClick("totalBalances")}>{cards.totalBalances}</div>
        </div>

        <div className="grid grid-cols-3 gap-7 max-lg:grid-cols-1">
          <div>{cards.profit}</div>
          <div>{cards.upl}</div>
          <div>{cards.fundsDistribution}</div>
        </div>

        <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
          <div className="w-full lg:w-1/2">{cards.balanceGraph}</div>
          <div className="w-full lg:w-1/2">{cards.weeklyRevenue}</div>
        </div>

        <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
          <div>{cards.dailyPnL}</div>
          <div>{cards.bestTradingPairs}</div>
        </div>

        <div className="mt-8">{cards.openPositions}</div>

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
