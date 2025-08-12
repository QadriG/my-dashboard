import React, { useState, useEffect } from "react";
import "./styles/sidebar.css"; // Styles for sidebar, title wave, and columns
import "./styles/globals.css"; // Global styles including overlay and shimmer
import DashboardPC from "./components/Dashboard.jsx";
import DashboardMobile from "./components/DashboardMobile.jsx";

function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const calculateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const diagonalPx = Math.sqrt(width ** 2 + height ** 2);
      const dpi = 96 * (window.devicePixelRatio || 1);
      const diagonalInches = diagonalPx / dpi;
      setIsMobile(diagonalInches < 7);
    };

    calculateScreenSize();
    window.addEventListener("resize", calculateScreenSize);
    return () => window.removeEventListener("resize", calculateScreenSize);
  }, []);

  return isMobile ? <DashboardMobile /> : <DashboardPC />;
}

export default App;