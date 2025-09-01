import React, { useState, useRef, useEffect } from "react";
import "../styles/globals.css";
import "../styles/sidebar.css";

export default function ManualPush() {
  const [users] = useState([
    { id: 0, name: "System User", balance: 15.35497025 },
    { id: 4, name: "Tayub", balance: 264.97476998 },
    { id: 6, name: "Charles Crawford", balance: 1077.82397781 },
    { id: 10, name: "Master Copy Trader", balance: 1231.17703507 },
    { id: 16, name: "Charles Bybit Main", balance: 1063.44955248 },
    { id: 106, name: "Charles BingX", balance: 368.5895 },
    { id: 148, name: "Charles", balance: 650.24124483 },
    { id: 238, name: "Charles", balance: 344.19886136 },
    { id: 479, name: "Willems Nikki", balance: 590.3681 },
    { id: 495, name: "Tiago Wottrich", balance: 500.26249035 },
  ]);

  const textareaRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  const [jsonInput, setJsonInput] = useState(`{
  "id": "1L",
  "exchange": "bybit",
  "password": "5555",
  "action": "buy",
  "market_position": "long",
  "symbol": "BTC/USDT:USDT",
  "qty": "3",
  "tp": 3
}`);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handlePush = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      console.log("Pushed JSON:", parsed);
      alert("Manual push triggered! Check console for JSON output.");
    } catch (err) {
      console.error("Invalid JSON:", err);
      alert("Invalid JSON! Please fix and try again.");
    }
  };

  return (
    <main className="ml-64 flex-1 p-8 overflow-y-auto space-y-10">
      {/* Title */}
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6">
        <h1 className="text-3xl font-semibold drop-shadow-md">Manual Push</h1>
      </div>

      {/* Push JSON Section */}
      <div className="flex flex-col lg:flex-row gap-4 w-full">
        {/* JSON Input */}
        <div className="glass-box neon-hover rounded-xl p-6 w-full border border-cyan-400 transition duration-300">
          <textarea
            ref={textareaRef}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            className="w-full h-60 border rounded p-4 font-mono resize-none bg-white text-black dark:bg-black dark:text-white"
          />
          <button
            onClick={handlePush}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-10 rounded transition"
          >
            Push
          </button>
        </div>

        {/* Users List */}
        <div className="glass-box neon-hover rounded-xl p-6 w-full border border-cyan-400 transition duration-300">
          <div className="max-h-[30rem] overflow-y-auto space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="border border-cyan-400 rounded-lg p-2 transition hover:scale-[1.01] neon-row-hover"
              >
                {user.id} : {user.name} ${user.balance}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
