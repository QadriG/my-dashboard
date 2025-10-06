// src/pages/UserDashboard.jsx
import React, { useRef, useState } from "react";
import { isMobile } from "react-device-detect";
import { useTheme } from "../../context/ThemeContext";
import "../../styles/sidebar.css";
import "../../styles/globals.css";
import UserSidebar from "./Sidebar.jsx";
import hoverSound from "../../assets/click.mp3";
import { useUserAuth } from "../../hooks/useUserAuth";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardCards from "../DashboardCards";

// ✅ Light/Dark mode toggle component
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

// ✅ Main UserDashboard component
export default function UserDashboard() {
  const audioRef = useRef(null);
  const { isDarkMode } = useTheme();
  const { user, logout, loading } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const adminView = location.state?.adminView || false;
  const userId = location.state?.userId || null;

  const playHoverSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="zoom-out-container relative h-screen w-screen overflow-x-hidden overflow-y-auto">
      <audio ref={audioRef} preload="auto">
        <source src={hoverSound} type="audio/mpeg" />
      </audio>

      {!adminView && (
        <UserSidebar isOpen={true} playHoverSound={playHoverSound} onLogout={logout} />
      )}

      <main
        className={`relative z-20 p-6 overflow-y-auto ${adminView ? "md:ml-64" : "md:ml-64"}`}
        style={{ height: "100vh", width: "100%", maxWidth: "calc(100vw - 16rem)" }}
      >
        <div className="shimmer-wrapper w-full py-4 px-6 mb-6 relative flex justify-between items-center">
          <h1 className="text-4xl font-semibold drop-shadow-md inline-block title-bar-text">
            Dashboard
          </h1>
          <LightModeToggle />
        </div>

        {/* ✅ Centralized dashboard cards component (auto-updates from Bitunix via backend) */}
        <DashboardCards userId={userId || user?.id} isAdmin={adminView} />

        <div className="mt-8 flex justify-center">
          <button
            onClick={() =>
              navigate(
                adminView ? `/admin/users/${userId}/positions` : "/user/positions"
              )
            }
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md transition"
          >
            View All Positions
          </button>
        </div>
      </main>
    </div>
  );
}
