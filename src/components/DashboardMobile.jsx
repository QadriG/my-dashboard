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

const filterVideoContent = (component) => isMobile ? React.cloneElement(component, { disableVideo: true }) : component;

const Card = ({ className = "", onClick, children }) => (
  <div className={`scaled-card dashboard-column ${className}`} onClick={onClick} style={{transition: "transform 0.3s ease"}}>
    {children}
  </div>
);

export default function DashboardMobile() {
  const audioRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);

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

  const handleCardClick = (key) => setExpandedCard(expandedCard === key ? null : key);

  return (
    <div className="relative overflow-hidden" style={{width:"100vw", height:"100vh", position:"fixed", top:0, left:0, backgroundColor:"#000"}}>
      <div className="overlay" style={{backgroundColor:"rgba(0,0,0,0.1)", zIndex:10}}></div>
      <audio ref={audioRef} preload="auto"><source src={hoverSound} type="audio/mpeg"/></audio>

      <button className={`sidebar-toggle-btn ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h2>QuantumCopyTrading</h2>
        <nav className="flex flex-col space-y-3">
          {[{label:"Dashboard", className:"sidebar-cyan"},{label:"Settings", className:"sidebar-purple"},
            {label:"API Details", className:"sidebar-green"},{label:"Positions", className:"sidebar-yellow"},
            {label:"Users", className:"sidebar-users"},{label:"Logs", className:"sidebar-logs"},
            {label:"Manual Push", className:"sidebar-manual-push"},{label:"Logout", className:"sidebar-red"}].map((btn,i)=>(
            <a key={i} href="#" onMouseEnter={playHoverSound} className={`sidebar-button ${btn.className}`}>{btn.label}</a>
          ))}
        </nav>
      </div>

      {sidebarOpen && <div className="sidebar-backdrop" onClick={()=>setSidebarOpen(false)}></div>}

      <main className="relative z-20 p-4 overflow-y-auto text-white">
        <div className="shimmer-wrapper w-full py-4 px-4 mb-4 text-center">
          <h1 className="text-2xl font-semibold text-white drop-shadow-md">Dashboard</h1>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <Card className="dashboard-column-cyan" onClick={()=>handleCardClick("activeUsers")}>{cards.activeUsers}</Card>
          <Card className="dashboard-column-purple" onClick={()=>handleCardClick("activeExchange")}>{cards.activeExchange}</Card>
          <Card className="dashboard-column-green" onClick={()=>handleCardClick("activePositions")}>{cards.activePositions}</Card>
          <Card className="dashboard-column-yellow" onClick={()=>handleCardClick("totalBalances")}>{cards.totalBalances}</Card>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Card className="dashboard-column-cyan" onClick={()=>handleCardClick("profit")}>{cards.profit}</Card>
          <Card className="dashboard-column-purple" onClick={()=>handleCardClick("upl")}>{cards.upl}</Card>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Card className="dashboard-column-green" onClick={()=>handleCardClick("fundsDistribution")}>{cards.fundsDistribution}</Card>
          <Card className="dashboard-column-cyan" onClick={()=>handleCardClick("balanceGraph")}>{cards.balanceGraph}</Card>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <Card className="dashboard-column-purple" onClick={()=>handleCardClick("weeklyRevenue")}>{cards.weeklyRevenue}</Card>
          <Card className="dashboard-column-cyan" onClick={()=>handleCardClick("dailyPnL")}>{cards.dailyPnL}</Card>
        </div>

        <div className="grid grid-cols-1 gap-2 mt-4">
          <Card className="dashboard-column-green" onClick={()=>handleCardClick("bestTradingPairs")}>{cards.bestTradingPairs}</Card>
        </div>

        <div className="mt-4">
          <Card className="dashboard-column-purple" onClick={()=>handleCardClick("openPositions")}>{cards.openPositions}</Card>
        </div>

        <div className="flex justify-center mt-4">
          <a href="#">
            <button className="scaled-card dashboard-column dashboard-column-cyan p-4 text-center">View All Positions</button>
          </a>
        </div>
      </main>

      {isMobile && expandedCard && (
        <div onClick={()=>setExpandedCard(null)} style={{position:"fixed", inset:0, backgroundColor:"rgba(0,0,0,0.9)", zIndex:1200, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", cursor:"pointer"}}>
          <div onClick={e=>e.stopPropagation()} style={{backgroundColor:"#111827", borderRadius:"1rem", padding:"1rem", width:"95%", height:"auto", maxHeight:"90%", overflowY:"auto", boxShadow:"0 0 20px 5px #00ffff", position:"relative"}}>
            {cards[expandedCard]}
            <button onClick={()=>setExpandedCard(null)} style={{position:"absolute", top:"0.5rem", right:"0.75rem", background:"transparent", border:"none", color:"#00ffff", fontSize:"2rem", cursor:"pointer", fontWeight:"bold"}}>&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
