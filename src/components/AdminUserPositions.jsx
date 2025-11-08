// src/components/Admin/AdminUserPositions.jsx
import React from "react";
import { useParams } from "react-router-dom"; // To get userId from URL
import Layout from "./Layout"; // Use the main admin layout
import PositionsTable from "../components/Users/Positions"; // Use the refactored component
import { useAdminAuth } from "../hooks/useAdminAuth"; // For logout

export default function AdminUserPositions() {
  const { userId } = useParams(); // Extract userId from /admin/users/:userId/positions
  const { logout } = useAdminAuth();

  return (
    <Layout onLogout={logout}>
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6">
        <h1 className="text-3xl font-semibold drop-shadow-md">Positions for User {userId}</h1>
      </div>
      {/* Pass userId and isAdmin=true to PositionsTable */}
      <PositionsTable userId={parseInt(userId, 10)} isAdmin={true} />
    </Layout>
  );
}