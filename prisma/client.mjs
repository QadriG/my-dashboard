// prisma/client.mjs
import { PrismaClient } from "@prisma/client";
import { registerEncryptionMiddleware } from "./middleware/encryptDecrypt.mjs";

const client = new PrismaClient();

// ✅ Only register middleware if Prisma supports it
if (typeof client.$use === "function") {
  registerEncryptionMiddleware(client);
}

export default client;
