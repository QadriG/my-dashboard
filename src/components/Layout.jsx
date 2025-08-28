import React from "react";
import UserSidebar from "./Sidebar";
import { useTheme } from "../../context/ThemeContext";

export default function UserLayout({ children, onLogout }) {
  const { isDarkMode } = useTheme();

  return (
    <div
      className={`flex zoom-out-container relative h-screen w-screen overflow-x-hidden overflow-y-auto ${
        isDarkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      {/* Sidebar */}
      <UserSidebar onLogout={onLogout} />

      {/* Main Content */}
      <main
        className={`relative z-20 p-6 overflow-y-auto md:ml-64 w-full ${
          isDarkMode ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
