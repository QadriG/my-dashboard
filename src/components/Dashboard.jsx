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
    // Top 4 Aggregated Cards (Receive data directly from backend)
    activeUsers: null,
    activeExchange: null,
    activePositions: null,
    totalBalances: null, // This holds the aggregated total from backend
    // Standard Cards Data Structures
    profit: null,
    upl: null,
    fundsDistribution: null, // Not directly used if balanceData is correct, but pass empty obj or specific data if needed by that component directly
    balanceGraph: null,
    weeklyRevenue: null,
    dailyPnL: null, // Not directly used if balanceData is correct
    bestTradingPairs: null,
    openPositions: null,
  });

  // --- Crucial: Mimic user dashboard's balanceData structure for standard cards ---
  // This will be an array containing a single, virtual "aggregated user" object.
  const [balanceData, setBalanceData] = useState([]); // Starts as empty array
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

        // 3. --- Aggregate detailed data for STANDARD CARDS ---
        let totalBalanceForCards = 0; // Sum of all user.total
        let totalLongValue = 0;
        let totalShortValue = 0;
        let totalLongUPL = 0;
        let totalShortUPL = 0;
        let aggregatedBalancesForCards = {}; // { 'USDT': { total: X, free: Y, used: Z }, ... }

        if (result.users && Array.isArray(result.users)) {
            result.users.forEach(user => {
                 totalBalanceForCards += user.total || 0;

                if (user.balanceData && Array.isArray(user.balanceData)) {
                    user.balanceData.forEach(exchangeAccount => {
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

                        const balances = exchangeAccount.balance?.balances || {};
                        Object.entries(balances).forEach(([asset, balanceInfo]) => {
                           if (!aggregatedBalancesForCards[asset]) {
                             aggregatedBalancesForCards[asset] = { total: 0, free: 0, used: 0 };
                           }
                           aggregatedBalancesForCards[asset].total += balanceInfo.total || 0;
                           aggregatedBalancesForCards[asset].free += balanceInfo.free || 0;
                           aggregatedBalancesForCards[asset].used += balanceInfo.used || 0;
                        });
                    });
                }
            });
        }

        const totalUPL = totalLongUPL + totalShortUPL;
        const totalProfit = totalUPL; // Simplified

        // --- Prepare data structures for standard cards ---
        const profitData = {
            total: totalBalanceForCards,
            long: totalLongValue,
            short: totalShortValue,
        };

        const uplData = {
            total: totalUPL,
            totalPercent: totalBalanceForCards > 0 ? (totalUPL / totalBalanceForCards) * 100 : 0,
            long: totalLongUPL,
            longPercent: totalBalanceForCards > 0 ? (totalLongUPL / totalBalanceForCards) * 100 : 0,
            short: totalShortUPL,
            shortPercent: totalBalanceForCards > 0 ? (totalShortUPL / totalBalanceForCards) * 100 : 0,
        };

        // --- ✅ KEY FIX: Create a virtual "user" balanceData object ---
        // This mimics the structure user dashboard components expect from balanceData[0]
        const virtualAggregatedBalanceData = {
          // --- Fields for FundsDistribution ---
          totalBalance: totalBalanceForCards,
          available: aggregatedBalancesForCards['USDT']?.free || 0, // Example logic
          long: totalLongValue,
          short: totalShortValue,
          totalPositions: totalLongValue + totalShortValue,

          // --- Fields for DailyPnL (needs real data, placeholder for now) ---
          dailyPnLSnapshots: [],

          // --- Useful for other components if needed ---
          balances: aggregatedBalancesForCards,
          error: null,
          exchange: "Aggregated",
          type: "Unified",
        };

        // --- Update State ---
        setCardsData({
            // Top 4 Cards receive aggregated data directly
            activeUsers: aggregatedData.activeUsers,
            activeExchange: aggregatedData.activeExchange,
            activePositions: aggregatedData.activePositions,
            totalBalances: aggregatedData.totalBalances, // Pass the backend's aggregated total object
            // Standard Cards Data
            profit: profitData,
            upl: uplData,
            fundsDistribution: {}, // Pass empty object, data comes from balanceData
            balanceGraph: { data: [] }, // Needs historical data
            weeklyRevenue: { labels: [], revenues: [] }, // Needs historical data
            dailyPnL: {}, // Pass empty object, data comes from balanceData
            bestTradingPairs: { pairs: [] }, // Needs logic
            openPositions: { positions: [] }, // Needs logic or data from balanceData iteration if collected
        });

        // ✅ Pass the virtual aggregated data inside an array to mimic user's balanceData structure
        // This is crucial for FundsDistribution, DailyPnL, etc.
        setBalanceData([virtualAggregatedBalanceData]);


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
            {/* Pass the aggregated total data to TotalBalances */}
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
            {/* Pass balanceData so FundsDistribution can parse virtualAggregatedBalanceData */}
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
            {/* Pass balanceData so DailyPnL can parse virtualAggregatedBalanceData.dailyPnLSnapshots */}
            <DailyPnL balanceData={balanceData} />
          </div>
          <div className="dashboard-column dashboard-column-purple">
            <BestTradingPairs pairsData={cardsData.bestTradingPairs} balanceData={balanceData} />
          </div>
        </div>

        {/* Open Positions */}
        <div className="mt-8">
          <div className="dashboard-column dashboard-column-green">
            <OpenPositions positionsData={cardsData.openPositions} balanceData={balanceData} />
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