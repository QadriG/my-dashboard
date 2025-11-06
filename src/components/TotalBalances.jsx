// src/components/Admin/TotalBalances.jsx

import React, { useState, useEffect } from "react";

export default function TotalBalances({ data }) {
  // data = { total: number, admin: number }
  const [displayMode, setDisplayMode] = useState('admin'); // 'admin' or 'total'

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDisplayMode(prev => prev === 'admin' ? 'total' : 'admin');
    }, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const displayValue = displayMode === 'admin' ? (data?.admin || 0) : (data?.total || 0);
  const title = displayMode === 'admin' ? 'ADMIN BALANCE' : 'TOTAL CONNECTED';

  return (
    <div className="dashboard-column text-center">
      <p className="text-2xl font-bold uppercase tracking-wide text-white-100">
        {title}
      </p>
      <p className="text-2xl font-bold mt-2">
        ${typeof displayValue === 'number' 
          ? displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
          : "0.00"}
      </p>
    </div>
  );
}