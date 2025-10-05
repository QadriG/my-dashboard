import React, { useState, useEffect } from "react";

export default function ApiDetails() {
  const [exchange, setExchange] = useState("");
  const [exchanges, setExchanges] = useState([]);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/exchanges/list", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // ✅ cookie carries the token
        });

        const data = await res.json();

        if (res.ok && data.success && data.exchanges) {
          setExchanges(data.exchanges);
          setExchange(data.exchanges[0]?.id || "");
        } else {
          setError("❌ Failed to load exchanges");
        }
      } catch (err) {
        setError("❌ Error fetching exchanges");
      } finally {
        setFetching(false);
      }
    };

    fetchExchanges();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/save-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exchange,
          apiKey,
          apiSecret,
          passphrase,
        }),
        credentials: "include", // ✅ cookie auth
      });

      const data = await res.json();

      if (res.ok && data.message) {
        setMessage("✅ API key saved successfully.");
        setApiKey("");
        setApiSecret("");
        setPassphrase("");
      } else {
        setMessage(`❌ ${data.message || "Error saving API key."}`);
      }
    } catch (err) {
      setMessage("❌ Server error. Please try again later.");
    }

    setLoading(false);
  };

  return (
    <main className="ml-64 flex-1 p-8 overflow-y-auto space-y-10 text-white">
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6">
        <h1 className="text-3xl font-semibold drop-shadow-md">API Key Management</h1>
      </div>

      <div className="w-full bg-black/30 backdrop-blur-md border-2 border-red-400 text-white p-6 rounded-xl mb-10">
        <p className="font-semibold mb-2">API Details</p>
        <p>We will store your API secret encrypted, so that you will not see your secret key again.</p>
        <p className="mt-2">Please add our IP to whitelist at your exchange:</p>
        <p className="font-mono bg-green-800 text-white px-3 py-1 rounded inline-block mt-1">
          164.92.252.132
        </p>
      </div>

      <div className="w-full bg-black/30 backdrop-blur-md border-2 border-red-400 text-white rounded-xl px-6 py-6">
        <div className="mb-4">
          <label className="block mb-1 font-semibold text-white">Exchange</label>
          {fetching ? (
            <p>Loading exchanges...</p>
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : (
            <select
              value={exchange}
              onChange={(e) => setExchange(e.target.value)}
              className="w-full border border-gray-300 bg-white text-black rounded px-3 py-2"
            >
              {exchanges.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-white">API Key</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API key"
            className="w-full border border-gray-300 bg-white text-black rounded px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-white">API Secret</label>
          <input
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            placeholder="Enter API secret"
            className="w-full border border-gray-300 bg-white text-black rounded px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 font-semibold text-white">Passphrase</label>
          <input
            type="text"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Passphrase for this key"
            className="w-full border border-gray-300 bg-white text-black rounded px-3 py-2"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className={`mt-4 px-4 py-2 rounded font-bold ${
            loading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-green-500 text-white shadow hover:shadow-lg"
          }`}
        >
          {loading ? "Saving..." : "Save API Key"}
        </button>

        {message && <p className="mt-3 text-sm">{message}</p>}
      </div>
    </main>
  );
}
