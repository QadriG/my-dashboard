// server/services/positionCloseService.mjs

import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { decrypt } from "../utils/apiencrypt.mjs"; // Import your decryption function
import { info, error as logError } from "../utils/logger.mjs";
import { fetchExchangeData } from "./exchangeManager.mjs"; // Import your exchange manager

const prisma = new PrismaClient();

// Service function to close a position
export async function closePositionOnExchange(userId, symbol, side) {
  try {
    // 1. Fetch user's exchange account details (API keys)
    // Assuming a unified table or a way to get active exchange credentials for the user
    const userExchangeAccount = await prisma.userExchangeAccount.findFirst({
      where: {
        userId: userId,
        isActive: true, // Only attempt for active accounts
        // You might want to filter by a specific exchange if needed, e.g., provider: 'bybit'
      },
    });

    if (!userExchangeAccount) {
      return { success: false, message: `No active exchange account found for user ${userId}.` };
    }

    const { provider, apiKey, apiSecret, passphrase } = userExchangeAccount;

    // 2. Decrypt API keys
    const decryptedApiKey = decrypt(apiKey);
    const decryptedApiSecret = decrypt(apiSecret);
    const decryptedPassphrase = passphrase ? decrypt(passphrase) : null;

    // 3. Determine the action based on the position side
    // For Bybit futures, closing usually means placing an order in the opposite direction
    const orderSide = side.toLowerCase() === 'buy' ? 'Sell' : 'Buy'; // Opposite side

    // 4. Use your existing exchange integration to place the closing order
    // This is where you'd call a specific function in your `exchangeManager.mjs` or `bybitService.mjs`
    // to place a market order to close the position.
    // Example placeholder call (you need to implement this logic inside exchangeManager or create a new function):
    // const result = await placeMarketOrderToClose(decryptedApiKey, decryptedApiSecret, symbol, orderSide);

    // --- Placeholder: Simulate calling exchange API ---
    // This is a simplified example. Real implementation depends on Bybit's API specifics.
    // You might need to fetch the current position size first to place an order of the same size.
    // You might also need to specify the category (e.g., linear) and settle coin (e.g., USDT).

    // Example using your `fetchExchangeData` pattern - you'd need a new function inside exchangeManager
    // that handles the closing logic, likely by calling the exchange's specific API for reducing position size or placing an order.
    // const exchangeResult = await fetchExchangeData(provider, decryptedApiKey, decryptedApiSecret, decryptedPassphrase, 'futures');
    // const closeResult = await exchangeResult.closePosition(symbol, side); // This method needs to be implemented in exchangeManager/bybitService

    // --- Real Implementation Example for Bybit (Conceptual) ---
    // You would likely add a function like this to your bybitService.mjs:
    /*
    // In services/exchanges/bybitService.mjs
    export async function closePositionByMarket(apiKey, apiSecret, symbol, side, category = 'linear', settleCoin = 'USDT') {
      // Fetch current position to get size
      const positionsRes = await fetchPositions(apiKey, apiSecret, 'UNIFIED'); // or relevant account type
      const positionToClose = positionsRes.find(p => p.symbol === symbol && p.side.toLowerCase() === side.toLowerCase());

      if (!positionToClose) {
         throw new Error(`Position to close not found for symbol ${symbol} and side ${side}`);
      }

      // Prepare order parameters for closing
      const orderSize = positionToClose.size; // Use the current position size
      const closeSide = side.toLowerCase() === 'buy' ? 'Sell' : 'Buy'; // Opposite side

      // Call Bybit API to place market order
      const closeOrderPayload = {
          category, // e.g., 'linear'
          symbol,
          side: closeSide, // Opposite side
          orderType: 'Market',
          qty: orderSize.toString(), // Quantity to close
          timeInForce: 'IOC', // Or 'FOK' depending on preference
          // ... potentially other parameters like reduceOnly: true
      };

      // Make the actual API call using axios with proper signing
      // const response = await axios.post('https://api.bybit.com/v5/order/create', closeOrderPayload, { headers: signedHeaders });
      // return response.data;

      // For now, simulate success:
      return { success: true, message: `Simulated closing ${side} position for ${symbol} on Bybit for user.` };
    }
    */

    // Then call it from here:
    // const result = await closePositionByMarket(decryptedApiKey, decryptedApiSecret, symbol, side);

    // For now, let's assume a function `executeCloseOrder` exists in exchangeManager
    // which internally calls the appropriate exchange-specific function.
    // This function needs to be implemented.
    const exchangeResult = await fetchExchangeData(provider, decryptedApiKey, decryptedApiSecret, decryptedPassphrase, 'futures');
    // Assuming exchangeManager returns an object with a closePosition method
    // if (exchangeResult.closePosition) {
    //    const result = await exchangeResult.closePosition(symbol, side);
    //    return result;
    // } else {
    //    return { success: false, message: `Close position not implemented for exchange ${provider}.` };
    // }

    // --- Simulate Success (Replace with real logic) ---
    info(`Simulated closing ${side} position for ${symbol} on ${provider} for user ${userId}`);
    return { success: true, message: `Simulated close command sent for user ${userId} on ${symbol} (${side}). Actual API call needs implementation.` };

  } catch (err) {
    logError(`Error closing position for user ${userId} on ${symbol} (${side})`, err);
    return { success: false, message: `Error closing position: ${err.message}` };
  }
}

// Example of how the Bybit-specific close function might look (add to services/exchanges/bybitService.mjs):
/*
export async function closePositionByMarket(apiKey, apiSecret, symbol, side, category = 'linear', settleCoin = 'USDT') {
  // 1. Fetch current position to get size
  const positionsRes = await fetchPositions(apiKey, apiSecret, 'UNIFIED'); // Or relevant account type
  const positionToClose = positionsRes.find(p => p.symbol === symbol && p.side.toLowerCase() === side.toLowerCase());

  if (!positionToClose) {
     throw new Error(`Position to close not found for symbol ${symbol} and side ${side}`);
  }

  // 2. Prepare order parameters for closing
  const orderSize = positionToClose.size; // Use the current position size
  const closeSide = side.toLowerCase() === 'buy' ? 'Sell' : 'Buy'; // Opposite side

  // 3. Prepare payload for Bybit API
  const closeOrderPayload = {
      category, // e.g., 'linear'
      symbol,
      side: closeSide, // Opposite side
      orderType: 'Market',
      qty: orderSize.toString(), // Quantity to close
      timeInForce: 'IOC', // Or 'FOK' depending on preference
      reduceOnly: true, // Crucial for closing existing positions
  };

  // 4. Sign and call the Bybit API
  // ... (similar signing logic as fetchPositions, but for /v5/order/create endpoint)
  // const response = await axios.post('https://api.bybit.com/v5/order/create', closeOrderPayload, { headers: signedHeaders });

  // 5. Return response or handle errors
  // if (response.data.retCode === 0) {
  //    return { success: true, message: "Position closed successfully", data: response.data.result };
  // } else {
  //    throw new Error(`Bybit API Error: ${response.data.retMsg}`);
  // }
  // For now, simulate success:
  return { success: true, message: `Position ${side} for ${symbol} closed successfully via Bybit API.` };
}
*/

// Remember to add the closePositionByMarket function to the default export of bybitService.mjs
// export default { fetchBalance, fetchPositions, closePositionByMarket, ... };
