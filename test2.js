import prisma from "./prisma/client.mjs";
import { decrypt } from "./server/utils/apiencrypt.mjs";

const users = await prisma.userExchange.findMany();

for (const u of users) {
  console.log(`User ${u.userId}, exchange ${u.exchange}`);
  console.log("Encrypted apiKey:", u.apiKey);
  console.log("Encrypted apiSecret:", u.apiSecret);

  try {
    console.log("Decrypted apiKey:", decrypt(u.apiKey));
    console.log("Decrypted apiSecret:", decrypt(u.apiSecret));
  } catch (err) {
    console.error("Decryption failed:", err.message);
  }
}
