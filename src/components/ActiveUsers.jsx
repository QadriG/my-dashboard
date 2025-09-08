import React, { useEffect, useState } from "react";

export default function ActiveUsers() {
  const [count, setCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/users/active", {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setCount(data.total);
        } else {
          setError(data.error || "Failed to fetch active users");
        }
      } catch (err) {
        console.error("Error fetching active users:", err);
        setError("Unable to load active users");
      } finally {
        setLoading(false);
      }
    };

    fetchActiveUsers();
  }, []);

  return (
    <div className="dashboard-column text-center">
      <p className="text-2xl font-bold uppercase tracking-wide text-white-100">
        Active Users
      </p>
      {loading ? (
        <p className="text-lg mt-2 text-gray-400">Loading...</p>
      ) : error ? (
        <p className="text-lg mt-2 text-red-500">{error}</p>
      ) : (
        <p className="text-2xl font-bold mt-2">{count !== null ? count : 0}</p>
      )}
    </div>
  );
}
