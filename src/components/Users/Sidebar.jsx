import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useUserAuth } from "../../hooks/useUserAuth"; // ✅ centralized logout
import "../../styles/sidebar.css";
import hoverSound from "../../assets/click.mp3";

export default function UserSidebar() {
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { logout } = useUserAuth(); // ✅ centralized logout

  const playHoverSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const buttons = [
    { label: "Dashboard", className: "sidebar-cyan", path: "/user" },
    { label: "Settings", className: "sidebar-purple", path: "/user/settings" },
    { label: "API Details", className: "sidebar-green", path: "/user/api-details" },
    { label: "Positions", className: "sidebar-yellow", path: "/user/positions" },
    { label: "Logout", className: "sidebar-red", action: logout }, // ✅ centralized logout
  ];

  return (
    <aside
      className={`sidebar open min-h-screen w-64 p-4 fixed left-0 top-0 ${
        isDarkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <h2
        className={`text-xl font-bold mb-10 drop-shadow-md ${
          isDarkMode ? "text-cyan-300" : "text-cyan-700"
        }`}
      >
        QuantumCopyTrading
      </h2>

      <audio ref={audioRef} preload="auto">
        <source src={hoverSound} type="audio/mpeg" />
      </audio>

      <ul>
        {buttons.map((btn, i) => (
          <li key={i} className="mb-3">
            <button
              onClick={() => {
                if (btn.action) btn.action();
                else if (btn.path) navigate(btn.path);
              }}
              onMouseEnter={playHoverSound}
              className={`sidebar-button w-full text-left ${btn.className}`}
            >
              {btn.label}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
