/* eslint no-undef: "off" */
import React, { useRef, useState, useEffect } from "react";
import { isMobile } from "react-device-detect";
import { useNavigate } from "react-router-dom";
import "../../styles/sidebar.css";
import "../../styles/globals.css";
import hoverSound from "../../assets/click.mp3";

import UserSidebar from "./UserSidebar.jsx";

import Profit from "../Profit.jsx";
import UPL from "../UPL.jsx";
import FundsDistribution from "../FundsDistribution.jsx";
import BalanceGraph from "../BalanceGraph.jsx";
import WeeklyRevenue from "../WeeklyRevenue.jsx";
import DailyPnL from "../DailyPnL.jsx";
import BestTradingPairs from "../BestTradingPairs.jsx";
import OpenPositions from "../OpenPositions.jsx";

/* Small helper for video-heavy components */
const filterVideoContent = (component) => {
  if (isMobile) {
    return React.cloneElement(component, { disableVideo: true });
  }
  return component;
};

const Card = ({ className = "", onClick, children }) => (
  <div className={`scaled-card dashboard-column ${className}`} onClick={onClick}>
    {children}
  </div>
);

export default function DashboardMobile() {
  const audioRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [buttonText, setButtonText] = useState("Light Mode");

  const [dashboardData, setDashboardData] = useState(null); // ✅ backend data
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ✅ JWT check on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/check-auth", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || data.role !== "user") {
          navigate("/login");
        }
      } catch (err) {
        console.error(err);
        navigate("/login");
      }
    };
    checkAuth();
  }, [navigate]);

  // ✅ Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/user/dashboard", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setDashboardData(data);
        }
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // ✅ Prevent back nav after logout
  useEffect(() => {
    const handlePopState = () => {
      navigate("/login", { replace: true });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  // ✅ Mobile scaling
  useEffect(() => {
    const setScale = () => {
      const designWidth = 390;
      const w = Math.max(320, Math.min(window.innerWidth, 768));
      const scale = Math.max(0.85, Math.min(1, w / designWidth));
      document.documentElement.style.setProperty("--card-scale", scale.toString());
    };
    setScale();
    window.addEventListener("resize", setScale);
    return () => window.removeEventListener("resize", setScale);
  }, []);

  const playHoverSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
    setButtonText((prev) => (prev === "Light Mode" ? "Dark Mode" : "Light Mode"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-xl text-gray-400">
        Loading dashboard...
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-screen text-red-400">
        Failed to load dashboard data
      </div>
    );
  }

  // ✅ Pass backend data to widgets
  const cards = {
    profit: filterVideoContent(<Profit data={dashboardData.profit} />),
    upl: filterVideoContent(<UPL data={dashboardData.upl} />),
    fundsDistribution: filterVideoContent(
      <FundsDistribution data={dashboardData.fundsDistribution} />
    ),
    balanceGraph: filterVideoContent(
      <BalanceGraph isDarkMode={isDarkMode} data={dashboardData.balanceGraph} />
    ),
    weeklyRevenue: filterVideoContent(
      <WeeklyRevenue isDarkMode={isDarkMode} data={dashboardData.weeklyRevenue} />
    ),
    dailyPnL: filterVideoContent(<DailyPnL data={dashboardData.dailyPnL} />),
    bestTradingPairs: filterVideoContent(
      <BestTradingPairs data={dashboardData.bestTradingPairs} />
    ),
    openPositions: filterVideoContent(
      <OpenPositions data={dashboardData.openPositions} />
    ),
  };

  const handleCardClick = (key) => {
    setExpandedCard(expandedCard === key ? null : key);
  };

  return (
    <div
      className={`relative overflow-hidden ${isDarkMode ? "dark-mode" : "light-mode"}`}
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        backgroundColor: isDarkMode ? "#000" : "#fff",
      }}
    >
      <audio ref={audioRef} preload="auto">
        <source src={hoverSound} type="audio/mpeg" />
      </audio>

      {/* Sidebar */}
      <UserSidebar
        isOpen={sidebarOpen}
        playHoverSound={playHoverSound}
        onLogout={handleLogout}
      />

      <button
        className={`sidebar-toggle-btn ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
        style={{ zIndex: 1101, position: "fixed" }}
      >
        ☰
      </button>

      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main
        className="relative z-20 p-4 overflow-y-auto"
        style={{
          height: "100%",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          transition: "left 0.3s ease",
          zIndex: 20,
          color: isDarkMode ? "#fff" : "#000",
          backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)",
        }}
      >
        <div className="shimmer-wrapper w-full py-4 px-6 mb-4 relative">
          <h1
            className="text-2xl font-semibold drop-shadow-md inline-block"
            style={{
              color: isDarkMode ? "#fff" : "#000",
              paddingLeft: isMobile ? "1.5rem" : "0",
            }}
          >
            Dashboard
          </h1>
          <button
            onClick={toggleTheme}
            className="absolute top-0 right-0 px-4 py-2 rounded"
            style={{
              backgroundColor: isDarkMode ? "#333" : "#ddd",
              color: isDarkMode ? "#fff" : "#000",
              border: `2px solid ${isDarkMode ? "#00ffff" : "#0000ff"}`,
              boxShadow: isDarkMode
                ? "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff"
                : "0 0 10px #0000ff, 0 0 20px #0000ff, 0 0 30px #0000ff",
              transition: "all 0.3s ease",
            }}
          >
            {buttonText}
          </button>
        </div>

        {/* Cards layout remains same */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Card className="dashboard-column-cyan" onClick={() => handleCardClick("profit")}>
            {cards.profit}
          </Card>
          <Card className="dashboard-column-purple" onClick={() => handleCardClick("upl")}>
            {cards.upl}
          </Card>
          <Card
            className="dashboard-column-green"
            onClick={() => handleCardClick("fundsDistribution")}
          >
            {cards.fundsDistribution}
          </Card>
        </div>

        <div className="mobile-stack flex gap-2 w-full items-start mt-4 max-lg:flex-col">
          <Card
            className="dashboard-column-cyan w-full lg:w-1/2 p-2 max-h-[60px] h-[60px] overflow-hidden"
            onClick={() => handleCardClick("balanceGraph")}
          >
            {cards.balanceGraph}
          </Card>
          <Card
            className="dashboard-column-purple w-full lg:w-1/2 p-2 max-h-[60px] h-[60px] overflow-hidden"
            onClick={() => handleCardClick("weeklyRevenue")}
          >
            {cards.weeklyRevenue}
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 max-sm:grid-cols-1">
          <Card className="dashboard-column-cyan" onClick={() => handleCardClick("dailyPnL")}>
            {cards.dailyPnL}
          </Card>
          <Card
            className="dashboard-column-purple"
            onClick={() => handleCardClick("bestTradingPairs")}
          >
            {cards.bestTradingPairs}
          </Card>
        </div>

        <div className="mt-4">
          <Card className="dashboard-column-green" onClick={() => handleCardClick("openPositions")}>
            {cards.openPositions}
          </Card>
        </div>
      </main>
    </div>
  );
}
