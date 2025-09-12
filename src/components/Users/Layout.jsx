// src/components/Users/UserLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import UserSidebar from "./Sidebar.jsx";
import LiveChat from "./LiveChat";
import { ChatProvider } from "../../context/ChatContext";
import { useUserAuth } from "../../hooks/useUserAuth";

export function UserLayout() {
  const { isDarkMode } = useTheme();
  const { user, logout, loading } = useUserAuth(); // include loading

  // Show loading placeholder while user is being fetched
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-black text-white">
        Loading dashboard...
      </div>
    );
  }

  // Guest fallback if no user
  const userId = user?.id || user?._id || "guest";

  return (
    <ChatProvider userId={userId}>
      <div
        className={`flex ${isDarkMode ? "dark-mode" : "light-mode"}`}
        style={{ minHeight: "100vh", width: "100%", overflow: "hidden" }}
      >
        {/* Only render sidebar if user exists */}
        {user && <UserSidebar onLogout={logout} />}

        <main
          className="flex-1 p-4 relative"
          style={{
            width: user ? "calc(100% - 16rem)" : "100%",
            marginLeft: user ? "16rem" : "0",
          }}
        >
          <div className="shimmer-wrapper w-full py-4 px-6 mb-6 relative z-10 flex justify-between items-center">
            <h1 className="text-4xl font-semibold drop-shadow-md inline-block title-bar-text">
              Dashboard
            </h1>
            {user && (
              <button onClick={logout} className="theme-toggle">
                {isDarkMode ? "Light Mode" : "Dark Mode"}
              </button>
            )}
          </div>

          <Outlet />

          {/* ✅ LiveChat always mounted, safely handles guest */}
          <LiveChat />
        </main>
      </div>
    </ChatProvider>
  );
}
