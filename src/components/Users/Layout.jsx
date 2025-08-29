import React from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import UserSidebar from "./Sidebar.jsx";
import LiveChat from "./LiveChat";
import { ChatProvider } from "../../context/ChatContext";

export function UserLayout({ children }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const getPageTitle = () => {
    const path = window.location.pathname.split("/").pop();
    return path === "user" ? "Dashboard" : path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <ChatProvider>
      <div className={`flex ${isDarkMode ? "dark-mode" : "light-mode"}`} style={{ minHeight: "100vh", width: "100%", overflow: "hidden" }}>
        <UserSidebar />
        <main className="flex-1 p-4 relative" style={{ width: "calc(100% - 16rem)", marginLeft: "16rem" }}>
          <div className="shimmer-wrapper w-full py-4 px-6 mb-6 relative z-10">
            <h1 className="text-4xl font-semibold drop-shadow-md inline-block title-bar-text">{getPageTitle()}</h1>
            <button
              onClick={toggleTheme}
              className="theme-toggle"
              onMouseEnter={(e) => (e.target.style.boxShadow = isDarkMode ? "0 0 15px #00ffff, 0 0 25px #00ffff, 0 0 40px #00ffff" : "0 0 15px #0000ff, 0 0 25px #0000ff, 0 0 40px #0000ff")}
              onMouseLeave={(e) => (e.target.style.boxShadow = isDarkMode ? "0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff" : "0 0 10px #0000ff, 0 0 20px #0000ff, 0 0 30px #0000ff")}
            >
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
          {children}
          <LiveChat />
        </main>
      </div>
    </ChatProvider>
  );
}