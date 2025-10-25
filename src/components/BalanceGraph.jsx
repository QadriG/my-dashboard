// src/components/Users/BalanceGraph.jsx
import React, { useRef, useState, useEffect } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default function BalanceGraph({ balanceData }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [labels, setLabels] = useState([]);
  const [balances, setBalances] = useState([]);
  const [range, setRange] = useState("30d"); // ✅ Add state for range

  useEffect(() => {
    if (balanceData && balanceData.length > 0) {
      const item = balanceData[0];
      let snapshots = item.dailyPnLSnapshots || [];

      // 🔹 Filter by range
      const now = new Date();
      let filtered = snapshots;

      if (range !== "all") {
        const days = range === "7d" ? 7 : range === "10d" ? 10 : 30;
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() - days);
        filtered = snapshots.filter(s => new Date(s.date) >= cutoff);
      }

      // Sort by date ascending
      const sorted = [...filtered].sort((a, b) => new Date(a.date) - new Date(b.date));
      setLabels(sorted.map(s => s.date.split('T')[0]));
      setBalances(sorted.map(s => s.totalBalance));
    }
  }, [balanceData, range]); // ✅ Re-run when range changes

  useEffect(() => {
    if (!canvasRef.current || balances.length === 0) return;

    const ctx = canvasRef.current.getContext("2d");
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Balance",
            data: balances,
            fill: true,
            backgroundColor: "rgba(59,130,246,0.1)",
            borderColor: "rgba(59,130,246,1)",
            borderWidth: 2,
            tension: 0.4,
            pointBackgroundColor: "white",
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
              color: "#fff",
            },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
          x: {
            ticks: { color: "#fff", font: { size: 12 } },
            grid: { color: "rgba(255,255,255,0.1)" },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: { label: (ctx) => `$${ctx.parsed.y}` },
            bodyColor: "#fff",
            titleColor: "#fff",
            backgroundColor: "#111827",
            borderColor: "rgba(255,255,255,0.33)",
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
  }, [labels, balances]);

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 border-2 border-cyan-400 dashboard-column sidebar-cyan overflow-hidden transition duration-300 hover:shadow-[0_0_20px_#00ffff,_0_0_40px_#00ffff,_0_0_60px_#00ffff] hover:scale-105">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-semibold text-white">Balance Graph</h2>
        {/* ✅ Add date range selector */}
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="bg-gray-800 text-white text-sm p-1 rounded"
        >
          <option value="7d">Last 7 Days</option>
          <option value="10d">Last 10 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>
      <div className="h-40">
        <canvas ref={canvasRef} className="w-full h-full bg-transparent"></canvas>
      </div>
    </div>
  );
} 