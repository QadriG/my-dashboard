import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAllApiKeys() {
  try {
    await prisma.userExchangeAccount.deleteMany({});
    console.log("All API keys deleted successfully.");
  } catch (err) {
    console.error("Error deleting API keys:", err);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllApiKeys();