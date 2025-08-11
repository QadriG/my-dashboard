import React, { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

export default function BalanceGraph() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const ctx = canvasRef.current.getContext('2d');
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    const balanceData = [1000, 1075, 1120, 1060, 1220, 1300];
    const balancePointColors = balanceData.map((val, i) => (i === 0 ? 'white' : val >= balanceData[i - 1] ? 'green' : 'red'));

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jul 1', 'Jul 5', 'Jul 10', 'Jul 15', 'Jul 20', 'Jul 25'],
        datasets: [{
          label: 'Balance',
          data: balanceData,
          fill: true,
          backgroundColor: 'rgba(59,130,246,0.1)',
          borderColor: 'rgba(59,130,246,1)',
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: balancePointColors,
          pointRadius: 5,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        aspectRatio: 4,
        animation: false,
        scales: {
          y: {
            beginAtZero: false,
            min: 900,
            max: 1400,
            ticks: { callback: value => `$${value}`, color: '#ffffff', font: { size: 12 } },
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          x: { ticks: { color: '#ffffff', font: { size: 12 } }, grid: { color: 'rgba(255,255,255,0.05)' } }
        },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `$${ctx.parsed.y}` }, bodyColor: '#ffffff', titleColor: '#ffffff' } }
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
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-4 max-h-[75px] border-2 border-cyan-400 dashboard-column sidebar-cyan text-white overflow-hidden transition duration-300 hover:shadow-[0_0_20px_#00ffff,_0_0_40px_#00ffff,_0_0_60px_#00ffff] hover:scale-105">
      <h2 className="text-lg font-semibold mb-2 text-white">Balance Graph</h2>
      <div className="h-[75px]">
        <canvas ref={canvasRef} className="w-full h-[75px] bg-transparent text-white"></canvas>
      </div>
    </div>
  );
}
