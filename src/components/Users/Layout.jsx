import React from "react";
import { Outlet } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import UserSidebar from "./Sidebar.jsx";
import LiveChat from "./LiveChat";
import { ChatProvider } from "../../context/ChatContext";
import { useUserAuth } from "../../hooks/useUserAuth";

export function UserLayout() {
  const { isDarkMode } = useTheme();
  const { logout } = useUserAuth(); // now mimics admin logout fully

  return (
    <ChatProvider>
      <div
        className={`flex ${isDarkMode ? "dark-mode" : "light-mode"}`}
        style={{ minHeight: "100vh", width: "100%", overflow: "hidden" }}
      >
        <UserSidebar onLogout={logout} />

        <main
          className="flex-1 p-4 relative"
          style={{ width: "calc(100% - 16rem)", marginLeft: "16rem" }}
        >
          <div className="shimmer-wrapper w-full py-4 px-6 mb-6 relative z-10 flex justify-between items-center">
            <h1 className="text-4xl font-semibold drop-shadow-md inline-block title-bar-text">
              Dashboard
            </h1>
            <button onClick={logout} className="theme-toggle">
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>

          <Outlet />
          <LiveChat />
        </main>
      </div>
    </ChatProvider>
  );
}
