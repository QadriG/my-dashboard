import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log("🌍 Seeding ExchangeMeta...");

  const exchanges = [
    // Binance
    { name: "Binance Spot", ccxtId: "binance", type: "spot", enabled: true },
    { name: "Binance Futures", ccxtId: "binanceusdm", type: "futures", enabled: true },

    // OKX
    { name: "OKX Spot", ccxtId: "okx", type: "spot", enabled: true },
    { name: "OKX Futures", ccxtId: "okx", type: "futures", enabled: true },

    // Bybit
    { name: "Bybit Spot", ccxtId: "bybit", type: "spot", enabled: true },
    { name: "Bybit Futures", ccxtId: "bybit", type: "futures", enabled: true },

    // Coinbase
    { name: "Coinbase Spot", ccxtId: "coinbase", type: "spot", enabled: true },

    // Blofin
    { name: "Blofin Futures", ccxtId: "blofin", type: "futures", enabled: true },

    // Bitunix
    { name: "Bitunix Spot", ccxtId: "bitunix", type: "spot", enabled: true },
    { name: "Bitunix Futures", ccxtId: "bitunix", type: "futures", enabled: true },
  ];

  for (const ex of exchanges) {
    try {
      await prisma.exchangeMeta.upsert({
        where: {
          ccxtId_type: { ccxtId: ex.ccxtId, type: ex.type },
        },
        update: {
          name: ex.name,
          enabled: ex.enabled,
        },
        create: ex,
      });
    } catch (err) {
      console.warn(`⚠️ Skipping duplicate ${ex.name}: ${err.message}`);
    }
  }

  console.log("✅ ExchangeMeta seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
