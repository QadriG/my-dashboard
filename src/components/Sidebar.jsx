import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../hooks/useAdminAuth"; // ✅ centralized logout
import "../styles/sidebar.css";
import hoverSound from "../assets/click.mp3";

export default function Sidebar() {
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAdminAuth(); // ✅ use global logout

  const playHoverSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const buttons = [
    { label: "Dashboard", className: "sidebar-cyan", path: "/admin" },
    { label: "Settings", className: "sidebar-purple", path: "/admin/settings" },
    { label: "API Details", className: "sidebar-green", path: "/admin/api-details" },
    { label: "Positions", className: "sidebar-yellow", path: "/admin/positions" },
    { label: "Users", className: "sidebar-users", path: "/admin/users" },
    { label: "Logs", className: "sidebar-logs", path: "/admin/logs" },
    { label: "Manual Push", className: "sidebar-manual-push", path: "/admin/manual-push" },
    { label: "Logout", className: "sidebar-red", action: logout }, // ✅ centralized
  ];

  return (
    <aside className="sidebar open bg-black text-white min-h-screen p-4">
      <h2 className="text-xl font-bold mb-10 text-cyan-300 drop-shadow-md">
        QuantumCopyTrading
      </h2>
      <audio ref={audioRef} preload="auto">
        <source src={hoverSound} type="audio/mpeg" />
      </audio>
      <ul>
        {buttons.map((btn, i) => (
          <li key={i} className="mb-3">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (btn.action) btn.action();
                else if (btn.path) navigate(btn.path);
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
  );
}
