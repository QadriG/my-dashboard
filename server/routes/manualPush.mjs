// server/routes/manualPush.mjs
import express from "express";
import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { isAdmin } from "../middleware/auth.mjs"; // Import admin-only middleware
import { logEvent } from "../utils/logger.mjs"; // Import your logging utility
import { placeOrderOnExchange } from "../services/exchangeExecution.mjs"; // Import the service for placing orders

const prisma = new PrismaClient();
const router = express.Router();

/**
 * POST /api/admin/manual-push
 * Push position data to selected users' exchange accounts
 * Admin-only
 */
router.post("/", isAdmin, async (req, res) => {
  const { userIds, positionData } = req.body;

  // Validate request body
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ success: false, message: "Please provide a non-empty array of user IDs." });
  }
  if (!positionData || typeof positionData !== 'object') {
    return res.status(400).json({ success: false, message: "Please provide valid position data as an object." });
  }

  // Extract fields from the positionData object using your specified format
  const {
    id: orderId, // This will be used for tracking/order ID
    exchange,
    password, // This might be used for authentication or validation in your system
    action: side, // Map 'action' to 'side'
    market_position: marketPosition, // You can use this for internal logic if needed
    symbol,
    qty: quantity, // Map 'qty' to 'quantity'
    tp: takeProfitPrice, // Optional: Take Profit price
    sl: stopLossPrice, // Optional: Stop Loss price
    price: limitPrice, // Optional: Limit price for limit orders
    // Add other fields as needed
  } = positionData;

  // Validate extracted fields
  if (!exchange || !symbol || !side || typeof quantity !== 'number' || quantity <= 0) {
    return res.status(400).json({
      success: false,
      message: "Missing or invalid required fields in position data. Required: exchange, symbol, action (buy/sell), qty (positive number)."
    });
  }

  // Normalize side to lowercase
  const normalizedSide = side.toLowerCase();
  if (!['buy', 'sell'].includes(normalizedSide)) {
    return res.status(400).json({
      success: false,
      message: "Invalid 'action' value. Must be 'buy' or 'sell'."
    });
  }

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  for (const userId of userIds) {
    try {
      // Fetch user details to get email for logging
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, status: true } // Include status to check if user is active
      });

      if (!user) {
        await logEvent({
          userId,
          message: `Manual Push: Failed - User ID ${userId} not found in database.`,
          level: "ERROR"
        });
        results.push({ userId, status: "failed", error: "User not found" });
        failureCount++;
        continue; // Skip processing for this user
      }

      // Check user status
      if (user.status !== 'active') {
        await logEvent({
          userId,
          message: `Manual Push: Failed for user ${user.email} (ID: ${userId}) - User status is '${user.status}', not 'active'.`,
          level: "WARN" // Use WARN for status-related blocks
        });
        results.push({ userId, status: "failed", error: `User status is '${user.status}'` });
        failureCount++;
        continue; // Skip processing for inactive users
      }

      // Fetch user's exchange account details from the database
      const exchangeAccount = await prisma.userExchangeAccount.findFirst({
        where: { userId, provider: exchange.toLowerCase() }, // Match exchange name
      });

      if (!exchangeAccount) {
        await logEvent({
          userId,
          exchange: exchange,
          message: `Manual Push: Failed for user ${user.email} (ID: ${userId}) - No ${exchange} API account linked.`,
          level: "ERROR"
        });
        results.push({ userId, status: "failed", error: `No ${exchange} API account linked` });
        failureCount++;
        continue; // Skip processing for this user
      }

      // Validate API credentials exist
      if (!exchangeAccount.apiKey || !exchangeAccount.apiSecret) {
        await logEvent({
          userId,
          exchange: exchange,
          message: `Manual Push: Failed for user ${user.email} (ID: ${userId}) - Missing API credentials for ${exchange}.`,
          level: "ERROR"
        });
        results.push({ userId, status: "failed", error: `Missing API credentials for ${exchange}` });
        failureCount++;
        continue;
      }

      // Prepare order details from positionData
      const orderDetails = {
        exchange: exchange,
        apiKey: exchangeAccount.apiKey,
        apiSecret: exchangeAccount.apiSecret,
        type: exchangeAccount.type || 'spot', // Use account type or default
        symbol: symbol,
        side: normalizedSide, // Use the normalized side
        orderType: limitPrice ? 'LIMIT' : 'MARKET', // Determine order type based on presence of limitPrice
        quantity: quantity, // Use the extracted quantity
        price: limitPrice, // Use the extracted limitPrice if present
        userId: userId,
        userEmail: user.email,
        // Pass additional fields if needed by your `placeOrderOnExchange` function
        orderId: orderId, // Pass the original orderId for reference
        marketPosition: marketPosition, // Pass market_position if needed
        takeProfitPrice: takeProfitPrice, // Pass TP if needed
        stopLossPrice: stopLossPrice, // Pass SL if needed
        password: password, // Pass password if needed for any specific logic
      };

      // Place the order using the service
      const orderResult = await placeOrderOnExchange(orderDetails);

      if (orderResult.success) {
        await logEvent({
          userId,
          exchange: exchange,
          symbol: symbol,
          message: `Manual Push: SUCCESS for user ${user.email} (ID: ${userId}). Order placed: ${normalizedSide.toUpperCase()} ${quantity} ${symbol} on ${exchange}.`,
          level: "INFO"
        });
        results.push({ userId, status: "success", orderId: orderResult.orderId, exchange: exchange });
        successCount++;
      } else {
        // placeOrderOnExchange likely threw an error or returned an error object, log it
        const errorMessage = orderResult.error || orderResult.message || "Unknown error from exchange";
        await logEvent({
          userId,
          exchange: exchange,
          symbol: symbol,
          message: `Manual Push: FAILED for user ${user.email} (ID: ${userId}). Error from exchange: ${errorMessage}`,
          level: "ERROR"
        });
        results.push({ userId, status: "failed", error: errorMessage });
        failureCount++;
      }

    } catch (err) {
      // Catch any other errors during processing for a single user
      console.error(`Error processing manual push for user ${userId}:`, err);
      await logEvent({
        userId,
        message: `Manual Push: Internal Server Error processing user ${userId}. Error: ${err.message}`,
        level: "ERROR"
      });
      results.push({ userId, status: "failed", error: `Internal server error: ${err.message}` });
      failureCount++;
    }
  }

  // Send final response summarizing results
  res.json({
    success: true,
    message: `Manual push completed. ${successCount} succeeded, ${failureCount} failed.`,
    results
  });
});

export default router;