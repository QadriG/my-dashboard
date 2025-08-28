import React from "react";
import UserSidebar from "./Users/UserSidebar";

export default function UserLayout({ children, onLogout }) {
  return (
    <div className="flex h-screen">
  <Sidebar onLogout={onLogout} />
  <main className="flex-1 ml-64 p-6 overflow-auto bg-black text-white">
    {children}
  </main>
</div>
  );
}
