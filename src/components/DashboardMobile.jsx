import React, { useRef, useState, useEffect } from "react";
import { isMobile } from "react-device-detect";
import "../styles/sidebar.css";
import "../styles/globals.css";
import hoverSound from "../assets/click.mp3";

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
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [buttonText, setButtonText] = useState("Light Mode"); // State for alternating text

  /* Compute a smooth per-component scale for small screens */
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
    activeUsers: filterVideoContent(<ActiveUsers />),
    activeExchange: filterVideoContent(<ActiveExchange />),
    activePositions: filterVideoContent(<ActivePositions />),
    totalBalances: filterVideoContent(<TotalBalances />),
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
      {/* Overlay */}
      <div
        className="overlay"
        style={{
          backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)",
          zIndex: 10,
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      ></div>

      {/* Hover sound */}
      <audio ref={audioRef} preload="auto">
        <source src={hoverSound} type="audio/mpeg" />
      </audio>

      {/* Mobile Toggle Button */}
      <button
        className={`sidebar-toggle-btn ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
        style={{ zIndex: 1101, position: "fixed" }}
      >
        ☰
      </button>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Mobile sidebar">
        <h2 className="text-xl font-bold mb-10 text-cyan-300 drop-shadow-md">
          QuantumCopyTrading
        </h2>
        <nav className="flex flex-col space-y-3">
          {[
            { label: "Dashboard", className: "sidebar-cyan", href: "#" },
            { label: "Settings", className: "sidebar-purple", href: "#" },
            { label: "API Details", className: "sidebar-green", href: "#" },
            { label: "Positions", className: "sidebar-yellow", href: "#" },
            { label: "Users", className: "sidebar-users", href: "#" },
            { label: "Logs", className: "sidebar-logs", href: "#" },
            { label: "Manual Push", className: "sidebar-manual-push", href: "#" },
            { label: "Logout", className: "sidebar-red", href: "/login" },
          ].map((btn, i) => (
            <a
              key={i}
              href={btn.href}
              onClick={(e) => {
                if (btn.label === "Logout") {
                  e.preventDefault();
                  localStorage.clear();
                  sessionStorage.clear();
                  document.cookie.split(";").forEach((c) => {
                    document.cookie = c
                      .replace(/^ +/, "")
                      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                  });
                  window.location.href = btn.href;
                } else {
                  playHoverSound();
                }
              }}
              className={`sidebar-button ${btn.className} px-4 py-2 bg-gray-900 text-white`}
              style={{ color: "#fff" }}
            >
              {btn.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content container */}
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
            style={{ color: isDarkMode ? "#fff" : "#000", paddingLeft: isMobile ? "1.5rem" : "0" }}
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
              textAlign: "center",
              boxShadow: isDarkMode
                ? "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff"
                : "0 0 10px #0000ff, 0 0 20px #0000ff, 0 0 30px #0000ff",
              transition: "all 0.3s ease",
              height: "100%",
              width: "10rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              opacity: 1,
              textShadow: isDarkMode ? "0 0 1px #ffffffff" : "0 0 1px #000000ff",
            }}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = isDarkMode
                ? "0 0 15px #00ffff, 0 0 25px #00ffff, 0 0 40px #00ffff"
                : "0 0 15px #0000ff, 0 0 25px #0000ff, 0 0 40px #0000ff";
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = isDarkMode
                ? "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff"
                : "0 0 10px #0000ff, 0 0 20px #0000ff, 0 0 30px #0000ff";
            }}
          >
            {buttonText}
          </button>
        </div>

        {/* Grid Rows */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="dashboard-column-cyan" onClick={() => handleCardClick("activeUsers")}>
            {cards.activeUsers}
          </Card>
          <Card className="dashboard-column-purple" onClick={() => handleCardClick("activeExchange")}>
            {cards.activeExchange}
          </Card>
          <Card className="dashboard-column-green" onClick={() => handleCardClick("activePositions")}>
            {cards.activePositions}
          </Card>
          <Card className="dashboard-column-yellow" onClick={() => handleCardClick("totalBalances")}>
            {cards.totalBalances}
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <Card className="dashboard-column-cyan" onClick={() => handleCardClick("profit")}>{cards.profit}</Card>
          <Card className="dashboard-column-purple" onClick={() => handleCardClick("upl")}>{cards.upl}</Card>
          <Card className="dashboard-column-green" onClick={() => handleCardClick("fundsDistribution")}>{cards.fundsDistribution}</Card>
        </div>

        <div className="mobile-stack flex gap-2 w-full items-start mt-4 max-lg:flex-col">
          <Card className="dashboard-column-cyan w-full lg:w-1/2 p-2 max-h-[60px] h-[60px] overflow-hidden" onClick={() => handleCardClick("balanceGraph")}>{cards.balanceGraph}</Card>
          <Card className="dashboard-column-purple w-full lg:w-1/2 p-2 max-h-[60px] h-[60px] overflow-hidden" onClick={() => handleCardClick("weeklyRevenue")}>{cards.weeklyRevenue}</Card>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 max-sm:grid-cols-1">
          <Card className="dashboard-column-cyan" onClick={() => handleCardClick("dailyPnL")}>{cards.dailyPnL}</Card>
          <Card className="dashboard-column-purple" onClick={() => handleCardClick("bestTradingPairs")}>{cards.bestTradingPairs}</Card>
        </div>

        <div className="mt-4">
          <Card className="dashboard-column-green" onClick={() => handleCardClick("openPositions")}>{cards.openPositions}</Card>
        </div>

        <div className="flex justify-center mt-6 mb-10">
          <a href="F:/crypto-dashboard-prototype/crypto-dashboard-prototype/admin/positions.html">
            <button className="dashboard-column dashboard-column-cyan p-6 text-center" style={{ color: isDarkMode ? "#fff" : "#000", textShadow: "none !important" }}>
              View All Position
            </button>
          </a>
        </div>

        <div className="h-6" />
      </main>

      {/* Expanded modal */}
      {expandedCard && (
        <div
          onClick={() => setExpandedCard(null)}
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "transparent",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
            width: "100%",
            height: "100%",
          }}
          aria-modal="true"
          role="dialog"
          tabIndex={-1}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: isDarkMode ? "#111827" : "#f9fafb",
              borderRadius: "1rem",
              padding: "1rem",
              display: "inline-block",
              maxWidth: isMobile ? "95vw" : "90vw",
              maxHeight: isMobile ? "85vh" : "90vh",
              overflow: "auto",
              boxShadow: "0 0 20px 5px #00ffff",
              position: "relative",
              color: isDarkMode ? "#fff" : "#000",
              fontSize: "2em",
              lineHeight: "1.8",
              transition: "font-size 0.25s ease",
              touchAction: "pan-y",
            }}
          >
            {cards[expandedCard]}
            <button
              onClick={() => setExpandedCard(null)}
              style={{
                position: "absolute",
                top: "0.5rem",
                right: "0.5rem",
                background: "transparent",
                border: "none",
                color: "#00ffff",
                fontSize: "2rem",
                cursor: "pointer",
                fontWeight: "bold",
              }}
              aria-label="Close expanded view"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
