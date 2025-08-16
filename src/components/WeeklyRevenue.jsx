import React, { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default function WeeklyRevenue({ isDarkMode }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // detect mobile
    const isMobile = window.innerWidth <= 768;
    const forceWhite = isDarkMode && isMobile;

    // 🔑 force Chart.js defaults for all text elements
    Chart.defaults.color = forceWhite
      ? "#ffffff"
      : isDarkMode
      ? "#cccccc"
      : "#000000";
    Chart.defaults.borderColor = isDarkMode
      ? "rgba(255,255,255,0.1)"
      : "rgba(0,0,0,0.1)";

    const labelColor = Chart.defaults.color;
    const gridColor = Chart.defaults.borderColor;
    const tooltipBg = isDarkMode ? "#111827" : "#ffffff";

    const revenueData = [120, 85, 140, 105];
    const revenueBarColors = revenueData.map((val, i) =>
      i === 0
        ? "rgba(34,197,94,1)"
        : val >= revenueData[i - 1]
        ? "rgba(34,197,94,1)"
        : "rgba(239,68,68,1)"
    );

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        datasets: [
          {
            data: revenueData,
            backgroundColor: revenueBarColors,
            borderColor: revenueBarColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          y: {
            min: 0,
            max: 160,
            ticks: { color: labelColor, font: { size: 12 } },
            grid: { color: gridColor },
          },
          x: {
            ticks: { color: labelColor, font: { size: 12 } },
            grid: { color: gridColor },
          },
        },
        plugins: {
          legend: {
            display: false,
            labels: { color: labelColor },
          },
          tooltip: {
            callbacks: { label: (ctx) => `$${ctx.parsed.y}` },
            bodyColor: labelColor,
            titleColor: labelColor,
            backgroundColor: tooltipBg,
            borderColor: isDarkMode ? "#ffffff33" : "#00000033",
            borderWidth: 1,
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [isDarkMode]);

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border-2 border-cyan-400 dashboard-column sidebar-cyan overflow-hidden transition duration-300 hover:shadow-[0_0_20px_#00ffff,_0_0_40px_#00ffff,_0_0_60px_#00ffff] hover:scale-105">
      <h2
        className="text-lg font-semibold mb-2"
        style={{ color: isDarkMode ? "#fff" : "#000" }}
      >
        Weekly Revenue
      </h2>
      <div className="h-40">
        <canvas ref={canvasRef} className="w-full h-full bg-transparent"></canvas>
      </div>
    </div>
  );
}
