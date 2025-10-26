// src/components/Admin/TotalBalances.jsx
import React, { useState, useEffect } from "react";

export default function TotalBalances({ data }) {
  // data is aggregatedData.totalBalances from backend (total connected)
  const [displayMode, setDisplayMode] = useState('total'); // 'admin' or 'total'
  const [adminBalance, setAdminBalance] = useState(0);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);

  // Fetch admin's own balance periodically
  useEffect(() => {
    let intervalId;
    const fetchAdminBalance = async () => {
      setIsLoadingAdmin(true);
      try {
        // Fetch admin's own exchange data to calculate balance
        // This assumes your existing fetchUserExchangeData can be used for the admin user ID
        // You might have a dedicated endpoint like /api/admin/my-balance, but this reuses existing logic.
        const res = await fetch('/api/admin/dashboard', { // Or a specific endpoint if you prefer
          credentials: 'include',
        });
        const result = await res.json();
        if (res.ok && result.success && result.dashboard) {
          // Sum up totalBalance from each exchange account in the dashboard data
          let totalOwnBalance = 0;
          if (result.dashboard.balances && Array.isArray(result.dashboard.balances)) {
            result.dashboard.balances.forEach(acc => {
              totalOwnBalance += acc.balance?.totalBalance || 0;
            });
          }
          setAdminBalance(totalOwnBalance);
        } else {
          console.warn("Failed to fetch admin's own balance data:", result.message);
          setAdminBalance(0);
        }
      } catch (err) {
        console.error("Error fetching admin's own balance:", err);
        setAdminBalance(0);
      } finally {
        setIsLoadingAdmin(false);
      }
    };

    // Fetch immediately on mount
    fetchAdminBalance();

    // Set up interval to fetch every 60 seconds
    intervalId = setInterval(fetchAdminBalance, 60000);

    // Clear interval on unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Determine which value to display
  const displayValue = displayMode === 'admin' ? adminBalance : (data?.total || 0);

  // Toggle display mode periodically (every 60 seconds, independent of balance fetch)
  // Only start toggling after the first admin balance fetch is done
  useEffect(() => {
    if (isLoadingAdmin) return; // Don't start toggling until we have the admin balance at least once

    const toggleInterval = setInterval(() => {
      setDisplayMode(prevMode => prevMode === 'admin' ? 'total' : 'admin');
    }, 60000); // Toggle every 60 seconds

    return () => clearInterval(toggleInterval);
  }, [isLoadingAdmin]); // Re-run if isLoadingAdmin changes

  return (
    <div className="dashboard-column text-center">
      <p className="text-2xl font-bold uppercase tracking-wide text-white-100">
        {displayMode === 'admin' ? 'ADMIN BALANCE' : 'TOTAL CONNECTED'}
      </p>
      <p className="text-2xl font-bold mt-2">
        {/* Format the number */}
        ${typeof displayValue === 'number' ? displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
      </p>
    </div>
  );
}