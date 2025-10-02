import client from "./prisma/client.mjs";
async function clearAllKeys() {
  try {
    const result = await client.userExchange.updateMany({
      data: {
        apiKey: "",
        apiSecret: "",
        
      },
    });
    console.log(` Cleared API keys for ${result.count} entries.`);
  } catch (err) {
    console.error(" Failed to clear keys:", err);
  } finally {
    await client.$disconnect();
  }
}
clearAllKeys();
