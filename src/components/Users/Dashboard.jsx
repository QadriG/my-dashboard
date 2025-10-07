import React, { useRef, useState, useEffect } from "react";
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
  const { user, logout, loading: authLoading } = useUserAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const adminView = location.state?.adminView || false;
  const userId = location.state?.userId || null;

  const [balance, setBalance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/user/balance", {
          credentials: "include",
        });
        const data = await res.json();
        console.log("Balance API Response:", data); // Debug log
        if (data.success) {
          setBalance(data.balanceData || []);
        } else {
          setError(data.message || "No data received");
        }
      } catch (err) {
        console.error("Fetch Balance Error:", err);
        setError("Failed to fetch balance");
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [userId || user?.id]);

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

        <DashboardCards
          userId={userId || user?.id}
          isAdmin={adminView}
          balanceData={balance}
        />
      </main>
    </div>
  );
}