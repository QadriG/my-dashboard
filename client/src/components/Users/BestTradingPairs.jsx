import React from "react";

export default function BestTradingPairs() {
  return (
    <div className="dashboard-column p-6 text-center border-emerald-400">
      <h2 className="text-lg font-semibold mb-4 text-white-300 drop-shadow">Best Trading Pairs</h2>
      <ul className="text-sm space-y-2">
        <li className="flex justify-between"><span>BTC/USDT:USDT</span><span className="text-white-300 drop-shadow">$125.28</span></li>
        <li className="flex justify-between"><span>AVAX/USDT:USDT</span><span className="text-white-300 drop-shadow">$57.68</span></li>
        <li className="flex justify-between"><span>LINK/USDT:USDT</span><span className="text-white-300 drop-shadow">$39.69</span></li>
        <li className="flex justify-between"><span>HYPE/USDT:USDT</span><span className="text-white-300 drop-shadow">$38.25</span></li>
        <li className="flex justify-between"><span>ICP/USDT:USDT</span><span className="text-white-300 drop-shadow">$24.82</span></li>
      </ul>
    </div>
  );
}