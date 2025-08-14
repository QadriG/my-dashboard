/* eslint no-undef: "off" */
import React, { useRef, useState, useEffect } from "react";
import { isMobile, deviceType, browserName } from "react-device-detect"; 
import "../styles/sidebar.css";
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

export default function Dashboard() {
  const audioRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [screenInfo, setScreenInfo] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.screen.orientation ? window.screen.orientation.type : "unknown",
  });
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [buttonText, setButtonText] = useState("Light Mode"); // State for alternating text

  useEffect(() => {
    function updateScreenInfo() {
      setScreenInfo({
        width: window.innerWidth,
        height: window.innerHeight,
        orientation: window.screen.orientation ? window.screen.orientation.type : "unknown",
      });
    }

    window.addEventListener("resize", updateScreenInfo);
    if (window.screen.orientation) {
      window.screen.orientation.addEventListener("change", updateScreenInfo);
    } else {
      window.addEventListener("orientationchange", updateScreenInfo);
    }
    return () => {
      window.removeEventListener("resize", updateScreenInfo);
      if (window.screen.orientation) {
        window.screen.orientation.removeEventListener("change", updateScreenInfo);
      } else {
        window.removeEventListener("orientationchange", updateScreenInfo);
      }
    };
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

  const handleCardClick = (key) => {
    if (!isMobile) {
      setExpandedCard(expandedCard === key ? null : key);
    }
  };

  // Define button style outside render
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
    textAlign: "center",
    boxShadow: isDarkMode ? "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff" : "0 0 10px #0000ff, 0 0 20px #0000ff, 0 0 30px #0000ff",
    transition: "all 0.3s ease",
    height: "100%",
    width: "10rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    opacity: 1,
    // eslint-disable-next-line no-undef
    textShadow: isDarkMode ? "0 0 1px #ffffff" : "none",
  };

  return (
    <div
      className={`zoom-out-container relative h-screen w-screen overflow-x-hidden overflow-y-auto ${isDarkMode ? "dark-mode" : "light-mode"}`}
      style={{
        backgroundColor: isDarkMode ? "#000" : "#fff",
      }}
    >
      {/* Overlay */}
      <div
        className="overlay"
        style={{
          backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.5)" : "transparent",
          zIndex: 1,
          pointerEvents: "none",
        }}
      ></div>

      {/* Hover sound */}
      <audio ref={audioRef} preload="auto">
        <source src={hoverSound} type="audio/mpeg" />
      </audio>

      {/* Mobile Toggle Button */}
      <button
        className="sidebar-toggle-btn md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`sidebar bg-black/70 text-white pt-8 px-4 pb-4 rounded-r-xl border-2 border-cyan-400 ${sidebarOpen ? "open" : ""}`}
      >
        <h2 className="text-xl font-bold mb-10 text-cyan-300 drop-shadow-md">
          QuantumCopyTrading
        </h2>
        <ul>
          {[
            { label: "Dashboard", className: "sidebar-cyan" },
            { label: "Settings", className: "sidebar-purple" },
            { label: "API Details", className: "sidebar-green" },
            { label: "Positions", className: "sidebar-yellow" },
            { label: "Users", className: "sidebar-users" },
            { label: "Logs", className: "sidebar-logs" },
            { label: "Manual Push", className: "sidebar-manual-push" },
            { label: "Logout", className: "sidebar-red" },
          ].map((btn, i) => (
            <li key={i}>
              <a
                href="#"
                onMouseEnter={playHoverSound}
                className={`sidebar-button ${btn.className}`}
              >
                {btn.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Main content container */}
      <main
        className="relative z-20 p-6 overflow-y-auto animate-fade-in md:ml-64"
        style={{
          height: "100vh",
          width: "100%",
          maxWidth: "calc(100vw - 16rem)",
          color: isDarkMode ? "#fff" : "#000",
        }}
      >
        <div className="shimmer-wrapper w-full py-4 px-6 mb-6" style={{ position: "relative" }}>
          <h1
            className="text-4xl font-semibold drop-shadow-md inline-block"
            style={{
              color: isDarkMode ? "#fff" : "#000",
              textShadow: "none !important",
              WebkitTextFillColor: isDarkMode ? "#fff" : "#000",
            }}
          >
            Dashboard
          </h1>
          <button
            onClick={toggleTheme}
            style={buttonStyle}
            onMouseEnter={(e) => { e.target.style.boxShadow = isDarkMode ? "0 0 15px #00ffff, 0 0 25px #00ffff, 0 0 40px #00ffff" : "0 0 15px #0000ff, 0 0 25px #0000ff, 0 0 40px #0000ff"; }}
            onMouseLeave={(e) => { e.target.style.boxShadow = isDarkMode ? "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff" : "0 0 10px #0000ff, 0 0 20px #0000ff, 0 0 30px #0000ff"; }}
          >
            {buttonText}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-7 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <div
            className="dashboard-column dashboard-column-cyan"
            onClick={() => handleCardClick("activeUsers")}
            style={{ color: isDarkMode ? "#fff" : "#000", textShadow: "none !important" }}
          >
            {React.cloneElement(cards.activeUsers, { isDarkMode })}
          </div>
          <div
            className="dashboard-column dashboard-column-purple"
            onClick={() => handleCardClick("activeExchange")}
            style={{ color: isDarkMode ? "#fff" : "#000", textShadow: "none !important" }}
          >
            {React.cloneElement(cards.activeExchange, { isDarkMode })}
          </div>
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("activePositions")}
            style={{ color: isDarkMode ? "#fff" : "#000", textShadow: "none !important" }}
          >
            {React.cloneElement(cards.activePositions, { isDarkMode })}
          </div>
          <div
            className="dashboard-column dashboard-column-yellow"
            onClick={() => handleCardClick("totalBalances")}
            style={{ color: isDarkMode ? "#fff" : "#000", textShadow: "none !important" }}
          >
            {React.cloneElement(cards.totalBalances, { isDarkMode })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-7 mt-8 max-lg:grid-cols-1">
          <div
            className="dashboard-column dashboard-column-cyan"
            onClick={() => handleCardClick("profit")}
            style={{ color: isDarkMode ? "#fff" : "#000", textShadow: "none !important" }}
          >
            {React.cloneElement(cards.profit, { isDarkMode })}
          </div>
          <div
            className="dashboard-column dashboard-column-purple"
            onClick={() => handleCardClick("upl")}
            style={{ color: isDarkMode ? "#fff" : "#000", textShadow: "none !important" }}
          >
            {React.cloneElement(cards.upl, { isDarkMode })}
          </div>
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("fundsDistribution")}
            style={{ color: isDarkMode ? "#fff" : "#000", textShadow: "none !important" }}
          >
            {React.cloneElement(cards.fundsDistribution, { isDarkMode })}
          </div>
        </div>

        <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
          <div
            className="dashboard-column dashboard-column-cyan w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden"
            onClick={() => handleCardClick("balanceGraph")}
            style={{ color: isDarkMode ? "#fff" : "#000", textShadow: "none !important" }}
          >
            {React.cloneElement(cards.balanceGraph, { isDarkMode })}
          </div>
          <div
            className="dashboard-column dashboard-column-purple w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden"
            onClick={() => handleCardClick("weeklyRevenue")}
            style={{ color: isDarkMode ? "#fff" : "#000", textShadow: "none !important" }}
          >
            {React.cloneElement(cards.weeklyRevenue, { isDarkMode })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
          <div
            className="dashboard-column dashboard-column-cyan"
            onClick={() => handleCardClick("dailyPnL")}
            style={{ color: isDarkMode ? "#fff" : "#000", textShadow: "none !important" }}
          >
            {React.cloneElement(cards.dailyPnL, { isDarkMode })}
          </div>
          <div
            className="dashboard-column dashboard-column-purple"
            onClick={() => handleCardClick("bestTradingPairs")}
            style={{ color: isDarkMode ? "#fff" : "#000", textShadow: "none !important" }}
          >
            {React.cloneElement(cards.bestTradingPairs, { isDarkMode })}
          </div>
        </div>

        <div className="mt-8">
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("openPositions")}
            style={{ color: isDarkMode ? "#fff" : "#000", textShadow: "none !important" }}
          >
            {React.cloneElement(cards.openPositions, { isDarkMode })}
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <a href="F:/crypto-dashboard-prototype/crypto-dashboard-prototype/admin/positions.html">
            <button
              className="dashboard-column dashboard-column-cyan p-6 text-center"
              onClick={() => handleCardClick("viewAllPositions")}
              style={{ color: isDarkMode ? "#fff" : "#000", textShadow: "none !important" }}
            >
              View All Positions
            </button>
          </a>
        </div>
      </main>

  {/* Expanded modal */}
{!isMobile && expandedCard && (
  <div
    onClick={() => setExpandedCard(null)}
    style={{
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)", // Center perfectly
      backgroundColor: "transparent",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      padding: 0, // No extra space
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
        display: "inline-block", // Shrinks to fit content
        maxWidth: "90vw", // Prevent overflow
        maxHeight: "90vh", // Prevent overflow
        overflow: "auto",
        boxShadow: "0 0 20px 5px #00ffff",
        position: "relative",
        color: isDarkMode ? "#fff" : "#000",
        fontSize: "2em", // Twice as big text
        lineHeight: "1.8",
        transition: "font-size 0.25s ease",
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