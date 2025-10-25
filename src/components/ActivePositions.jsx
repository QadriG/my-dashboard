// src/components/ActivePositions.jsx

import React from "react";

export default function ActivePositions({ data }) {
  // If no data is passed, show a loading state or fallback
  if (!data) {
    return (
      <div className="dashboard-column">
        <p className="text-2xl font-bold uppercase tracking-wide text-white-100">
          Active Positions
        </p>
        <p className="text-lg mt-1 text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-column">
      <p className="text-2xl font-bold uppercase tracking-wide text-white-100">
        Active Positions
      </p>
      <p className="text-2xl font-bold mt-1">{data.count || 0}</p>
    </div>
  );
}