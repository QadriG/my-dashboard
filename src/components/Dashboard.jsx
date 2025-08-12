import React, { useRef, useState } from "react";
import "../styles/sidebar.css";  // Make sure this imports your updated sidebar.css
import hoverSound from "../assets/click.mp3";
import bgVideo from "../assets/bg.mp4";
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

  const playHoverSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const buttons = [
    { label: "Dashboard", className: "sidebar-cyan" },
    { label: "Settings", className: "sidebar-purple" },
    { label: "API Details", className: "sidebar-green" },
    { label: "Positions", className: "sidebar-yellow" },
    { label: "Users", className: "sidebar-users" },
    { label: "Logs", className: "sidebar-logs" },
    { label: "Manual Push", className: "sidebar-manual-push" },
    { label: "Logout", className: "sidebar-red" },
  ];

  return (
    <div className="relative h-screen w-screen overflow-x-hidden overflow-y-auto">
      {/* Background video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src={bgVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Overlay */}
      <div className="fixed top-0 left-0 w-full h-full bg-black opacity-80 z-10"></div>

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

      <div
  className={`sidebar bg-black/70 text-white pt-8 px-4 pb-4 rounded-r-xl border-2 border-cyan-400
    ${sidebarOpen ? "open" : ""}`}
>
  <h2 className="text-xl font-bold mb-10 text-cyan-300 drop-shadow-md">
    QuantumCopyTrading
  </h2>
  <nav className="flex flex-col space-y-3">
    {buttons.map((btn, i) => (
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


      {/* Main content */}
      <main
        className="relative z-20 p-8 overflow-y-auto animate-fade-in text-white md:ml-64"
        style={{ height: "calc(100vh - 64px)" }}
      >
        <div className="shimmer-wrapper w-full py-4 px-6 mb-6">
          <h1 className="text-4xl font-semibold text-white drop-shadow-md">Dashboard</h1>
        </div>

        <div className="grid grid-cols-4 gap-7 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <div className="dashboard-column dashboard-column-cyan">
            <ActiveUsers />
          </div>
          <div className="dashboard-column dashboard-column-purple">
            <ActiveExchange />
          </div>
          <div className="dashboard-column dashboard-column-green">
            <ActivePositions />
          </div>
          <div className="dashboard-column dashboard-column-yellow">
            <TotalBalances />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-7 mt-8 max-lg:grid-cols-1">
          <div className="dashboard-column dashboard-column-cyan">
            <Profit />
          </div>
          <div className="dashboard-column dashboard-column-purple">
            <UPL />
          </div>
          <div className="dashboard-column dashboard-column-green">
            <FundsDistribution />
          </div>
        </div>

        <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
          <div className="dashboard-column dashboard-column-cyan w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden">
            <BalanceGraph />
          </div>
          <div className="dashboard-column dashboard-column-purple w-full lg:w-1/2 p-4 max-h-[75px] h-[75px] overflow-hidden">
            <WeeklyRevenue />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
          <div className="dashboard-column dashboard-column-cyan">
            <DailyPnL />
          </div>
          <div className="dashboard-column dashboard-column-purple">
            <BestTradingPairs />
          </div>
        </div>

        <div className="mt-8">
          <div className="dashboard-column dashboard-column-green">
            <OpenPositions />
          </div>
        </div>

        <div className="flex justify-center mt-4">
          <a href="F:/crypto-dashboard-prototype/crypto-dashboard-prototype/admin/positions.html">
            <button className="dashboard-column dashboard-column-cyan p-6 text-center">
              View All Positions
            </button>
          </a>
        </div>
      </main>
    </div>
  );
}
