import React, { useRef, useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import "../../styles/sidebar.css";
import "../../styles/globals.css";
import UserSidebar from "./Sidebar.jsx";
import hoverSound from "../../assets/click.mp3";
import { useUserAuth } from "../../hooks/useUserAuth";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardCards from "../DashboardCards";

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
          ? "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff"
          : "0 0 10px #0000ff, 0 0 20px #0000ff, 0 0 30px #0000ff")
      }
    >
      {isDarkMode ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

export default function UserDashboard() {
  const audioRef = useRef(null);
  const { isDarkMode } = useTheme();
  const { user, logout, loading: authLoading } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const adminView = location.state?.adminView || false;
  const userIdFromState = location.state?.userId || null;

  const [balance, setBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Derive userId from user object after authentication
  const userId = user?.id || userIdFromState;

  useEffect(() => {
    console.log("UserDashboard: useEffect triggered - user:", user, "userId:", userId, "authLoading:", authLoading);
    if (authLoading || !userId) {
      console.log("UserDashboard: Waiting for auth or userId to be available");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        console.log("UserDashboard: Starting fetch for userId:", userId);
        

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        console.log("UserDashboard: Dashboard API Response:", data);

        const transformedBalance =
          data.dashboard?.balances?.map((b) => ({
            exchange: b.exchange || "bitunix",
            type: b.type || "spot",
            totalBalance: b.balance?.total || 0,
            available: b.balance?.free || 0,
            used: b.balance?.used || 0,
            totalPositions: b.totalPositions || 0,
            dailyData: Array(7)
              .fill()
              .map((_, i) => ({
                date: new Date(Date.now() - i * 86400000)
                  .toISOString()
                  .split("T")[0],
                available: b.balance?.free || 0,
              }))
              .reverse(),
          })) || [];

        setBalance(transformedBalance);
        console.log("UserDashboard: Set balance to:", transformedBalance);
      } catch (err) {
        console.error("UserDashboard: Fetch Dashboard Error:", err);
        setError(`Failed to fetch dashboard data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId, authLoading]);

  const playHoverSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  if (authLoading) return <div>Loading dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (loading) return <div>Loading data...</div>;

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

        <DashboardCards
          userId={userId}
          isAdmin={adminView}
          balanceData={balance}
        />
      </main>
    </div>
  );
}