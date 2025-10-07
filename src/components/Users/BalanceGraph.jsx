// src/components/BalanceGraph.jsx
import React, { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default function BalanceGraph({ isDarkMode, balanceData }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const [labels, setLabels] = useState([]);
  const [balances, setBalances] = useState([]);
  const [range, setRange] = useState("30"); // default last 30 days
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  // Use balanceData if available, otherwise fetch from API
  useEffect(() => {
    if (balanceData && balanceData.length > 0) {
      const latestData = balanceData[0]; // Assuming the first entry is the latest
      setLabels([new Date().toLocaleDateString()]); // Simplistic label for now
      setBalances([parseFloat(latestData.balances.data[0]?.balance) || 0]);
    } else {
      fetchBalanceHistory(range);
    }
  }, [balanceData, range, customRange]);

  async function fetchBalanceHistory(days, startDate, endDate) {
    try {
      let url = `/api/user/balance-history?days=${days}`;
      if (startDate && endDate) {
        url = `/api/user/balance-history?start=${startDate}&end=${endDate}`;
      }

      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();

      setLabels(data.labels || []);
      setBalances(data.balances || []);
    } catch (err) {
      console.error("Error fetching balance history:", err);
    }
  }

  useEffect(() => {
    if (!canvasRef.current || balances.length === 0) return;

    const ctx = canvasRef.current.getContext("2d");
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const labelColor = isDarkMode ? "#ffffff" : "#000000";
    const gridColor = isDarkMode
      ? "rgba(255,255,255,0.1)"
      : "rgba(0,0,0,0.1)";
    const tooltipBg = isDarkMode ? "#111827" : "#ffffff";

    const balancePointColors = balances.map((val, i) =>
      i === 0 ? labelColor : val >= balances[i - 1] ? "green" : "red"
    );

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Balance",
            data: balances,
            fill: true,
            backgroundColor: "rgba(59,130,246,0.1)",
            borderColor: "rgba(59,130,246,1)",
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: balancePointColors,
            pointRadius: 4,
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
            beginAtZero: false,
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
  }, [isDarkMode, labels, balances]);

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border-2 border-cyan-400 dashboard-column sidebar-cyan overflow-hidden transition duration-300 hover:shadow-[0_0_20px_#00ffff,_0_0_40px_#00ffff,_0_0_60px_#00ffff] hover:scale-105">
      <div className="flex justify-between items-center mb-2">
        <h2
          className="text-lg font-semibold"
          style={{ color: isDarkMode ? "#fff" : "#000" }}
        >
          Balance Graph
        </h2>

        {/* 🔽 Dropdown */}
        <select
          className="bg-gray-800 text-white text-sm p-1 rounded"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="30">Last 30 Days</option>
          <option value="60">Last 60 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      {/* 🗓 Custom Range */}
      {range === "custom" && (
        <div className="flex space-x-2 mb-2">
          <input
            type="date"
            className="bg-gray-700 text-white p-1 rounded"
            value={customRange.start}
            onChange={(e) =>
              setCustomRange({ ...customRange, start: e.target.value })
            }
          />
          <input
            type="date"
            className="bg-gray-700 text-white p-1 rounded"
            value={customRange.end}
            onChange={(e) =>
              setCustomRange({ ...customRange, end: e.target.value })
            }
          />
        </div>
      )}

      <div className="h-40">
        <canvas ref={canvasRef} className="w-full h-full bg-transparent"></canvas>
      </div>
    </div>
  );
}