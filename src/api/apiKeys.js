
const API_BASE = "http://localhost:5000/api";

export async function saveApiKey(exchange, apiKey, apiSecret, passphrase = null) {
  try {
    const res = await fetch(`${API_BASE}/save-api-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // required for cookie auth
      body: JSON.stringify({ exchange, apiKey, apiSecret, passphrase }),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Failed to save API key");
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Save API key error:", err.message);
    throw err;
  }
}
