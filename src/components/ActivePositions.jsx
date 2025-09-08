import React, { useEffect, useState } from "react";

export default function ActivePositions() {
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivePositions = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/positions/active", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setCount(data.total);
        } else {
          setError(data.error || "Failed to fetch positions");
        }
      } catch (err) {
        console.error("Error fetching positions:", err);
        setError("Unable to load positions");
      } finally {
        setLoading(false);
      }
    };

    fetchActivePositions();
  }, []);

  return (
    <div className="dashboard-column">
      <p className="text-2xl font-bold uppercase tracking-wide text-white-100">
        Active Positions
      </p>
      {loading ? (
        <p className="text-lg mt-1 text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-lg mt-1 text-red-500">{error}</p>
      ) : (
        <p className="text-2xl font-bold mt-1">{count !== null ? count : 0}</p>
      )}
    </div>
  );
}
