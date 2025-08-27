import React from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children, onLogout }) {
  return (
    <div className="flex">
      <Sidebar onLogout={onLogout} />
      <main className="relative z-20 p-6 overflow-y-auto md:ml-64 w-full">
        {children}
      </main>
    </div>
  );
}
