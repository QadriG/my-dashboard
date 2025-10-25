// src/components/TotalBalances.jsx

import React from "react";

export default function TotalBalances({ data }) {
  // If no data is passed, show a loading state or fallback
  if (!data) {
    return (
      <div className="dashboard-column text-center">
        <p className="text-2xl font-bold uppercase tracking-wide text-white-100">
          TOTAL BALANCE
        </p>
        <p className="text-2xl font-bold mt-2">$0.00</p>
      </div>
    );
  }

  return (
    <div className="dashboard-column text-center">
      <p className="text-2xl font-bold uppercase tracking-wide text-white-100">
        TOTAL BALANCE
      </p>
      <p className="text-2xl font-bold mt-2">
        ${data.total !== null ? data.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
      </p>
    </div>
  );
}