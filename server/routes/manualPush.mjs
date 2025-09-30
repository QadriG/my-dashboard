// server/routes/manualPush.mjs
import express from "express";
import axios from "axios"; // For sending requests to exchange APIs

const router = express.Router();

// Example in-memory user API keys
// In production, fetch these securely from your database
const userApiKeys = {
  0: { apiKey: "USER0_KEY", secret: "USER0_SECRET" },
  4: { apiKey: "USER4_KEY", secret: "USER4_SECRET" },
  6: { apiKey: "USER6_KEY", secret: "USER6_SECRET" },
  // add all your users here
};

// POST /api/manual-push
router.post("/", async (req, res) => {
  const { users, data } = req.body;

  if (!users || !data) {
    return res.status(400).json({ error: "Missing users or data" });
  }

  const results = [];

  for (const userId of users) {
    const userKeys = userApiKeys[userId];
    if (!userKeys) {
      results.push({ userId, status: "failed", error: "API keys not found" });
      continue;
    }

    try {
      // Example: send payload to exchange API
      // Replace with your actual integration logic
      // Here we just simulate sending the payload
      console.log(`Sending to user ${userId}:`, data);

      // If actual exchange call:
      // const response = await axios.post("EXCHANGE_API_URL", data, { headers: { apiKey: userKeys.apiKey, secret: userKeys.secret }});

      results.push({ userId, status: "success" });
    } catch (err) {
      console.error(`Failed for user ${userId}:`, err);
      results.push({ userId, status: "failed", error: err.message });
    }
  }

  res.json({ results });
});

export default router;
