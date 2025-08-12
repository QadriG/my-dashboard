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

export default function DashboardMobile() {
  const audioRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [screenInfo, setScreenInfo] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    orientation: window.screen.orientation ? window.screen.orientation.type : "unknown",
  });

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
    setExpandedCard(expandedCard === key ? null : key);
  };

  return (
    <div
      className="relative h-screen w-screen overflow-x-hidden overflow-y-auto"
    >
      {/* Overlay */}
      <div className="overlay"></div>

      {/* Hover sound */}
      <audio ref={audioRef} preload="auto">
        <source src={hoverSound} type="audio/mpeg" />
      </audio>

      {/* Mobile Toggle Button */}
      <button
        className="sidebar-toggle-btn"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`sidebar bg-black/70 text-white pt-8 px-4 pb-4 rounded-r-xl border-2 border-cyan-400
          ${sidebarOpen ? "open" : ""}`}
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
          height: "100vh",
          width: "100%",
        }}
      >
        <div className="shimmer-wrapper w-full py-4 px-4 mb-4">
          <h1 className="text-2xl font-semibold text-white drop-shadow-md">
            Dashboard
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-4">
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
            className="dashboard-column dashboard-column-yellow"
            onClick={() => handleCardClick("totalBalances")}
          >
            {cards.totalBalances}
          </div>
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
          <div
            className="dashboard-column dashboard-column-cyan"
            onClick={() => handleCardClick("balanceGraph")}
          >
            {cards.balanceGraph}
          </div>
          <div
            className="dashboard-column dashboard-column-purple"
            onClick={() => handleCardClick("weeklyRevenue")}
          >
            {cards.weeklyRevenue}
          </div>
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
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("openPositions")}
          >
            {cards.openPositions}
          </div>
          <div className="flex justify-center mt-4">
            <a href="F:/crypto-dashboard-prototype/crypto-dashboard-prototype/admin/positions.html">
              <button
                className="dashboard-column dashboard-column-cyan p-4 text-center"
                onClick={() => handleCardClick("viewAllPositions")}
              >
                View All Positions
              </button>
            </a>
          </div>
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
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.9)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            cursor: "pointer",
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
              width: "90vw",
              height: "90vh",
              overflowY: "auto",
              boxShadow: "0 0 20px 5px #00ffff",
              position: "relative",
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