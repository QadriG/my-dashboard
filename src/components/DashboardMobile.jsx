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

// Filter out video components on mobile
const filterVideoContent = (component) => {
  if (isMobile) {
    return React.cloneElement(component, { disableVideo: true });
  }
  return component;
};

export default function DashboardMobile() {
  const audioRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [screenInfo, setScreenInfo] = useState({
    width: window.innerHeight, // Landscape width
    height: window.innerWidth, // Landscape height
  });

  useEffect(() => {
    function updateScreenInfo() {
      const landscapeWidth = Math.max(window.innerHeight, window.innerWidth);
      const landscapeHeight = Math.min(window.innerHeight, window.innerWidth);
      setScreenInfo({
        width: landscapeWidth,
        height: landscapeHeight,
      });
      document.body.style.width = `${landscapeWidth}px`;
      document.body.style.height = `${landscapeHeight}px`;
      document.body.style.overflow = "hidden";
    }

    updateScreenInfo();
    window.addEventListener("resize", updateScreenInfo);
    return () => window.removeEventListener("resize", updateScreenInfo);
  }, []);

  const playHoverSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const cards = {
    activeUsers: filterVideoContent(<ActiveUsers />),
    activeExchange: filterVideoContent(<ActiveExchange />),
    activePositions: filterVideoContent(<ActivePositions />),
    totalBalances: filterVideoContent(<TotalBalances />),
    profit: filterVideoContent(<Profit />),
    upl: filterVideoContent(<UPL />),
    fundsDistribution: filterVideoContent(<FundsDistribution />),
    balanceGraph: filterVideoContent(<BalanceGraph />),
    weeklyRevenue: filterVideoContent(<WeeklyRevenue />),
    dailyPnL: filterVideoContent(<DailyPnL />),
    bestTradingPairs: filterVideoContent(<BestTradingPairs />),
    openPositions: filterVideoContent(<OpenPositions />),
  };

  const handleCardClick = (key) => {
    setExpandedCard(expandedCard === key ? null : key);
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: "100vw", // Use viewport width
        height: "100vh", // Use viewport height
        position: "fixed",
        top: 0,
        left: 0,
        backgroundColor: "#000", // Solid background
        transformOrigin: "top left",
        transform: "rotate(90deg)", // Force landscape
      }}
    >
      {/* Overlay */}
      <div
        className="overlay"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.1)",
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
        style={{ zIndex: 1002, position: "absolute", top: "1rem", left: "1rem", transform: "rotate(-90deg)" }}
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        style={{
          height: "100%", // Full height of container
          width: "16rem",
          top: "0",
          zIndex: 1001,
          position: "absolute",
          transform: "rotate(-90deg)",
          transformOrigin: "top left",
        }}
      >
        <h2 className="text-xl font-bold mb-10 text-cyan-300 drop-shadow-md">
          QuantumCopyTrading
        </h2>
        <nav className="flex flex-col space-y-3">
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
            <a
              key={i}
              href="#"
              onMouseEnter={playHoverSound}
              className={`sidebar-button ${btn.className} px-4 py-2 bg-gray-900 text-white`}
              style={{ transform: "rotate(-90deg)" }}
            >
              {btn.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Main content container */}
      <main
        className="relative z-20 p-4 overflow-y-auto text-white"
        style={{
          height: "100%", // Full height of container
          width: `calc(100% - ${sidebarOpen ? "16rem" : "0"})`, // Dynamic width
          position: "absolute",
          top: 0,
          left: sidebarOpen ? "16rem" : "0", // Shift content when sidebar opens
          transition: "left 0.3s ease",
          zIndex: 20,
          transform: "rotate(-90deg)",
          transformOrigin: "top left",
          backgroundColor: "rgba(0, 0, 0, 0.8)", // Debug background
        }}
      >
        <div className="shimmer-wrapper w-full py-4 px-4 mb-4">
          <h1 className="text-2xl font-semibold text-white drop-shadow-md">
            Dashboard
          </h1>
        </div>

        <div className="grid grid-cols-4 gap-2 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <div
            className="dashboard-column dashboard-column-cyan"
            onClick={() => handleCardClick("activeUsers")}
            style={{ transform: "rotate(-90deg)" }}
          >
            {cards.activeUsers}
          </div>
          <div
            className="dashboard-column dashboard-column-purple"
            onClick={() => handleCardClick("activeExchange")}
            style={{ transform: "rotate(-90deg)" }}
          >
            {cards.activeExchange}
          </div>
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("activePositions")}
            style={{ transform: "rotate(-90deg)" }}
          >
            {cards.activePositions}
          </div>
          <div
            className="dashboard-column dashboard-column-yellow"
            onClick={() => handleCardClick("totalBalances")}
            style={{ transform: "rotate(-90deg)" }}
          >
            {cards.totalBalances}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 max-lg:grid-cols-1">
          <div
            className="dashboard-column dashboard-column-cyan"
            onClick={() => handleCardClick("profit")}
            style={{ transform: "rotate(-90deg)" }}
          >
            {cards.profit}
          </div>
          <div
            className="dashboard-column dashboard-column-purple"
            onClick={() => handleCardClick("upl")}
            style={{ transform: "rotate(-90deg)" }}
          >
            {cards.upl}
          </div>
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("fundsDistribution")}
            style={{ transform: "rotate(-90deg)" }}
          >
            {cards.fundsDistribution}
          </div>
        </div>

        <div className="flex gap-2 w-full items-start mt-4 max-lg:flex-col">
          <div
            className="dashboard-column dashboard-column-cyan w-full lg:w-1/2 p-2 max-h-[60px] h-[60px] overflow-hidden"
            onClick={() => handleCardClick("balanceGraph")}
            style={{ transform: "rotate(-90deg)" }}
          >
            {cards.balanceGraph}
          </div>
          <div
            className="dashboard-column dashboard-column-purple w-full lg:w-1/2 p-2 max-h-[60px] h-[60px] overflow-hidden"
            onClick={() => handleCardClick("weeklyRevenue")}
            style={{ transform: "rotate(-90deg)" }}
          >
            {cards.weeklyRevenue}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 max-sm:grid-cols-1">
          <div
            className="dashboard-column dashboard-column-cyan"
            onClick={() => handleCardClick("dailyPnL")}
            style={{ transform: "rotate(-90deg)" }}
          >
            {cards.dailyPnL}
          </div>
          <div
            className="dashboard-column dashboard-column-purple"
            onClick={() => handleCardClick("bestTradingPairs")}
            style={{ transform: "rotate(-90deg)" }}
          >
            {cards.bestTradingPairs}
          </div>
        </div>

        <div className="mt-4">
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("openPositions")}
            style={{ transform: "rotate(-90deg)" }}
          >
            {cards.openPositions}
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <a href="F:/crypto-dashboard-prototype/crypto-dashboard-prototype/admin/positions.html">
            <button
              className="dashboard-column dashboard-column-cyan p-4 text-center"
              onClick={() => handleCardClick("viewAllPositions")}
              style={{ transform: "rotate(-90deg)" }}
            >
              View All Positions
            </button>
          </a>
        </div>
      </main>

      {/* Expanded modal */}
      {isMobile && expandedCard && (
        <div
          onClick={() => setExpandedCard(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.9)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            cursor: "pointer",
            transform: "rotate(90deg)",
            transformOrigin: "top left",
          }}
          aria-modal="true"
          role="dialog"
          tabIndex={-1}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#111827",
              borderRadius: "1rem",
              padding: "1rem",
              width: "90%",
              height: "90%",
              overflowY: "auto",
              boxShadow: "0 0 20px 5px #00ffff",
              position: "relative",
              transform: "rotate(-90deg)",
              transformOrigin: "top left",
            }}
          >
            {cards[expandedCard]}
            <button
              onClick={() => setExpandedCard(null)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "transparent",
                border: "none",
                color: "#00ffff",
                fontSize: "2rem",
                cursor: "pointer",
                fontWeight: "bold",
                transform: "rotate(-90deg)",
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