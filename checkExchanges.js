// checkExchanges.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔎 Checking UserExchange...");
    const userExchanges = await prisma.UserExchange.findMany();
    console.log("UserExchange records:", userExchanges);

    console.log("🔎 Checking UserAPI...");
    const userApis = await prisma.UserAPI.findMany();
    console.log("UserAPI records:", userApis);
  } catch (err) {
    console.error("❌ Error checking exchanges:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
