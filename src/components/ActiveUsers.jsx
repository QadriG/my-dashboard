// src/components/ActiveUsers.jsx

import React from "react";

export default function ActiveUsers({ data }) {
  // If no data is passed, show a loading state or fallback
  if (!data) {
    return (
      <div className="dashboard-column text-center">
        <p className="text-2xl font-bold uppercase tracking-wide text-white-100">
          Active Users
        </p>
        <p className="text-lg mt-2 text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-column text-center">
      <p className="text-2xl font-bold uppercase tracking-wide text-white-100">
        Active Users
      </p>
      <p className="text-2xl font-bold mt-2">{data.count || 0}</p>
    </div>
  );
}