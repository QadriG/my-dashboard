import React, { useEffect, useRef } from "react";

export default function DailyPnL() {
  const tableRef = useRef(null);

  useEffect(() => {
    const rows = tableRef.current.querySelectorAll("tbody tr");
    for (let i = 0; i < rows.length - 1; i++) {
      const current = parseFloat(rows[i].children[1].textContent);
      const next = parseFloat(rows[i + 1].children[1].textContent);
      if (current > next) {
        rows[i].classList.add("bg-green-600", "text-white");
      } else if (current < next) {
        rows[i].classList.add("bg-red-600", "text-white");
      }
    }
  }, []);

  return (
    <div className="dashboard-column p-6 text-center border-emerald-400">
      <h2 className="text-lg font-semibold mb-4 text-white-300 drop-shadow">Daily Balance & P&L</h2>
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
          <tr><td className="py-1 px-2">USDT</td><td className="py-1 px-2">1973.48</td><td className="py-1 px-2">1.42</td><td className="py-1 px-2">0.07 %</td><td className="py-1 px-2">06/20/2025</td></tr>
          <tr><td className="py-1 px-2">USDT</td><td className="py-1 px-2">1970.84</td><td className="py-1 px-2">0.00</td><td className="py-1 px-2">0.00 %</td><td className="py-1 px-2">06/19/2025</td></tr>
          <tr><td className="py-1 px-2">USDT</td><td className="py-1 px-2">1966.83</td><td className="py-1 px-2">0.00</td><td className="py-1 px-2">0.00 %</td><td className="py-1 px-2">06/18/2025</td></tr>
          <tr><td className="py-1 px-2">USDT</td><td className="py-1 px-2">1978.63</td><td className="py-1 px-2">-4.19</td><td className="py-1 px-2">-0.21 %</td><td className="py-1 px-2">06/17/2025</td></tr>
          <tr><td className="py-1 px-2">USDT</td><td className="py-1 px-2">1976.90</td><td className="py-1 px-2">-5.89</td><td className="py-1 px-2">-0.30 %</td><td className="py-1 px-2">06/16/2025</td></tr>
          <tr><td className="py-1 px-2">USDT</td><td className="py-1 px-2">1977.22</td><td className="py-1 px-2">0.00</td><td className="py-1 px-2">0.00 %</td><td className="py-1 px-2">06/15/2025</td></tr>
          <tr><td className="py-1 px-2">USDT</td><td className="py-1 px-2">1972.42</td><td className="py-1 px-2">-1.13</td><td className="py-1 px-2">-0.06 %</td><td className="py-1 px-2">06/14/2025</td></tr>
          <tr><td className="py-1 px-2">USDT</td><td className="py-1 px-2">1968.23</td><td className="py-1 px-2">0.00</td><td className="py-1 px-2">0.00 %</td><td className="py-1 px-2">06/13/2025</td></tr>
          <tr><td className="py-1 px-2">USDT</td><td className="py-1 px-2">1968.90</td><td className="py-1 px-2">-4.89</td><td className="py-1 px-2">-0.25 %</td><td className="py-1 px-2">06/12/2025</td></tr>
          <tr><td className="py-1 px-2">USDT</td><td className="py-1 px-2">1968.95</td><td className="py-1 px-2">3.56</td><td className="py-1 px-2">0.18 %</td><td className="py-1 px-2">06/11/2025</td></tr>
        </tbody>
      </table>
    </div>
  );
}