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

export default function UserDashboard() {
  const audioRef = useRef(null);
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

    // Redirect & prevent back navigation
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
    if (!isMobile) setExpandedCard(expandedCard === key ? null : key);
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
      <audio ref={audioRef} preload="auto">
        <source src={hoverSound} type="audio/mpeg" />
      </audio>

      {/* Sidebar */}
      <UserSidebar isOpen={true} playHoverSound={playHoverSound} onLogout={handleLogout} /> {/* ✅ pass logout */}

      <main
        className="relative z-20 p-6 overflow-y-auto md:ml-64"
        style={{
          height: "100vh",
          width: "100%",
          maxWidth: "calc(100vw - 16rem)",
          color: isDarkMode ? "#fff" : "#000",
        }}
      >
        <div className="shimmer-wrapper w-full py-4 px-6 mb-6" style={{ position: "relative" }}>
          <h1 className="text-4xl font-semibold drop-shadow-md inline-block" style={{ color: isDarkMode ? "#fff" : "#000" }}>
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

        {/* First row */}
        <div className="grid grid-cols-3 gap-7 max-lg:grid-cols-1">
          <div className="dashboard-column dashboard-column-cyan" onClick={() => handleCardClick("profit")}>
            {React.cloneElement(cards.profit, { isDarkMode })}
          </div>
          <div className="dashboard-column dashboard-column-purple" onClick={() => handleCardClick("upl")}>
            {React.cloneElement(cards.upl, { isDarkMode })}
          </div>
          <div className="dashboard-column dashboard-column-green" onClick={() => handleCardClick("fundsDistribution")}>
            {React.cloneElement(cards.fundsDistribution, { isDarkMode })}
          </div>
        </div>

        {/* Second row */}
        <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
          <div
            className="dashboard-column dashboard-column-cyan balance-graph w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden"
            onClick={() => handleCardClick("balanceGraph")}
          >
            {React.cloneElement(cards.balanceGraph, { isDarkMode })}
          </div>
          <div
            className="dashboard-column dashboard-column-purple weekly-revenue w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden"
            onClick={() => handleCardClick("weeklyRevenue")}
          >
            {React.cloneElement(cards.weeklyRevenue, { isDarkMode })}
          </div>
        </div>

        {/* Third row */}
        <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
          <div className="dashboard-column dashboard-column-cyan" onClick={() => handleCardClick("dailyPnL")}>
            {React.cloneElement(cards.dailyPnL, { isDarkMode })}
          </div>
          <div className="dashboard-column dashboard-column-purple" onClick={() => handleCardClick("bestTradingPairs")}>
            {React.cloneElement(cards.bestTradingPairs, { isDarkMode })}
          </div>
        </div>

        {/* Fourth row */}
        <div className="mt-8">
          <div className="dashboard-column dashboard-column-green" onClick={() => handleCardClick("openPositions")}>
            {React.cloneElement(cards.openPositions, { isDarkMode })}
          </div>
        </div>

        {/* CTA: View All Positions */}
        <div className="flex justify-center mt-6 mb-10">
          <a href="/user/positions">
            <button className="dashboard-column dashboard-column-cyan p-6 text-center" style={{ color: isDarkMode ? "#fff" : "#000" }}>
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
