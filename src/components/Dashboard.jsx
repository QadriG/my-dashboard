/* eslint no-undef: "off" */
import React, { useRef, useEffect, useState } from "react";
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

  const [sidebarOpen, setSidebarOpen] = useState(false); // mobile only
  const [expandedCard, setExpandedCard] = useState(null); // desktop modal
  const [isDarkMode] = useState(true);
  const getIsDesktop = () =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : true;
  const [isDesktop, setIsDesktop] = useState(getIsDesktop());

  // ✅ Disable caching for dashboard pages
  useEffect(() => {
    const metaPragma = document.createElement("meta");
    metaPragma.httpEquiv = "Pragma";
    metaPragma.content = "no-cache";
    document.head.appendChild(metaPragma);

    const metaCache = document.createElement("meta");
    metaCache.httpEquiv = "Cache-Control";
    metaCache.content = "no-store, no-cache, must-revalidate, max-age=0";
    document.head.appendChild(metaCache);

    return () => {
      document.head.removeChild(metaPragma);
      document.head.removeChild(metaCache);
    };
  }, []);

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

  // ✅ Width-based desktop detection (no device sniffing)
  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const handler = () => setIsDesktop(media.matches);
    handler();
    media.addEventListener?.("change", handler);
    window.addEventListener("resize", handler);
    return () => {
      media.removeEventListener?.("change", handler);
      window.removeEventListener("resize", handler);
    };
  }, []);

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
    balanceGraph: <BalanceGraph />,
    weeklyRevenue: <WeeklyRevenue />,
    dailyPnL: <DailyPnL />,
    bestTradingPairs: <BestTradingPairs />,
    openPositions: <OpenPositions />,
  };

  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden overflow-y-auto ${
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

      {/* Mobile toggle only when not desktop */}
      {!isDesktop && (
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen((s) => !s)}
          aria-label="Toggle sidebar"
        >
          ☰
        </button>
      )}

      {/* Sidebar: pinned on desktop; slide-in on mobile */}
      <aside
        className={`sidebar ${
          isDesktop || sidebarOpen ? "open" : ""
        } bg-black/70 text-white`}
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
            { label: "Logout", className: "sidebar-red", action: handleLogout },
          ].map((btn, i) => (
            <li key={i}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (btn.action) btn.action();
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

      {/* Tap-to-close backdrop for mobile sidebar */}
      {!isDesktop && sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main */}
      <main
        className="relative z-20 p-6 overflow-y-auto animate-fade-in"
        style={{
          marginLeft: isDesktop ? "250px" : 0,
          height: "100vh",
          width: isDesktop ? "calc(100% - 250px)" : "100%",
          color: isDarkMode ? "#fff" : "#000",
        }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
          {Object.entries(cards).map(([key, component]) => (
            <div
              key={key}
              onClick={() => setExpandedCard(key)}
              className="cursor-pointer p-4 bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              {component}
            </div>
          ))}
        </div>
      </main>

      {/* Expanded modal only on desktop */}
      {isDesktop && expandedCard && (
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
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 0 20px 5px #00ffff",
              position: "relative",
              color: isDarkMode ? "#fff" : "#000",
              fontSize: "2em",
              lineHeight: "1.2",
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
