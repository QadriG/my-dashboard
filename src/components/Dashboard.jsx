/* eslint no-undef: "off" */
import React, { useRef, useEffect, useState } from "react";
import { isMobile } from "react-device-detect"; // Added for consistency with user dashboard
import { useNavigate } from "react-router-dom";
import "../styles/sidebar.css";
import "../styles/globals.css";
import hoverSound from "../assets/click.mp3";

// ✅ Dashboard Components
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
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile only, kept for consistency
  const [expandedCard, setExpandedCard] = useState(null); // desktop modal
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [buttonText, setButtonText] = useState("Light Mode");

  // ✅ JWT check on mount
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
      } catch (err) {
        console.error("Auth check error:", err);
        localStorage.clear();
        sessionStorage.clear();
        navigate("/login", { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  // ✅ Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/my-dashboard/login";
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // ✅ Prevent back navigation after logout
  useEffect(() => {
    const handlePopState = () => {
      navigate("/login", { replace: true });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  // ✅ Play hover sound
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
    balanceGraph: React.cloneElement(<BalanceGraph />, { isDarkMode }), // Pass isDarkMode like user dashboard
    weeklyRevenue: React.cloneElement(<WeeklyRevenue />, { isDarkMode }), // Pass isDarkMode
    dailyPnL: React.cloneElement(<DailyPnL />, { isDarkMode }),
    bestTradingPairs: React.cloneElement(<BestTradingPairs />, { isDarkMode }),
    openPositions: React.cloneElement(<OpenPositions />, { isDarkMode }),
  };

  // Force desktop dimensions
  useEffect(() => {
    document.body.style.width = "auto";
    document.body.style.height = "auto";
    document.body.style.transform = "none";
  }, []);

  const handleCardClick = (key) => {
    if (!isMobile) setExpandedCard(expandedCard === key ? null : key);
  };

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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.5rem",
    boxShadow: isDarkMode
      ? "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff"
      : "0 0 10px #0000ff, 0 0 20px #0000ff, 0 0 30px #0000ff",
  };

  return (
    <div
      className={`zoom-out-container relative h-screen w-screen overflow-x-hidden overflow-y-auto ${
        isDarkMode ? "dark-mode" : "light-mode"
      }`}
      style={{ backgroundColor: isDarkMode ? "#000" : "#fff" }}
    >
      <div
        className="overlay"
        style={{
          backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.5)" : "transparent",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      <audio ref={audioRef} preload="auto">
        <source src={hoverSound} type="audio/mpeg" />
      </audio>

      {/* Sidebar: Fixed and always open like user dashboard */}
      <aside className="sidebar open bg-black/70 text-white" style={{ marginLeft: 0 }}>
        <h2 className="text-xl font-bold mb-10 text-cyan-300 drop-shadow-md">
          QuantumCopyTrading
        </h2>
        <ul>
          {[
            { label: "Dashboard", className: "sidebar-cyan" },
            { label: "Settings", className: "sidebar-purple", path: "/settings" }, // ✅ Added path
            { label: "API Details", className: "sidebar-green" },
            { label: "Positions", className: "sidebar-yellow" },
            { label: "Users", className: "sidebar-users" },
            { label: "Logs", className: "sidebar-logs" },
            { label: "Manual Push", className: "sidebar-manual-push" },
            { label: "Logout", className: "sidebar-red", action: handleLogout },
          ].map((btn, i) => (
            <li key={i}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (btn.action) {
                    btn.action();
                  } else if (btn.path) {
                    navigate(btn.path); // ✅ Navigate if path exists
                  }
                }}
                onMouseEnter={playHoverSound}
                className={`sidebar-button ${btn.className}`}
              >
                {btn.label}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main */}
      <main
        className="relative z-20 p-6 overflow-y-auto md:ml-64"
        style={{
          height: "100vh",
          width: "100%",
          maxWidth: "calc(100vw - 16rem)",
          color: isDarkMode ? "#fff" : "#000",
        }}
      >
        {/* Title Bar with Toggle Button */}
        <div className="shimmer-wrapper w-full py-4 px-6 mb-6" style={{ position: "relative" }}>
          <h1
            className="text-4xl font-semibold drop-shadow-md inline-block"
            style={{ color: isDarkMode ? "#fff" : "#000" }}
          >
            Dashboard
          </h1>
          <button
            onClick={toggleTheme}
            style={buttonStyle}
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

        {/* First row: Extra cards for admin */}
        {!isMobile && (
          <div className="grid grid-cols-4 gap-7 max-lg:grid-cols-2 max-sm:grid-cols-1 mb-6">
            <div
              className="dashboard-column dashboard-column-cyan"
              onClick={() => handleCardClick("activeUsers")}
              style={{ color: isDarkMode ? "#fff" : "#000" }}
            >
              {cards.activeUsers}
            </div>
            <div
              className="dashboard-column dashboard-column-purple"
              onClick={() => handleCardClick("activeExchange")}
              style={{ color: isDarkMode ? "#fff" : "#000" }}
            >
              {cards.activeExchange}
            </div>
            <div
              className="dashboard-column dashboard-column-green"
              onClick={() => handleCardClick("activePositions")}
              style={{ color: isDarkMode ? "#fff" : "#000" }}
            >
              {cards.activePositions}
            </div>
            <div
              className="dashboard-column dashboard-column-teal"
              onClick={() => handleCardClick("totalBalances")}
              style={{ color: isDarkMode ? "#fff" : "#000" }}
            >
              {cards.totalBalances}
            </div>
          </div>
        )}

        {/* Second row */}
        <div className="grid grid-cols-3 gap-7 max-lg:grid-cols-1">
          <div
            className="dashboard-column dashboard-column-cyan"
            onClick={() => handleCardClick("profit")}
            style={{ color: isDarkMode ? "#fff" : "#000" }}
          >
            {cards.profit}
          </div>
          <div
            className="dashboard-column dashboard-column-purple"
            onClick={() => handleCardClick("upl")}
            style={{ color: isDarkMode ? "#fff" : "#000" }}
          >
            {cards.upl}
          </div>
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("fundsDistribution")}
            style={{ color: isDarkMode ? "#fff" : "#000" }}
          >
            {cards.fundsDistribution}
          </div>
        </div>

        {/* Third row */}
        <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
          <div
            className="dashboard-column dashboard-column-cyan balance-graph w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden"
            onClick={() => handleCardClick("balanceGraph")}
            style={{
              color: isDarkMode ? "#fff" : "#000",
              "--chart-text-color": isDarkMode ? "#fff" : "#000",
            }}
          >
            {cards.balanceGraph}
          </div>
          <div
            className="dashboard-column dashboard-column-purple weekly-revenue w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden"
            onClick={() => handleCardClick("weeklyRevenue")}
            style={{
              color: isDarkMode ? "#fff" : "#000",
              "--chart-text-color": isDarkMode ? "#fff" : "#000",
            }}
          >
            {cards.weeklyRevenue}
          </div>
        </div>

        {/* Fourth row */}
        <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
          <div
            className="dashboard-column dashboard-column-cyan"
            onClick={() => handleCardClick("dailyPnL")}
            style={{ color: isDarkMode ? "#fff" : "#000" }}
          >
            {cards.dailyPnL}
          </div>
          <div
            className="dashboard-column dashboard-column-purple"
            onClick={() => handleCardClick("bestTradingPairs")}
            style={{ color: isDarkMode ? "#fff" : "#000" }}
          >
            {cards.bestTradingPairs}
          </div>
        </div>

        {/* Fifth row */}
        <div className="mt-8">
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("openPositions")}
            style={{ color: isDarkMode ? "#fff" : "#000" }}
          >
            {cards.openPositions}
          </div>
        </div>

        {/* CTA: View All Positions */}
        <div className="flex justify-center mt-6 mb-10">
          <a href="/admin/positions">
            <button
              className="dashboard-column dashboard-column-cyan p-6 text-center"
              style={{ color: isDarkMode ? "#fff" : "#000" }}
            >
              View All Positions
            </button>
          </a>
        </div>
      </main>

      {/* Expanded modal for desktop */}
      {!isMobile && expandedCard && (
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
          }}
          aria-modal="true"
          role="dialog"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: isDarkMode ? "#111827" : "#f9fafb",
              borderRadius: "1rem",
              padding: "1rem",
              display: "inline-block",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 0 20px 5px #00ffff",
              position: "relative",
              color: isDarkMode ? "#fff" : "#000",
              fontSize: "2em",
              lineHeight: "1.2",
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
