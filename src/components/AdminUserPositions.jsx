import React from "react";
import { useParams } from "react-router-dom";
import PositionsTable from "../components/Users/PositionsTable"; // ✅ Reuse the working component

export default function AdminUserPositions() {
  const { id: userId } = useParams(); // Get userId from URL params

  return (
    <div className="ml-64 p-8 overflow-y-auto">
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6">
        <h1 className="text-3xl font-semibold drop-shadow-md">Positions for User {userId}</h1>
      </div>

      {/* ✅ Pass userId to the existing PositionsTable component */}
      <PositionsTable userId={parseInt(userId, 10)} />
    </div>
  );
}