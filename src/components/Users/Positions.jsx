import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
// Remove useLocation and AdminSidebar/UserSidebar imports if not used elsewhere in this component
// import { useLocation } from "react-router-dom";
// import AdminSidebar from "../../components/Sidebar.jsx";
// import UserSidebar from "./Sidebar.jsx";

export default function PositionsTable({ userId, isAdmin = false }) { // Accept isAdmin prop instead of deriving from location
  const { isDarkMode } = useTheme();
  // const location = useLocation(); // Remove if not needed
  // const adminView = location.state?.adminView || false; // Remove if not needed

  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPositions = async () => {
      if (!userId) {
        setLoading(false);
        setError("User ID is required");
        return;
      }
      try {
        // ✅ Use /api/users/:id/positions if isAdmin, otherwise /api/positions/active
        const endpoint = isAdmin ? `/api/users/${userId}/positions` : '/api/positions/active';
        const res = await fetch(endpoint, { credentials: 'include' });
        const data = await res.json();
        if (res.ok && data.success) {
          setPositions(data.positions || []);
        } else {
          setError(data.message || data.error || "Failed to fetch positions");
        }
      } catch (err) {
        console.error("Fetch positions error:", err);
        setError("Unable to load positions");
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if userId is provided
    if (userId) fetchPositions();
  }, [userId, isAdmin]); // ✅ Add isAdmin to dependency

  // Remove the sidebar rendering part
  // const SidebarComponent = adminView ? AdminSidebar : UserSidebar;
  // return (
  //   <div>
  //     <SidebarComponent ... />
  //     ...

  return (
    <div className="p-6"> {/* Add padding/margin if needed for layout */}
      <div className="flex justify-between mb-4 flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Filter by Pair:</label>
          <select className="px-3 py-2 rounded border w-48 bg-black text-white border-gray-700">
            <option>All</option>
            {[...new Set(positions.map(p => p.symbol))].map((sym, i) => (
              <option key={i}>{sym}</option>
            ))}
          </select>
        </div>
        <div className="space-x-2">
          <button className="px-4 py-2 rounded-full text-sm bg-green-500">Open Positions</button>
          <button className="px-4 py-2 rounded-full text-sm bg-red-500" disabled>No Closed</button>
        </div>
      </div>

      <div className="p-[2px] rounded-xl bg-gradient-to-r from-green-400 to-red-500 shadow-[0_0_12px_4px_rgba(34,197,94,0.6)]">
        <div className="rounded-xl bg-black/30 backdrop-blur-md p-6 transition-transform duration-300 hover:scale-[1.01]">
          <table className="w-full">
            <thead className={`rounded-xl ${isDarkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-black"}`}>
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Symbol</th>
                <th className="px-4 py-2 text-left">Side</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Order Value</th>
                <th className="px-4 py-2 text-left">Open Price</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Open Date</th>
              </tr>
            </thead>
            <tbody className={`${isDarkMode ? "bg-black/20" : "bg-white/5"}`}>
              {positions.length > 0 ? (
                positions.map((pos, i) => (
                  <tr key={i} className="border-t border-gray-600">
                    <td className="px-4 py-2">{i + 1}</td>
                    <td className="px-4 py-2">{pos.symbol}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        pos.side === 'buy' || pos.side === 'long'
                          ? 'bg-green-400/30 text-green-200 border border-green-300'
                          : 'bg-red-400/30 text-red-200 border border-red-300'
                      }`}>
                        {pos.side === 'buy' ? 'Buy' : pos.side === 'sell' ? 'Sell' : pos.side}
                      </span>
                    </td>
                    <td className="px-4 py-2">{(pos.size || 0).toFixed(4)}</td>
                    <td className="px-4 py-2">${((pos.size || 0) * (pos.entryPrice || 0)).toFixed(2)}</td>
                    <td className="px-4 py-2">${pos.entryPrice?.toFixed(2)}</td>
                    <td className="px-4 py-2 text-green-400">{pos.status}</td>
                    <td className="px-4 py-2">
                      {new Date(pos.updateTime || Date.now()).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-gray-400">
                    {loading ? "Loading..." : error ? error : "No positions found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between items-center px-4 py-2 mt-2">
        <select className="px-2 py-1 rounded border bg-black text-white border-gray-700">
          {[10, 20, 30, 40].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <div className={`flex gap-1 ${isDarkMode ? "text-white" : "text-black"}`}>
          <button className="px-2 py-1 bg-gray-700 rounded text-sm disabled:opacity-50" disabled>« Prev</button>
          <button className="px-2 py-1 bg-blue-600 rounded text-sm">1</button>
          <button className="px-2 py-1 bg-gray-700 rounded text-sm disabled:opacity-50" disabled>Next »</button>
        </div>
      </div>
    </div>
  );
}