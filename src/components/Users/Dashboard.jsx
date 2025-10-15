/* eslint no-undef: "off" */
import React, { useRef, useState, useEffect } from "react";
// import { isMobile } from "react-device-detect"; // Commented out if unused
import { useTheme } from "../../context/ThemeContext";
import { useUserAuth } from "../../hooks/useUserAuth";
import { useNavigate, useLocation } from "react-router-dom";
// import { useSocket } from "../hooks/useSocket"; // Commented out if unused
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
  const { isDarkMode } = useTheme(); // Keep for now, use if needed
  const { user, logout, loading: authLoading } = useUserAuth();
  const navigate = useNavigate(); // Keep for now, use if needed
  const location = useLocation();
  const adminView = location.state?.adminView || false;
  const userIdFromState = location.state?.userId || null;

  const [balance, setBalance] = useState([
    { exchange: "bitunix", type: "spot", totalBalance: 0, available: 0, used: 0, totalPositions: 0, dailyData: [] },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Derive userId from user object after authentication
  const userId = user?.id || userIdFromState;

  useEffect(() => {
    console.log("Dashboard: useEffect triggered - user:", user, "userId:", userId, "authLoading:", authLoading, "user.token:", user?.token);
    if (authLoading || !userId) {
      console.log("Dashboard: Waiting for auth or userId to be available");
      setLoading(false); // Allow rendering even if auth is loading
      return;
    }

    const fetchExchangeData = async () => {
      try {
        const response = await fetch(`http://localhost:5001/api/exchange/sync/${userId}`, {
          method: "GET",
          credentials: "include",
          headers: { "Cache-Control": "no-store" },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const exchangeData = await response.json();
        console.log("Dashboard: Exchange Data Response:", exchangeData);

        if (!exchangeData || exchangeData.length === 0) {
          throw new Error("No exchange data available for user");
        }

        // Transform the first exchange's data to match balanceData format
        const firstExchange = exchangeData[0];
        const { balance, exchange, type } = firstExchange;

        if (!balance) throw new Error(`No balance data for ${exchange}`);

        const totalBalance = Object.values(balance.total).reduce((sum, val) => sum + (val || 0), 0);
        const available = Object.values(balance.free).reduce((sum, val) => sum + (val || 0), 0);
        const used = Object.values(balance.used).reduce((sum, val) => sum + (val || 0), 0);

        const transformedBalance = [
          {
            exchange,
            type,
            totalBalance,
            available,
            used,
            totalPositions: firstExchange.openPositions?.length || 0, // Use openPositions length
            dailyData: [], // Placeholder; requires historical data
          },
        ];

        setBalance(transformedBalance);
        console.log("Dashboard: Set balance to:", transformedBalance);
      } catch (err) {
        console.error("Dashboard: Fetch Exchange Error:", err);
        setError(`Failed to fetch exchange data: ${err.message}`);
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
  // Render dashboard with error or placeholder if fetch fails
  return (
    <div className="zoom-out-container relative h-screen w-screen overflow-x-hidden overflow-y-auto">
      <audio ref={audioRef} preload="auto">
        <source src={hoverSound} type="audio/mpeg" />
      </audio>

      <UserSidebar
        isOpen={true}
        playHoverSound={playHoverSound}
        onLogout={logout}
      />

      <main
        className="relative z-20 p-6 overflow-y-auto md:ml-64"
        style={{
          height: "100vh",
          width: "100%",
          maxWidth: "calc(100vw - 16rem)",
        }}
      >
        <div className="shimmer-wrapper w-full py-4 px-6 mb-6 relative flex justify-between items-center">
          <h1 className="text-4xl font-semibold drop-shadow-md inline-block title-bar-text">
            Dashboard
          </h1>
          <LightModeToggle />
        </div>

        {error && (
          <div className="text-yellow-500">
            {error} - Dashboard is still accessible. Exchange data will update when available.
          </div>
        )}
        {loading ? (
          <div>Loading data...</div>
        ) : (
          <DashboardCards
            userId={userId}
            isAdmin={adminView}
            balanceData={balance}
          />
        )}
      </main>
    </div>
  );
}