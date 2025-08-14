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

export default function DashboardPC() {
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
    // Alternate button text independently of theme
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

  return (
    <div
      className={`zoom-out-container relative h-screen w-screen overflow-x-hidden overflow-y-auto ${isDarkMode ? "dark-mode" : "light-mode"}`}
      style={{
        backgroundColor: isDarkMode ? "#000" : "#fff", // Dynamic background
      }}
    >
      {/* Background video commented out */}
      {/* <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
        style={{ display: isDarkMode ? "block" : "none" }}
      >
        <source src={bgVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video> */}

      {/* Overlay */}
      <div
        className="overlay"
        style={{
          backgroundColor: isDarkMode ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.1)",
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
        className="relative z-20 p-6 overflow-y-auto animate-fade-in md:ml-64"
        style={{
          height: "100vh",
          width: "100%",
          maxWidth: "calc(100vw - 16rem)",
          color: isDarkMode ? "#fff" : "#000", // Pure black text in light mode
        }}
      >
        <div className="shimmer-wrapper w-full py-4 px-6 mb-6" style={{ position: "relative" }}>
          <h1 className="text-4xl font-semibold drop-shadow-md inline-block" style={{ color: isDarkMode ? "#fff" : "#000" }}>
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
              color: isDarkMode ? "#fff" : "#000", // Black text in light mode, white in dark mode
              border: "2px solid " + (isDarkMode ? "#00ffff" : "#0000ff"), // Add border for better visibility
              borderRadius: "4px",
              cursor: "pointer",
              textAlign: "center",
              boxShadow: isDarkMode ? "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff" : "0 0 10px #0000ff, 0 0 20px #0000ff, 0 0 30px #0000ff",
              transition: "all 0.3s ease",
              height: "100%",
              width: "10rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center", // Ensure text is centered
              fontSize: "1.5rem", // Ensure readable font size
              opacity: 1, // Ensure no transparency
              textShadow: isDarkMode ? "0 0 1px #ffffffff" : "0 0 1px #000000ff", // Add text shadow for contrast
            }}
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
            style={{ color: isDarkMode ? "#fff" : "#000" }} // Pure black text in light mode
          >
            {cards.activeUsers}
          </div>
          <div
            className="dashboard-column dashboard-column-purple"
            onClick={() => handleCardClick("activeExchange")}
            style={{ color: isDarkMode ? "#fff" : "#000" }} // Pure black text in light mode
          >
            {cards.activeExchange}
          </div>
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("activePositions")}
            style={{ color: isDarkMode ? "#fff" : "#000" }} // Pure black text in light mode
          >
            {cards.activePositions}
          </div>
          <div
            className="dashboard-column dashboard-column-yellow"
            onClick={() => handleCardClick("totalBalances")}
            style={{ color: isDarkMode ? "#fff" : "#000" }} // Pure black text in light mode
          >
            {cards.totalBalances}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-7 mt-8 max-lg:grid-cols-1">
          <div
            className="dashboard-column dashboard-column-cyan"
            onClick={() => handleCardClick("profit")}
            style={{ color: isDarkMode ? "#fff" : "#000" }} // Pure black text in light mode
          >
            {cards.profit}
          </div>
          <div
            className="dashboard-column dashboard-column-purple"
            onClick={() => handleCardClick("upl")}
            style={{ color: isDarkMode ? "#fff" : "#000" }} // Pure black text in light mode
          >
            {cards.upl}
          </div>
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("fundsDistribution")}
            style={{ color: isDarkMode ? "#fff" : "#000" }} // Pure black text in light mode
          >
            {cards.fundsDistribution}
          </div>
        </div>

        <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
          <div
            className="dashboard-column dashboard-column-cyan w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden"
            onClick={() => handleCardClick("balanceGraph")}
            style={{ color: isDarkMode ? "#fff" : "#000" }} // Pure black text in light mode
          >
            {cards.balanceGraph}
          </div>
          <div
            className="dashboard-column dashboard-column-purple w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden"
            onClick={() => handleCardClick("weeklyRevenue")}
            style={{ color: isDarkMode ? "#fff" : "#000" }} // Pure black text in light mode
          >
            {cards.weeklyRevenue}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
          <div
            className="dashboard-column dashboard-column-cyan"
            onClick={() => handleCardClick("dailyPnL")}
            style={{ color: isDarkMode ? "#fff" : "#000" }} // Pure black text in light mode
          >
            {cards.dailyPnL}
          </div>
          <div
            className="dashboard-column dashboard-column-purple"
            onClick={() => handleCardClick("bestTradingPairs")}
            style={{ color: isDarkMode ? "#fff" : "#000" }} // Pure black text in light mode
          >
            {cards.bestTradingPairs}
          </div>
        </div>

        <div className="mt-8">
          <div
            className="dashboard-column dashboard-column-green"
            onClick={() => handleCardClick("openPositions")}
            style={{ color: isDarkMode ? "#fff" : "#000" }} // Pure black text in light mode
          >
            {cards.openPositions}
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <a href="F:/crypto-dashboard-prototype/crypto-dashboard-prototype/admin/positions.html">
            <button
              className="dashboard-column dashboard-column-cyan p-6 text-center"
              onClick={() => handleCardClick("viewAllPositions")}
              style={{ color: isDarkMode ? "#fff" : "#000" }} // Pure black text in light mode
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
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: isDarkMode ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)",
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
              backgroundColor: isDarkMode ? "#111827" : "#f9fafb",
              borderRadius: "1rem",
              padding: "1rem",
              width: "90vw",
              height: "90vh",
              overflowY: "auto",
              boxShadow: "0 0 20px 5px #00ffff",
              position: "relative",
              color: isDarkMode ? "#fff" : "#000", // Pure black text in light mode
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