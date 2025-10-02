// checkKeys.mjs
import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { decrypt } from "./server/utils/apiencrypt.mjs";

const prisma = new PrismaClient();

const run = async () => {
  const userId = 3; // change to your test user

  // Fetch exchange records
  const exchanges = await prisma.userExchange.findMany({
    where: { userId },
    select: { exchange: true, apiKey: true, apiSecret: true }
  });

  for (const ex of exchanges) {
    console.log(`\n🔎 Exchange: ${ex.exchange}`);

    try {
      // Try to decrypt apiKey
      const key = decrypt(ex.apiKey);
      const secret = decrypt(ex.apiSecret);

      console.log("✅ Looks encrypted (decrypted values below):");
      console.log("API KEY   :", key);
      console.log("API SECRET:", secret);
    } catch (err) {
      console.log("⚠️ Not encrypted, raw values stored:");
      console.log("API KEY   :", ex.apiKey);
      console.log("API SECRET:", ex.apiSecret);
    }
  }

  process.exit(0);
};

run().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
