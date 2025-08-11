import React, { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default function WeeklyRevenue() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    const revenueData = [120, 85, 140, 105];
    const revenueBarColors = revenueData.map((val, i) => (i === 0 ? 'rgba(34,197,94,1)' : val >= revenueData[i - 1] ? 'rgba(34,197,94,1)' : 'rgba(239,68,68,1)'));

    chartRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          data: revenueData,
          backgroundColor: revenueBarColors,
          borderColor: revenueBarColors.map(color => color.replace('0.6', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 4,
        animation: false,
        scales: {
          y: {
            min: 0,
            max: 160,
            ticks: { color: '#ffffff', font: { size: 12 } },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          x: { ticks: { color: '#ffffff', font: { size: 12 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
        },
        plugins: { legend: { display: false }, tooltip: { bodyColor: '#ffffff', titleColor: '#ffffff' } }
      }
    });

    // Set custom canvas dimensions
    const canvas = canvasRef.current;
    canvas.width = 300;
    canvas.height = 75; // halved from 150

    // Redraw chart with custom size
    if (chartRef.current) {
      chartRef.current.resize();
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 max-h-[75px] border-2 border-cyan-400 dashboard-column sidebar-cyan text-white overflow-hidden transition duration-300 hover:shadow-[0_0_20px_#00ffff,_0_0_40px_#00ffff,_0_0_60px_#00ffff] hover:scale-105">
      <h2 className="text-lg font-semibold mb-2 text-white">Weekly Revenue</h2>
      <div className="h-[75px]">
        <canvas ref={canvasRef} className="w-full h-[75px] bg-transparent text-white"></canvas>
      </div>
    </div>
  );
}
