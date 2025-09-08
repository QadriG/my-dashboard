import React, { useEffect, useState } from "react";

export default function ActiveExchange() {
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/exchanges/list", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok && data.success) {
          // ✅ Count the number of exchanges
          setCount(data.exchanges.length);
        } else {
          throw new Error(data.error || "Failed to fetch exchanges");
        }
      } catch (err) {
        console.error("Error fetching exchanges:", err);
        setError("Unable to load exchanges");
      } finally {
        setLoading(false);
      }
    };

    fetchExchanges();
  }, []);

  return (
    <div className="dashboard-column">
      <p className="text-2xl font-bold uppercase tracking-wide text-white-100">
        Active Exchanges
      </p>

      {loading ? (
        <p className="text-lg mt-1 text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-lg mt-1 text-red-500">{error}</p>
      ) : (
        <p className="text-2xl font-bold mt-1">{count}</p>
      )}
    </div>
  );
}
