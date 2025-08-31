import React, { useRef, useState, useEffect } from "react";
import { isMobile } from "react-device-detect";
import { useTheme } from "../../context/ThemeContext";
import "../../styles/sidebar.css";
import "../../styles/globals.css";
import UserSidebar from "./Sidebar.jsx"; 
import hoverSound from "../../assets/click.mp3";
import Profit from "../Profit.jsx";
import UPL from "../UPL.jsx";
import FundsDistribution from "../FundsDistribution.jsx";
import BalanceGraph from "../BalanceGraph.jsx";
import WeeklyRevenue from "../WeeklyRevenue.jsx";
import DailyPnL from "../DailyPnL.jsx";
import BestTradingPairs from "../BestTradingPairs.jsx";
import OpenPositions from "../OpenPositions.jsx";
import { useUserAuth } from "../../hooks/useUserAuth";

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
// UserDashboard
// ---------------------
export default function UserDashboard() {
  const audioRef = useRef(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const { isDarkMode } = useTheme();
  const { logout } = useUserAuth(); // centralized logout

  // ----------------------
  // Admin-style logout + JWT check
  // ----------------------
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/check-auth", {
          method: "GET",
          credentials: "include",
          headers: { "Cache-Control": "no-store" },
        });
        const data = await res.json();

        // Force logout if not authorized
        if (!res.ok || data.role !== "user") logout();
      } catch {
        logout();
      }
    };
    checkAuth();

    // Optional: prevent back-button cached pages
    const handlePopState = () => logout();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [logout]);

  const handleCardClick = (key) => {
    if (!isMobile) setExpandedCard(expandedCard === key ? null : key);
  };

  const playHoverSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const cards = {
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
    <div className="zoom-out-container relative h-screen w-screen overflow-x-hidden overflow-y-auto">
      <audio ref={audioRef} preload="auto">
        <source src={hoverSound} type="audio/mpeg" />
      </audio>

      {/* Sidebar */}
      <UserSidebar isOpen={true} playHoverSound={playHoverSound} onLogout={logout} />

      {/* Main Content */}
      <main className="relative z-20 p-6 overflow-y-auto md:ml-64" style={{ height: "100vh", width: "100%", maxWidth: "calc(100vw - 16rem)" }}>
        <div className="shimmer-wrapper w-full py-4 px-6 mb-6 relative flex justify-between items-center">
          <h1 className="text-4xl font-semibold drop-shadow-md inline-block title-bar-text">
            Dashboard
          </h1>
          <LightModeToggle />
        </div>

        {/* Cards */}
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
      </main>
    </div>
  );
}
