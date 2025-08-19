// UserSidebar.jsx
import React from "react";
import { useNavigate } from "react-router-dom"; // or your routing method

export default function UserSidebar({ isOpen, playHoverSound }) {
  const navigate = useNavigate(); // for redirecting after logout

  const handleLogout = () => {
    // Clear auth tokens or session info
    localStorage.removeItem("authToken");
    sessionStorage.clear();
    // Redirect to login page
    navigate("/login");
  };

  const buttons = [
    { label: "Dashboard", className: "sidebar-cyan" },
    { label: "Settings", className: "sidebar-purple" },
    { label: "Positions", className: "sidebar-yellow" },
    { label: "Logout", className: "sidebar-red", onClick: handleLogout },
  ];

  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <h2 className="text-xl font-bold mb-10 text-cyan-300 drop-shadow-md">
        QuantumCopyTrading
      </h2>
      <nav className="flex flex-col space-y-3">
        {buttons.map((btn, i) => (
          <button
            key={i}
            onClick={(e) => {
              if (btn.onClick) btn.onClick();
              playHoverSound && playHoverSound();
            }}
            className={`sidebar-button ${btn.className} px-4 py-2`}
          >
            {btn.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
