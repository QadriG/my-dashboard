// src/components/BestTradingPairs.jsx
import React, { useEffect, useState } from "react";

export default function BestTradingPairs({ balanceData }) {
  const [pairs, setPairs] = useState([]);

  useEffect(() => {
    if (balanceData && balanceData.length > 0) {
      const item = balanceData[0];
      const positions = item.openPositions || [];
      const tradeEvents = item.tradeEvents || []; // assuming you have this field

      // Group by symbol and sum realized PnL from closed trades
      const symbolMap = {};
      tradeEvents.forEach(event => {
        const symbol = event.symbol;
        const pnl = parseFloat(event.realizedPnl) || 0;
        if (!symbolMap[symbol]) {
          symbolMap[symbol] = { symbol, profit: 0 };
        }
        symbolMap[symbol].profit += pnl;
      });

      // Sort by profit
      const sorted = Object.values(symbolMap).sort((a, b) => b.profit - a.profit);

      setPairs(sorted.slice(0, 3)); // Top 3
    }
  }, [balanceData]);

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border-2 border-emerald-400 dashboard-column sidebar-emerald overflow-hidden transition duration-300 hover:shadow-[0_0_20px_#00ff9d,_0_0_40px_#00ff9d,_0_0_60px_#00ff9d] hover:scale-105">
      <h2 className="text-lg font-semibold mb-4 text-white">Best Trading Pairs</h2>
      <ul className="text-sm space-y-2">
        {pairs.length > 0 ? (
          pairs.map((pair, i) => (
            <li key={i} className="flex justify-between">
              <span className="text-white">{pair.symbol}</span>
              <span className={`drop-shadow ${pair.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${pair.profit.toFixed(2)}
              </span>
            </li>
          ))
        ) : (
          <li className="text-gray-400 italic">No data</li>
        )}
      </ul>
    </div>
  );
}