// src/pages/PositionsPage.jsx
import React, { useRef } from "react";
import { useUserAuth } from "../hooks/useUserAuth";
import UserSidebar from "../components/Users/Sidebar.jsx";
import hoverSound from "../assets/click.mp3";
import PositionsTable from "../components/Users/PositionsTable";

export default function PositionsPage() {
  const audioRef = useRef(null);
  const { user, logout } = useUserAuth();

  const playHoverSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="zoom-out-container relative h-screen w-screen overflow-x-hidden overflow-y-auto">
      <audio ref={audioRef} preload="auto">
        <source src={hoverSound} type="audio/mpeg" />
      </audio>

      <UserSidebar
        isOpen={true}
        playHoverSound={playHoverSound}
        onLogout={logout}
      />

      <main
        className="relative z-20 p-6 overflow-y-auto md:ml-64"
        style={{
          height: "100vh",
          width: "100%",
          maxWidth: "calc(100vw - 16rem)",
        }}
      >
        <div className="shimmer-wrapper w-full py-4 px-6 mb-6 relative flex justify-between items-center">
          <h1 className="text-4xl font-semibold drop-shadow-md inline-block title-bar-text">
            Positions
          </h1>
        </div>

        <PositionsTable userId={user?.id} />
      </main>
    </div>
  );
}