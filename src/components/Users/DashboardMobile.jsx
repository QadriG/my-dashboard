/* eslint no-undef: "off" */
import React, { useRef, useState, useEffect } from "react";
import { isMobile } from "react-device-detect";
import { useNavigate } from "react-router-dom";   // ✅ added
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

/* Disable heavy/video content on mobile by passing a prop */
const filterVideoContent = (component) => {
  if (isMobile) {
    return React.cloneElement(component, { disableVideo: true });
  }
  return component;
};

/* Small helper to wrap and scale each card individually */
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

  const navigate = useNavigate();   // ✅ added

  // ✅ JWT Check on mount
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

  // ✅ Logout handler
  const handleLogout = async () => {
  try {
    await fetch("http://localhost:5000/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    // Clear any cached tokens/state
    localStorage.clear();
    sessionStorage.clear();

    // Redirect & prevent going back
    navigate("/login", { replace: true });

    // Force refresh to drop any cached UI
    window.location.reload();
  } catch (err) {
    console.error("Logout failed:", err);
  }
};

  // ✅ Prevent going back after logout
  useEffect(() => {
    const handlePopState = () => {
      navigate("/login", { replace: true });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  // ✅ Existing code continues unchanged
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

  const cards = {
    profit: filterVideoContent(<Profit />),
    upl: filterVideoContent(<UPL />),
    fundsDistribution: filterVideoContent(<FundsDistribution />),
    balanceGraph: filterVideoContent(<BalanceGraph isDarkMode={isDarkMode} />),
    weeklyRevenue: filterVideoContent(<WeeklyRevenue isDarkMode={isDarkMode} />),
    dailyPnL: filterVideoContent(<DailyPnL />),
    bestTradingPairs: filterVideoContent(<BestTradingPairs />),
    openPositions: filterVideoContent(<OpenPositions />),
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

      {/* Mobile Sidebar */}
      <UserSidebar isOpen={sidebarOpen} playHoverSound={playHoverSound} onLogout={handleLogout} /> {/* ✅ pass logout */}

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
        <div className="shimmer-wrapper w-full py-4 px-6 mb-4" style={{ position: "relative" }}>
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
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              padding: "0.5rem 1rem",
              backgroundColor: isDarkMode ? "#333" : "#ddd",
              color: isDarkMode ? "#fff" : "#000",
              border: "2px solid " + (isDarkMode ? "#00ffff" : "#0000ff"),
              borderRadius: "4px",
              cursor: "pointer",
              boxShadow: isDarkMode
                ? "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff"
                : "0 0 10px #0000ff, 0 0 20px #0000ff, 0 0 30px #0000ff",
              transition: "all 0.3s ease",
              width: "10rem",
              height: "100%",
            }}
          >
            {buttonText}
          </button>
        </div>

        {/* Row 1: Only remaining user cards */}
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
