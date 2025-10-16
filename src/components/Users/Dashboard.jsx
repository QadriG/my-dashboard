/* eslint no-undef: "off" */
import React, { useRef, useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useUserAuth } from "../../hooks/useUserAuth";
import { useLocation } from "react-router-dom";
import "../../styles/globals.css";
import UserSidebar from "./Sidebar.jsx";
import hoverSound from "../../assets/click.mp3";
import DashboardCards from "../DashboardCards";

// ---------------------
// LightModeToggle
// ---------------------
function LightModeToggle({ className, style }) {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className || ""}`}
      style={style}
      onMouseEnter={(e) =>
        (e.target.style.boxShadow = isDarkMode
          ? "0 0 15px #00ffff, 0 0 25px #00ffff, 0 0 40px #00ffff"
          : "0 0 15px #0000ff, 0 0 25px #0000ff, 0 0 40px #0000ff")
      }
      onMouseLeave={(e) =>
        (e.target.style.boxShadow = isDarkMode
          ? "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #0000ff"
          : "0 0 10px #0000ff, 0 0 20px #0000ff, 0 0 30px #0000ff")
      }
    >
      {isDarkMode ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

// ---------------------
// Dashboard
// ---------------------
export default function Dashboard() {
  const audioRef = useRef(null);
  const { user, logout, loading: authLoading } = useUserAuth();
  const location = useLocation();
  const adminView = location.state?.adminView || false;
  const userIdFromState = location.state?.userId || null;

  const [balance, setBalance] = useState([
    { exchange: "bitunix", type: "spot", totalBalance: 0, available: 0, used: 0, totalPositions: 0, dailyData: [] },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = user?.id || userIdFromState;

  // ✅ Detect environment and choose backend base URL
  const API_BASE_URL =
    process.env.NODE_ENV === "development"
      ? import.meta.env.VITE_LOCAL_API_URL || "http://localhost:5001"
      : import.meta.env.VITE_API_URL || window.location.origin;

  useEffect(() => {
    console.log("Dashboard: useEffect triggered - user:", user, "userId:", userId, "authLoading:", authLoading);

    if (authLoading || !userId) {
      console.log("Dashboard: Waiting for auth or userId to be available");
      setLoading(false);
      return;
    }

    const fetchExchangeData = async () => {
      try {
        const url = `${API_BASE_URL}/api/exchange/sync/${userId}`;
        console.log(`Fetching exchange data from: ${url}`);

        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            "Cache-Control": "no-store",
          },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const exchangeData = await response.json();
        console.log("Dashboard: Exchange Data Response:", exchangeData);

        if (!exchangeData || exchangeData.length === 0) {
          throw new Error("No exchange data available for user");
        }

        const firstExchange = exchangeData[0];
        const { balance, exchange, type } = firstExchange;

        if (!balance) throw new Error(`No balance data for ${exchange}`);

        const transformedBalance = [
          {
            exchange,
            type,
            totalBalance: balance.totalBalance || 0,
            available: balance.available || 0,
            used: balance.used || 0,
            totalPositions: firstExchange.openPositions?.length || 0,
            dailyData: balance.dailyData || [],
          },
        ];

        console.log("Dashboard: Set balance to:", transformedBalance);
        setBalance(transformedBalance);
      } catch (err) {
        console.error("Dashboard: Fetch Exchange Error:", err);
        setError(
          `Failed to fetch exchange data: ${err.message} - Dashboard is still accessible. Exchange data will update when available.`
        );
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeData();
  }, [user, userId, authLoading]);

  const playHoverSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  if (authLoading) return <div>Loading dashboard...</div>;

  return (
    <div className="zoom-out-container relative h-screen w-screen overflow-x-hidden overflow-y-auto">
      <audio ref={audioRef} preload="auto">
        <source src={hoverSound} type="audio/mpeg" />
      </audio>

      <UserSidebar isOpen={true} playHoverSound={playHoverSound} onLogout={logout} />

      <main
        className="relative z-20 p-6 overflow-y-auto md:ml-64"
        style={{
          height: "100vh",
          width: "100%",
          maxWidth: "calc(100vw - 16rem)",
        }}
      >
        <div className="shimmer-wrapper w-full py-4 px-6 mb-6 relative flex justify-between items-center">
          <h1 className="text-4xl font-semibold drop-shadow-md inline-block title-bar-text">Dashboard</h1>
          <LightModeToggle />
        </div>

        {error && <div className="text-yellow-500">{error}</div>}
        {loading ? (
          <div>Loading data...</div>
        ) : (
          <DashboardCards userId={userId} isAdmin={adminView} balanceData={balance} />
        )}
      </main>
    </div>
  );
}
