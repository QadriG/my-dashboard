import React, { useEffect, useState } from "react";

export default function BestTradingPairs({ isDarkMode }) {
  const [pairs, setPairs] = useState([]);

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/best-pairs"); // 🔗 your backend endpoint
        const data = await res.json();
        setPairs(data); // expecting array of { symbol, value }
      } catch (error) {
        console.error("Error fetching best trading pairs:", error);
      }
    };

    fetchPairs();
  }, []);

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-xl p-6 border-2 border-emerald-400 dashboard-column sidebar-emerald overflow-hidden transition duration-300 hover:shadow-[0_0_20px_#00ff9d,_0_0_40px_#00ff9d,_0_0_60px_#00ff9d] hover:scale-105">
      <h2
        className="text-lg font-semibold mb-4"
        style={{ color: isDarkMode ? "#fff" : "#000" }}
      >
        Best Trading Pairs
      </h2>
      <ul className="text-sm space-y-2">
        {pairs.length > 0 ? (
          pairs.map((pair, i) => (
            <li key={i} className="flex justify-between">
              <span style={{ color: isDarkMode ? "#fff" : "#000" }}>
                {pair.symbol}
              </span>
              <span
                className="drop-shadow"
                style={{ color: isDarkMode ? "#fff" : "#000" }}
              >
                ${pair.value}
              </span>
            </li>
          ))
        ) : (
          <li className="text-gray-400 italic">Loading...</li>
        )}
      </ul>
    </div>
  );
}
