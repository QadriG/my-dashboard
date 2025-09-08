import React, { useEffect, useState } from "react";

export default function TotalBalances({ adminView = false }) {
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTotalBalance = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/balances/total${adminView ? "?admin=true" : ""}`,
          { credentials: "include" }
        );
        const data = await res.json();
        if (res.ok && data.success) {
          setTotal(data.total);
        } else {
          setError(data.error || "Failed to fetch total balance");
        }
      } catch (err) {
        console.error("Error fetching total balance:", err);
        setError("Unable to load total balance");
      } finally {
        setLoading(false);
      }
    };

    fetchTotalBalance();
  }, [adminView]);

  return (
    <div className="dashboard-column text-center">
      <p className="text-2xl font-bold uppercase tracking-wide text-white-100">
        TOTAL BALANCE
      </p>
      {loading ? (
        <p className="text-lg mt-2 text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-lg mt-2 text-red-500">{error}</p>
      ) : (
        <p className="text-2xl font-bold mt-2">
          ${total !== null ? total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
        </p>
      )}
    </div>
  );
}
