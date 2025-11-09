import React, { useEffect, useRef, useState } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

// Helper: Get start of week (Monday)
function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(d.setDate(diff));
}

// Helper: Format date as YYYY-MM-DD
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function WeeklyRevenue({ isDarkMode, balanceData }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const [labels, setLabels] = useState([]);
  const [revenues, setRevenues] = useState([]);
  const [rangeType, setRangeType] = useState('4w'); // '4w', '8w', 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Process data based on selected range
  useEffect(() => {
    if (!balanceData?.weeklyRevenue) return;

    // Sort by date (ascending)
    const sortedData = [...balanceData.weeklyRevenue].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    let filteredData = sortedData;

    // Apply range filter
    if (rangeType === '4w') {
      // Last 4 weeks
      filteredData = sortedData.slice(-4);
    } else if (rangeType === '8w') {
      // Last 8 weeks
      filteredData = sortedData.slice(-8);
    } else if (rangeType === 'custom' && startDate && endDate) {
      // Filter by custom date range
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      filteredData = sortedData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= start && itemDate <= end;
      });
    }

    const labels = filteredData.map(w => w.date);
    const revenues = filteredData.map(w => parseFloat(w.balance.toFixed(2)));
    
    setLabels(labels);
    setRevenues(revenues);
  }, [balanceData, rangeType, startDate, endDate]);

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
            ticks: { 
              color: labelColor, 
              font: { size: 10 },
              maxRotation: 45,
              minRotation: 45
            },
            grid: { color: gridColor },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `$${ctx.parsed.y.toFixed(2)}`
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

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [isDarkMode, labels, revenues]);

  // Generate available week options for date pickers
  const generateWeekOptions = () => {
    if (!balanceData?.weeklyRevenue) return [];
    
    const sortedData = [...balanceData.weeklyRevenue].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    return sortedData.map(item => ({
      value: item.date,
      label: `Week of ${item.date}`
    }));
  };

  const weekOptions = generateWeekOptions();

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border-2 border-cyan-400 dashboard-column sidebar-cyan overflow-hidden transition duration-300 hover:shadow-[0_0_20px_#00ffff,_0_0_40px_#00ffff,_0_0_60px_#00ffff] hover:scale-105">
      <div className="flex justify-between items-center mb-2">
        <h2
          className="text-lg font-semibold"
          style={{ color: isDarkMode ? "#fff" : "#000" }}
        >
          Weekly Revenue
        </h2>

        <select
          value={rangeType}
          onChange={(e) => setRangeType(e.target.value)}
          className="bg-black/50 border border-cyan-400 text-sm rounded px-2 py-1 text-white mr-2"
        >
          <option value="4w">Last 4 Weeks</option>
          <option value="8w">Last 8 Weeks</option>
          <option value="custom">Custom Range</option>
        </select>

        {rangeType === 'custom' && (
          <div className="flex gap-2">
            <select
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-black/50 border border-cyan-400 text-sm rounded px-2 py-1 text-white"
              placeholder="Start Week"
            >
              <option value="">Start Week</option>
              {weekOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-black/50 border border-cyan-400 text-sm rounded px-2 py-1 text-white"
              placeholder="End Week"
            >
              <option value="">End Week</option>
              {weekOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="h-40">
        <canvas ref={canvasRef} className="w-full h-full bg-transparent"></canvas>
      </div>
    </div>
  );
}