/* eslint no-undef: "off" */
import React, { useRef, useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useUserAuth } from "../../hooks/useUserAuth";
import { useLocation } from "react-router-dom";
import "../../styles/globals.css";
import UserSidebar from "./Sidebar.jsx";
import hoverSound from "../../assets/click.mp3";
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
          ? "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #0000ff"
          : "0 0 10px #0000ff, 0 0 20px #0000ff, 0 0 30px #0000ff")
      }
    >
      {isDarkMode ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

export default function Dashboard() {
  const audioRef = useRef(null);
  const { user, logout, loading: authLoading } = useUserAuth();
  const location = useLocation();
  const adminView = location.state?.adminView || false;
  const userIdFromState = location.state?.userId || null;

  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id || userIdFromState;

  const playHoverSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  // Fetch real exchange data
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/users/dashboard', {
          method: 'GET',
          credentials: 'include'
        });

        if (!res.ok) {
          console.warn(`API returned ${res.status}: ${res.statusText}`);
          setBalance([]); // empty but valid
          return;
        }

        const result = await res.json();
        if (result.success && result.dashboard) {
          const transformed = result.dashboard.balances.map(bal => ({
            exchange: bal.exchange,
            type: bal.type,
            balance: bal.balance,
            openPositions: result.dashboard.positions.filter(p => 
              p.exchange === bal.exchange && p.type === bal.type
            ),
            openOrders: result.dashboard.openOrders.filter(o => 
              o.exchange === bal.exchange && o.type === bal.type
            ),
            error: bal.error
          }));
          setBalance(transformed);
        } else {
          setBalance([]);
        }
      } catch (err) {
        console.error('Fetch failed (dashboard will still load):', err);
        setBalance([]); // allow render with empty data
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [userId]);

  // Safe fallback: always render dashboard, even if data is missing
  const safeBalance = balance || [];

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
            Dashboard {loading ? "(Loading...)" : ""}
          </h1>
          <LightModeToggle />
        </div>

        <DashboardCards
          userId={userId}
          isAdmin={adminView}
          balanceData={safeBalance}
        />
      </main>
    </div>
  );
}