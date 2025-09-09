import React, { useRef, useState, useEffect } from "react";
import { isMobile } from "react-device-detect";
import { useTheme } from "../../context/ThemeContext";
import "../../styles/sidebar.css";
import "../../styles/globals.css";
import UserSidebar from "./Sidebar.jsx"; 
import hoverSound from "../../assets/click.mp3";
import Profit from "./Profit.jsx";
import UPL from "./UPL.jsx";
import FundsDistribution from "./FundsDistribution.jsx";
import BalanceGraph from "./BalanceGraph.jsx";
import WeeklyRevenue from "./WeeklyRevenue.jsx";
import DailyPnL from "./DailyPnL.jsx";
import BestTradingPairs from "./BestTradingPairs.jsx";
import OpenPositions from "./OpenPositions.jsx";
import { useUserAuth } from "../../hooks/useUserAuth";
import { useNavigate, useLocation } from "react-router-dom";

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
  const { logout } = useUserAuth(); 
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Detect admin view
  const adminView = location.state?.adminView || false;
  const userId = location.state?.userId || null;

  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        let authRes = await fetch("http://localhost:5000/api/auth/check-auth", {
          method: "GET",
          credentials: "include",
          headers: { "Cache-Control": "no-store" },
        });
        let authData = await authRes.json();

        // ✅ If admin viewing another user, skip logout check
        if (!adminView && (!authRes.ok || authData.role !== "user")) {
          logout();
          return;
        }

        // ✅ Fetch dashboard data
        let dashUrl = adminView
          ? `http://localhost:5000/api/admin/users/${userId}/dashboard`
          : "http://localhost:5000/api/user/dashboard";

        const dashRes = await fetch(dashUrl, {
          method: "GET",
          credentials: "include",
          headers: { "Cache-Control": "no-store" },
        });

        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setDashboardData(dashData);
        } else {
          console.error("Failed to fetch dashboard data");
        }
      } catch (err) {
        console.error("Error:", err);
        if (!adminView) logout(); // only logout if normal user
      }
    };

    checkAuthAndFetch();

    const handlePopState = () => logout();
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [logout, adminView, userId]);

  const handleCardClick = (key) => {
    if (!isMobile) setExpandedCard(expandedCard === key ? null : key);
  };

  const playHoverSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="zoom-out-container relative h-screen w-screen overflow-x-hidden overflow-y-auto">
      <audio ref={audioRef} preload="auto">
        <source src={hoverSound} type="audio/mpeg" />
      </audio>

      {/* ✅ Render sidebar ONLY if not admin view */}
      {!adminView && (
        <UserSidebar isOpen={true} playHoverSound={playHoverSound} onLogout={logout} />
      )}

      <main
  className={`relative z-20 p-6 overflow-y-auto ${
    adminView ? "md:ml-64" : "md:ml-64" // adminView ? admin sidebar width : normal user sidebar width
  }`}
  style={{
    height: "100vh",
    width: "100%",
    maxWidth: "calc(100vw - 16rem)", // leave space for sidebar
  }}
>

        <div className="shimmer-wrapper w-full py-4 px-6 mb-6 relative flex justify-between items-center">
          <h1 className="text-4xl font-semibold drop-shadow-md inline-block title-bar-text">
            Dashboard
          </h1>
          <LightModeToggle />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-3 gap-7 max-lg:grid-cols-1">
          <div className="dashboard-column dashboard-column-cyan" onClick={() => handleCardClick("profit")}>
            <Profit profitData={dashboardData?.profit} />
          </div>
          <div className="dashboard-column dashboard-column-purple" onClick={() => handleCardClick("upl")}>
            <UPL uplData={dashboardData?.upl} />
          </div>
          <div className="dashboard-column dashboard-column-green" onClick={() => handleCardClick("fundsDistribution")}>
            <FundsDistribution fundsData={dashboardData?.fundsDistribution} />
          </div>
        </div>

        <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
          <div className="dashboard-column dashboard-column-cyan balance-graph w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden" onClick={() => handleCardClick("balanceGraph")}>
            <BalanceGraph balanceData={dashboardData?.balanceGraph} />
          </div>
          <div className="dashboard-column dashboard-column-purple weekly-revenue w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden" onClick={() => handleCardClick("weeklyRevenue")}>
            <WeeklyRevenue weeklyData={dashboardData?.weeklyRevenue} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
          <div className="dashboard-column dashboard-column-cyan" onClick={() => handleCardClick("dailyPnL")}>
            <DailyPnL dailyData={dashboardData?.dailyPnL} />
          </div>
          <div className="dashboard-column dashboard-column-purple" onClick={() => handleCardClick("bestTradingPairs")}>
            <BestTradingPairs pairsData={dashboardData?.bestTradingPairs} />
          </div>
        </div>

        <div className="mt-8">
          <div className="dashboard-column dashboard-column-green" onClick={() => handleCardClick("openPositions")}>
            <OpenPositions positionsData={dashboardData?.openPositions} />
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate(adminView ? `/admin/users/${userId}/positions` : "/user/positions")}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition"
          >
            View All Positions
          </button>
        </div>
      </main>
    </div>
  );
}
