import React, { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default function BalanceGraph({ isDarkMode }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Detect mobile
    const isMobile = window.innerWidth <= 768;

    // White text ONLY on mobile dark mode
    const labelColor =
      isDarkMode && isMobile ? "#ffffff" : isDarkMode ? "#cccccc" : "#000000";

    const gridColor = isDarkMode
      ? "rgba(255,255,255,0.1)"
      : "rgba(0,0,0,0.1)";
    const tooltipBg = isDarkMode ? "#111827" : "#ffffff";

    const balanceData = [1000, 1075, 1120, 1060, 1220, 1300];
    const balancePointColors = balanceData.map((val, i) =>
      i === 0 ? labelColor : val >= balanceData[i - 1] ? "green" : "red"
    );

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: ["Jul 1", "Jul 5", "Jul 10", "Jul 15", "Jul 20", "Jul 25"],
        datasets: [
          {
            label: "Balance",
            data: balanceData,
            fill: true,
            backgroundColor: "rgba(59,130,246,0.1)",
            borderColor: "rgba(59,130,246,1)",
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: balancePointColors,
            pointRadius: 5,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: {
          y: {
            min: 900,
            max: 1400,
            ticks: {
              callback: (value) => `$${value}`,
              color: labelColor,
              font: { size: 12 },
            },
            grid: { color: gridColor },
          },
          x: {
            ticks: { color: labelColor, font: { size: 12 } },
            grid: { color: gridColor },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `$${ctx.parsed.y}`,
            },
            bodyColor: labelColor,
            titleColor: labelColor,
            backgroundColor: tooltipBg,
            borderColor: isDarkMode ? "#ffffff33" : "#00000033",
            borderWidth: 1,
          },
        },
      },
    });

    // ✅ Force all chart text to respect our labelColor
    Chart.defaults.color = labelColor;
    Chart.defaults.scale.ticks.color = labelColor;
    Chart.defaults.plugins.tooltip.bodyColor = labelColor;
    Chart.defaults.plugins.tooltip.titleColor = labelColor;

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [isDarkMode]);

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border-2 border-cyan-400 dashboard-column sidebar-cyan overflow-hidden transition duration-300 hover:shadow-[0_0_20px_#00ffff,_0_0_40px_#00ffff,_0_0_60px_#00ffff] hover:scale-105">
      <h2
        className="text-lg font-semibold mb-2"
        style={{ color: isDarkMode ? "#fff" : "#000" }}
      >
        Balance Graph
      </h2>
      <div className="h-40">
        <canvas ref={canvasRef} className="w-full h-full bg-transparent"></canvas>
      </div>
    </div>
  );
}
