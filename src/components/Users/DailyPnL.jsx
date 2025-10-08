import React, { useEffect, useRef, useState } from "react";

export default function DailyPnL({ userId, balanceData }) {
  console.log("DailyPnL received props:", { userId, balanceData });
  const tableRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [range, setRange] = useState("30d");

  useEffect(() => {
    console.log("DailyPnL received balanceData:", balanceData);
    if (balanceData && typeof balanceData === "object" && "availableFunds" in balanceData) {
      const availableFunds = balanceData.availableFunds || 0;
      setRows([
        {
          coin: "USDT",
          balance: parseFloat(availableFunds),
          pnl: 0,
          pnlPercent: "0",
          date: new Date().toLocaleDateString(),
        },
      ]);
    } else {
      fetchDailyPnL(range);
    }
  }, [balanceData, range]);

  async function fetchDailyPnL(selectedRange = "30d") {
    try {
      const res = await fetch(`/api/user/daily-pnl?range=${selectedRange}`, {
        credentials: "include",
      });
      const data = await res.json();
      console.log("DailyPnL fetch response:", data);
      setRows(
        Array.isArray(data)
          ? data.map((item) => ({
              coin: item.coin || "USDT",
              balance: parseFloat(item.balance) || 0,
              pnl: parseFloat(item.pnl) || 0,
              pnlPercent: item.pnlPercent || "0",
              date: item.date || new Date().toLocaleDateString(),
            }))
          : []
      );
    } catch (err) {
      console.error("Error fetching daily pnl:", err);
      setRows([]);
    }
  }

  useEffect(() => {
    const interval = setInterval(() => fetchDailyPnL(range), 10000);
    return () => clearInterval(interval);
  }, [range]);

  useEffect(() => {
    if (!tableRef.current) return;
    const trs = tableRef.current.querySelectorAll("tbody tr");
    for (let i = 0; i < trs.length - 1; i++) {
      const current = parseFloat(trs[i].children[1].textContent);
      const next = parseFloat(trs[i + 1].children[1].textContent);
      if (current > next) trs[i].classList.add("bg-green-600", "text-white");
      else if (current < next) trs[i].classList.add("bg-red-600", "text-white");
      else trs[i].classList.remove("bg-green-600", "bg-red-600", "text-white");
    }
  }, [rows]);

  return (
    <div className="dashboard-column p-6 text-center border-emerald-400">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white-300 drop-shadow">Daily Balance & P&L</h2>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          className="bg-emerald-900/80 text-white px-2 py-1 rounded text-sm border border-emerald-500"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>
      <table className="w-full text-sm text-left" ref={tableRef}>
        <thead className="bg-emerald-900/80 text-white font-semibold">
          <tr>
            <th className="py-1 px-2">Coin</th>
            <th className="py-1 px-2">Balance</th>
            <th className="py-1 px-2">PnL</th>
            <th className="py-1 px-2">PnL%</th>
            <th className="py-1 px-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.length > 0 ? (
            rows.map((row, idx) => (
              <tr key={idx}>
                <td className="py-1 px-2">{row.coin}</td>
                <td className="py-1 px-2">{row.balance.toFixed(2)}</td>
                <td className="py-1 px-2">{row.pnl.toFixed(2)}</td>
                <td className="py-1 px-2">{row.pnlPercent}%</td>
                <td className="py-1 px-2">{row.date}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-2 text-gray-400">Loading data...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}