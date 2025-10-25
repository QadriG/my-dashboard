// src/components/Admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { useNavigate } from "react-router-dom";
import "../styles/globals.css";
import Layout from "./Layout";

// Import Dashboard Card Components
import ActiveUsers from "../components/ActiveUsers";
import ActiveExchange from "../components/ActiveExchange";
import ActivePositions from "../components/ActivePositions";
import TotalBalances from "../components/TotalBalances";
import Profit from "../components/Profit";
import UPL from "../components/UPL";
import FundsDistribution from "../components/FundsDistribution";
import BalanceGraph from "../components/BalanceGraph";
import WeeklyRevenue from "../components/WeeklyRevenue";
import DailyPnL from "../components/DailyPnL";
import BestTradingPairs from "../components/BestTradingPairs";
import OpenPositions from "../components/OpenPositions";

// ---------------------
// LightModeToggle
// ---------------------
export function LightModeToggle({ className, style }) {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle ${className || ""}`}
      style={style}
    >
      {isDarkMode ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

// ---------------------
// AdminDashboard
// ---------------------
export default function AdminDashboard() {
  const { isDarkMode } = useTheme();
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  // --- Centralized state for card data ---
  const [cardsData, setCardsData] = useState({
    // Top 4 Aggregated Cards
    activeUsers: null,
    activeExchange: null,
    activePositions: null,
    totalBalances: null,
    // Standard Cards (need detailed data)
    profit: null,
    upl: null,
    fundsDistribution: null,
    balanceGraph: null,
    weeklyRevenue: null,
    dailyPnL: null,
    bestTradingPairs: null,
    openPositions: null,
  });

  // --- Mimic user dashboard's balanceData structure ---
  // This will be an array where each element represents an "exchange account"
  // containing balance info and nested positions/orders.
  const [balanceData, setBalanceData] = useState([]); // This is crucial for standard cards
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // JWT check on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/auth/check-auth", {
          method: "GET",
          credentials: "include",
          headers: { "Cache-Control": "no-store" },
        });
        const data = await res.json();
        if (!res.ok || data.role !== "admin") logout();
      } catch {
        logout();
      }
    };
    checkAuth();
  }, [logout]);

  // --- Fetch Aggregated and Detailed Data for Cards ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch aggregated data and detailed user data from the single admin endpoint
        const res = await fetch("http://localhost:5000/api/admin/users", {
          credentials: "include",
        });
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.message || "Failed to fetch admin dashboard data");
        }

        // 2. --- Prepare data for TOP 4 AGGREGATED CARDS ---
        // Directly use the aggregated object returned by the backend
        const aggregatedData = result.aggregated || {
          activeUsers: { count: 0 },
          activeExchange: { count: 0, exchanges: {} },
          activePositions: { count: 0, totalSize: 0 },
          totalBalances: { total: 0, breakdown: {} }
        };

        // 3. --- Prepare data for STANDARD CARDS (like FundsDistribution, BalanceGraph) ---
        // We need to mimic the structure from the user dashboard's /api/users/dashboard endpoint.
        // The user dashboard gets an array like:
        // [
        //   {
        //     exchange: "...",
        //     type: "...",
        //     balance: { totalBalance: ..., available: ..., used: ... },
        //     openPositions: [...],
        //     openOrders: [...],
        //     error: null
        //   },
        //   ...
        // ]

        // Our backend's `/api/admin/users` now returns `users` array.
        // Each user has `balanceData` (array from fetchUserExchangeData) and summary fields (free, used, total).
        // Let's flatten this to create a list of "exchange accounts" for the dashboard cards.
        // We'll aggregate balances and positions from all users.
        const flattenedExchangeAccounts = [];

        // Aggregate data across all users to pass to standard cards
        let totalProfit = 0;
        let totalUPL = 0;
        let totalLongUPL = 0;
        let totalShortUPL = 0;
        let totalLongValue = 0;
        let totalShortValue = 0;
        let totalBalanceForCards = 0; // For FundsDistribution-like calcs if needed directly
        let aggregatedPositionsForCards = [];
        let aggregatedBalancesForCards = {}; // { 'USDT': { total: ..., free: ..., used: ... }, ... }

        if (result.users && Array.isArray(result.users)) {
            result.users.forEach(user => {
                // Add user's summary balances to aggregated balances for cards
                // Assuming user object now has free, used, total from backend aggregation
                 totalBalanceForCards += user.total || 0;
                 // Note: For more granular asset balances, you'd iterate user.balanceData[].balance.balances

                if (user.balanceData && Array.isArray(user.balanceData)) {
                    user.balanceData.forEach(exchangeAccount => {
                         // Push a transformed version of each user's exchange account data
                        // This mimics the structure from user dashboard's fetch
                        flattenedExchangeAccounts.push({
                            exchange: exchangeAccount.exchange,
                            type: exchangeAccount.type,
                            balance: exchangeAccount.balance, // This should have totalBalance, available, used
                            openPositions: exchangeAccount.openPositions || [],
                            openOrders: exchangeAccount.openOrders || [], // If you have this
                            error: exchangeAccount.error
                        });

                        // Aggregate for Profit/UPL cards (example logic)
                        const positions = exchangeAccount.openPositions || [];
                        positions.forEach(pos => {
                            const notional = (pos.size || 0) * (pos.entryPrice || 0);
                            const upl = parseFloat(pos.unrealizedPnl) || 0;
                            const side = (pos.side || '').toLowerCase();
                            if (side === 'buy' || side === 'long') {
                                totalLongValue += notional;
                                totalLongUPL += upl;
                            } else if (side === 'sell' || side === 'short') {
                                totalShortValue += notional;
                                totalShortUPL += upl;
                            }
                        });

                        // Aggregate balances if needed by other cards (e.g., FundsDistribution if it parsed balanceData)
                         const balances = exchangeAccount.balance?.balances || {};
                         Object.entries(balances).forEach(([asset, balanceInfo]) => {
                           if (!aggregatedBalancesForCards[asset]) {
                             aggregatedBalancesForCards[asset] = { total: 0, free: 0, used: 0 };
                           }
                           aggregatedBalancesForCards[asset].total += balanceInfo.total || 0;
                           aggregatedBalancesForCards[asset].free += balanceInfo.free || 0;
                           aggregatedBalancesForCards[asset].used += balanceInfo.used || 0;
                         });

                         // Collect positions for cards like OpenPositions, BestTradingPairs if they use balanceData
                         aggregatedPositionsForCards.push(...(exchangeAccount.openPositions || []));
                    });
                }
            });
        }

        // Calculate total UPL and Profit-like values
        totalUPL = totalLongUPL + totalShortUPL;
        // Profit calc might be different, this is just an example using UPL
        totalProfit = totalUPL; // Or derive from daily PnL snapshots if available

        // Prepare data for standard cards
        // Some cards might need specific aggregated data objects
        const profitData = {
            total: totalBalanceForCards, // Or a derived profit value
            long: totalLongValue,
            short: totalShortValue,
            // ... other fields Profit component might need
        };

        const uplData = {
            total: totalUPL,
            totalPercent: totalBalanceForCards > 0 ? (totalUPL / totalBalanceForCards) * 100 : 0,
            long: totalLongUPL,
            longPercent: totalBalanceForCards > 0 ? (totalLongUPL / totalBalanceForCards) * 100 : 0,
            short: totalShortUPL,
            shortPercent: totalBalanceForCards > 0 ? (totalShortUPL / totalBalanceForCards) * 100 : 0,
        };

        // FundsDistribution might look at totalBalanceForCards and aggregatedBalancesForCards
        // or parse the flattenedExchangeAccounts if it's designed that way.
        // For now, pass the flattened data which is the closest equivalent to user's balanceData.
        const fundsData = {
             // If FundsDistribution expects specific aggregated values, put them here
             // Otherwise, it will parse balanceData.
             totalBalance: totalBalanceForCards,
             // available, long, short, totalPositions would need to be calculated based on your logic
             // This is a placeholder. You might need to refine this based on FundsDistribution's internal logic.
             available: aggregatedBalancesForCards['USDT']?.free || 0, // Example
             long: totalLongValue, // Example
             short: totalShortValue, // Example
             totalPositions: totalLongValue + totalShortValue, // Example
        };

        // --- Update State ---
        setCardsData({
            // Top 4 Cards
            activeUsers: aggregatedData.activeUsers,
            activeExchange: aggregatedData.activeExchange,
            activePositions: aggregatedData.activePositions,
            totalBalances: aggregatedData.totalBalances,
            // Standard Cards Data
            profit: profitData,
            upl: uplData,
            // Pass the flattened structure for cards that expect it (like FundsDistribution, BalanceGraph, etc.)
            // If a card needs specific aggregated data, pass it via its prop (e.g., fundsData for FundsDistribution)
            fundsDistribution: fundsData, // Pass specific aggregated data if needed
            balanceGraph: { data: [] }, // Needs historical data, populate if available
            weeklyRevenue: { labels: [], revenues: [] }, // Needs historical data, populate if available
            dailyPnL: { data: [] }, // Needs historical data, populate if available
            bestTradingPairs: { pairs: [] }, // Needs logic to rank pairs, populate if available
            openPositions: { positions: aggregatedPositionsForCards }, // Pass aggregated positions
        });

        // This is the key part: pass the flattened structure to cards that expect it (like user dashboard)
        setBalanceData(flattenedExchangeAccounts); // This feeds FundsDistribution, BalanceGraph, etc.


      } catch (err) {
        console.error("Admin Dashboard fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // Run once on mount

  if (loading) return <div className="p-8 text-white">Loading admin dashboard...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading dashboard: {error}</div>;

  return (
    <Layout onLogout={logout}>
      {/* Title */}
      <div className="shimmer-wrapper w-full py-4 px-6 mb-6 flex justify-between items-center">
        <h1
          className={`text-4xl font-semibold drop-shadow-md ${
            isDarkMode ? "text-white" : "text-black"
          }`}
        >
          Admin Dashboard
        </h1>
        <LightModeToggle />
      </div>

      {/* Dashboard content */}
      <div className="dashboard-content">
        {/* First Row - Top 4 Aggregated Cards */}
        <div className="grid grid-cols-4 gap-7 max-lg:grid-cols-2 max-sm:grid-cols-1 mb-6">
          <div className="dashboard-column dashboard-column-cyan">
            <ActiveUsers data={cardsData.activeUsers} />
          </div>
          <div className="dashboard-column dashboard-column-purple">
            <ActiveExchange data={cardsData.activeExchange} />
          </div>
          <div className="dashboard-column dashboard-column-green">
            <ActivePositions data={cardsData.activePositions} />
          </div>
          <div className="dashboard-column dashboard-column-teal">
            <TotalBalances data={cardsData.totalBalances} />
          </div>
        </div>

        {/* Profit, UPL, Funds */}
        <div className="grid grid-cols-3 gap-7 max-lg:grid-cols-1">
          <div className="dashboard-column dashboard-column-cyan">
            <Profit profitData={cardsData.profit} />
          </div>
          <div className="dashboard-column dashboard-column-purple">
            <UPL uplData={cardsData.upl} />
          </div>
          <div className="dashboard-column dashboard-column-green">
             {/* Pass aggregated fundsData OR let it parse balanceData */}
            <FundsDistribution fundsData={cardsData.fundsDistribution} balanceData={balanceData} />
          </div>
        </div>

        {/* Balance Graph + Weekly Revenue */}
        <div className="flex gap-4 w-full items-start mt-8 max-lg:flex-col">
          <div className="dashboard-column dashboard-column-cyan w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
            <BalanceGraph balanceData={balanceData} />
          </div>
          <div className="dashboard-column dashboard-column-purple w-full lg:w-1/2 p-4 h-[200px] overflow-hidden">
            <WeeklyRevenue weeklyData={cardsData.weeklyRevenue} />
          </div>
        </div>

        {/* Daily PnL + Best Trading Pairs */}
        <div className="grid grid-cols-2 gap-7 mt-8 max-sm:grid-cols-1">
          <div className="dashboard-column dashboard-column-cyan">
            <DailyPnL balanceData={cardsData.dailyPnL} />
          </div>
          <div className="dashboard-column dashboard-column-purple">
            <BestTradingPairs pairsData={cardsData.bestTradingPairs} balanceData={balanceData} />
          </div>
        </div>

        {/* Open Positions */}
        <div className="mt-8">
          <div className="dashboard-column dashboard-column-green">
            <OpenPositions positions={cardsData.openPositions?.positions || []} balanceData={balanceData} />
          </div>
        </div>

        {/* View All Positions */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => navigate("/admin/positions")}
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold transition-all"
          >
            View All Positions
          </button>
        </div>
      </div>
    </Layout>
  );
}
