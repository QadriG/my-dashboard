import React, { useRef, useEffect, useState } from "react";
import { isMobile } from "react-device-detect";
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

export default function AdminDashboard() {
  const audioRef = useRef(null);
  const navigate = useNavigate();

  const [expandedCard, setExpandedCard] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [buttonText, setButtonText] = useState("Light Mode");

  // ✅ Logout handler
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login", { replace: true });
      window.location.reload();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // ✅ JWT check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/check-auth", {
          method: "GET",
          credentials: "include",
          headers: { "Cache-Control": "no-store" },
        });
        const data = await res.json();
        if (!res.ok || data.role !== "admin") {
          localStorage.clear();
          sessionStorage.clear();
          navigate("/login", { replace: true });
        }
      } catch {
        localStorage.clear();
        sessionStorage.clear();
        navigate("/login", { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);

  // Toggle light/dark theme
  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
    setButtonText((prev) => (prev === "Light Mode" ? "Dark Mode" : "Light Mode"));
  };

  const buttonStyle = {
    position: "absolute",
    top: 0,
    right: 0,
    padding: "0.5rem 1rem",
    backgroundColor: isDarkMode ? "#333" : "#ddd",
    color: isDarkMode ? "#fff" : "#000",
    border: "2px solid " + (isDarkMode ? "#00ffff" : "#0000ff"),
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1.2rem",
  };

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
    <Layout onLogout={handleLogout}>
      {/* Title Bar */}
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6 relative">
        <h1 className="text-4xl font-semibold drop-shadow-md inline-block" style={{ color: isDarkMode ? "#fff" : "#000" }}>
          Dashboard
        </h1>
        <button onClick={toggleTheme} style={buttonStyle}>
          {buttonText}
        </button>
      </div>

      {/* Dashboard Content */}
      <div className={`dashboard-content ${isDarkMode ? "dark-mode" : "light-mode"}`}>
        {!isMobile && (
          <div className="grid grid-cols-4 gap-7 max-lg:grid-cols-2 max-sm:grid-cols-1 mb-6">
            <div className="dashboard-column dashboard-column-cyan" onClick={() => handleCardClick("activeUsers")}>{cards.activeUsers}</div>
            <div className="dashboard-column dashboard-column-purple" onClick={() => handleCardClick("activeExchange")}>{cards.activeExchange}</div>
            <div className="dashboard-column dashboard-column-green" onClick={() => handleCardClick("activePositions")}>{cards.activePositions}</div>
            <div className="dashboard-column dashboard-column-teal" onClick={() => handleCardClick("totalBalances")}>{cards.totalBalances}</div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-7 max-lg:grid-cols-1">
          <div className="dashboard-column dashboard-column-cyan" onClick={() => handleCardClick("profit")}>{cards.profit}</div>
          <div className="dashboard-column dashboard-column-purple" onClick={() => handleCardClick("upl")}>{cards.upl}</div>
          <div className="dashboard-column dashboard-column-green" onClick={() => handleCardClick("fundsDistribution")}>{cards.fundsDistribution}</div>
        </div>

        <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
          <div className="dashboard-column dashboard-column-cyan balance-graph w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden" onClick={() => handleCardClick("balanceGraph")}>{cards.balanceGraph}</div>
          <div className="dashboard-column dashboard-column-purple weekly-revenue w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden" onClick={() => handleCardClick("weeklyRevenue")}>{cards.weeklyRevenue}</div>
        </div>

        <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
          <div className="dashboard-column dashboard-column-cyan" onClick={() => handleCardClick("dailyPnL")}>{cards.dailyPnL}</div>
          <div className="dashboard-column dashboard-column-purple" onClick={() => handleCardClick("bestTradingPairs")}>{cards.bestTradingPairs}</div>
        </div>

        <div className="mt-8">
          <div className="dashboard-column dashboard-column-green" onClick={() => handleCardClick("openPositions")}>{cards.openPositions}</div>
        </div>
      </div>
    </Layout>
  );
}
