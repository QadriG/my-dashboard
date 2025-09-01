import React, { useState } from "react";
import "../styles/globals.css";
import "../styles/sidebar.css";

export default function ApiDetails() {
  const [exchange, setExchange] = useState("binance");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");

  const handleSave = () => {
    console.log("Saving API details:", { exchange, apiKey, apiSecret, passphrase });
    alert("API Key saved! Check console for details.");
  };

  return (
    <main className="ml-64 flex-1 p-8 overflow-y-auto space-y-10 text-white">
      {/* Title */}
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6">
        <h1 className="text-3xl font-semibold drop-shadow-md">
          API Key Management
        </h1>
      </div>

      {/* Info Box */}
      <div className="glass-box neon-hover rounded-xl p-6 w-full border border-red-400 mb-10 transition duration-300">
        <p className="font-semibold mb-2">API Details</p>
        <p>
          We will store your API secret encrypted, so that you will not see your
          secret key again.
        </p>
        <p className="mt-2">Please add our IP to whitelist at your exchange:</p>
        <p className="font-mono bg-green-800 text-white px-3 py-1 rounded inline-block mt-1 transition-all duration-300 hover:shadow-[0_0_10px_var(--neon-color)]">
          164.92.252.132
        </p>
      </div>

      {/* Form */}
      <div className="glass-box neon-hover rounded-xl p-6 w-full border border-red-400 transition duration-300">
        {/* Exchange */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Exchange</label>
          <select
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:shadow-[0_0_10px_rgba(0,246,255,0.5)]"
          >
            <option value="binance">Binance</option>
            <option value="kucoin">KuCoin</option>
            <option value="bybit">Bybit</option>
            <option value="okx">OKX</option>
          </select>
        </div>

        {/* API Key */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">API Key</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API key"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:shadow-[0_0_10px_rgba(0,246,255,0.5)]"
          />
        </div>

        {/* API Secret */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">API Secret</label>
          <input
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Enter API secret"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:shadow-[0_0_10px_rgba(0,246,255,0.5)]"
          />
        </div>

        {/* Passphrase */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Passphrase</label>
          <input
            type="text"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Passphrase for this key"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:shadow-[0_0_10px_rgba(0,246,255,0.5)]"
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="neon-button mt-4"
        >
          Save API Key
        </button>
      </div>
    </main>
  );
}
