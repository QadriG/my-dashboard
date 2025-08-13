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

  /* Compute a smooth per-component scale for small screens */
  useEffect(() => {
    const setScale = () => {
      // Treat 390px as the design width for mobile; clamp between 0.85 and 1
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
        width: "100vw",
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        backgroundColor: "#000", // solid black background for mobile
      }}
    >
      {/* Overlay (visual only) */}
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
        style={{ zIndex: 1101, position: "fixed" }}
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`sidebar ${sidebarOpen ? "open" : ""}`}
        aria-label="Mobile sidebar"
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

      {/* Backdrop when sidebar is open (tap to close) */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content container */}
      <main
        className="relative z-20 p-4 overflow-y-auto text-white"
        style={{
          height: "100%",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          transition: "left 0.3s ease",
          zIndex: 20,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
        }}
      >
        <div className="shimmer-wrapper w-full py-4 px-4 mb-4">
          <h1 className="text-2xl font-semibold text-white drop-shadow-md">
            Dashboard
          </h1>
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-4 gap-2">
          <Card
            className="dashboard-column-cyan"
            onClick={() => handleCardClick("activeUsers")}
          >
            {cards.activeUsers}
          </Card>
          <Card
            className="dashboard-column-purple"
            onClick={() => handleCardClick("activeExchange")}
          >
            {cards.activeExchange}
          </Card>
          <Card
            className="dashboard-column-green"
            onClick={() => handleCardClick("activePositions")}
          >
            {cards.activePositions}
          </Card>
          <Card
            className="dashboard-column-yellow"
            onClick={() => handleCardClick("totalBalances")}
          >
            {cards.totalBalances}
          </Card>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Card
            className="dashboard-column-cyan"
            onClick={() => handleCardClick("profit")}
          >
            {cards.profit}
          </Card>
          <Card
            className="dashboard-column-purple"
            onClick={() => handleCardClick("upl")}
          >
            {cards.upl}
          </Card>
          <Card
            className="dashboard-column-green"
            onClick={() => handleCardClick("fundsDistribution")}
          >
            {cards.fundsDistribution}
          </Card>
        </div>

        {/* Row 3 */}
        <div className="mobile-stack flex gap-2 w-full items-start mt-4">
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

        {/* Row 4 */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Card
            className="dashboard-column-cyan"
            onClick={() => handleCardClick("dailyPnL")}
          >
            {cards.dailyPnL}
          </Card>
          <Card
            className="dashboard-column-purple"
            onClick={() => handleCardClick("bestTradingPairs")}
          >
            {cards.bestTradingPairs}
          </Card>
        </div>

        {/* Row 5 */}
        <div className="mt-4">
          <Card
            className="dashboard-column-green"
            onClick={() => handleCardClick("openPositions")}
          >
            {cards.openPositions}
          </Card>
        </div>

        {/* CTA */}
        <div className="flex justify-center mt-4">
          <a href="F:/crypto-dashboard-prototype/crypto-dashboard-prototype/admin/positions.html">
            <button
              className="scaled-card dashboard-column dashboard-column-cyan p-4 text-center"
              onClick={() => handleCardClick("viewAllPositions")}
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
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.9)",
            zIndex: 1200,
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
              width: "95%",
              height: "90%",
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
                top: "0.5rem",
                right: "0.75rem",
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
