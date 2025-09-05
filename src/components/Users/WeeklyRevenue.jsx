import React, { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default function WeeklyRevenue({ isDarkMode }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const [labels, setLabels] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [range, setRange] = useState("4w"); // default = last 4 weeks
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  // 🔹 Fetch revenue data from backend
  async function fetchWeeklyRevenue() {
    try {
      let url = `/api/user/weekly-revenue?range=${range}`;
      if (range === "custom" && customRange.start && customRange.end) {
        url = `/api/user/weekly-revenue?start=${customRange.start}&end=${customRange.end}`;
      }

      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();

      setLabels(data.labels || []);
      setRevenues(data.revenues || []);
    } catch (err) {
      console.error("Error fetching weekly revenue:", err);
    }
  }

  useEffect(() => {
    fetchWeeklyRevenue();
  }, [range, customRange]);

  useEffect(() => {
    if (!canvasRef.current || revenues.length === 0) return;

    const ctx = canvasRef.current.getContext("2d");
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labelColor = isDarkMode ? "#ffffff" : "#000000";
    const gridColor = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
    const tooltipBg = isDarkMode ? "#111827" : "#ffffff";

    const revenueBarColors = revenues.map((val, i) =>
      i === 0
        ? "rgba(34,197,94,1)"
        : val >= revenues[i - 1]
        ? "rgba(34,197,94,1)"
        : "rgba(239,68,68,1)"
    );

    chartRef.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            data: revenues,
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
            beginAtZero: true,
            ticks: { color: labelColor, font: { size: 12 } },
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
  }, [isDarkMode, labels, revenues]);

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border-2 border-cyan-400 dashboard-column sidebar-cyan overflow-hidden transition duration-300 hover:shadow-[0_0_20px_#00ffff,_0_0_40px_#00ffff,_0_0_60px_#00ffff] hover:scale-105">
      <div className="flex justify-between items-center mb-2">
        <h2
          className="text-lg font-semibold"
          style={{ color: isDarkMode ? "#fff" : "#000" }}
        >
          Weekly Revenue
        </h2>

        {/* 🔹 Range Selector */}
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="bg-black/50 border border-cyan-400 text-sm rounded px-2 py-1 text-white"
        >
          <option value="4w">Last 4 Weeks</option>
          <option value="8w">Last 8 Weeks</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {/* 🔹 Custom Date Inputs */}
      {range === "custom" && (
        <div className="flex space-x-2 mb-2">
          <input
            type="date"
            value={customRange.start}
            onChange={(e) =>
              setCustomRange((prev) => ({ ...prev, start: e.target.value }))
            }
            className="bg-black/50 border border-cyan-400 text-sm rounded px-2 py-1 text-white w-1/2"
          />
          <input
            type="date"
            value={customRange.end}
            onChange={(e) =>
              setCustomRange((prev) => ({ ...prev, end: e.target.value }))
            }
            className="bg-black/50 border border-cyan-400 text-sm rounded px-2 py-1 text-white w-1/2"
          />
        </div>
      )}

      <div className="h-40">
        <canvas ref={canvasRef} className="w-full h-full bg-transparent"></canvas>
      </div>
    </div>
  );
}
