// server/controllers/adminController.mjs

import pkg from "@prisma/client";
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// Remove next parameter from all functions

export async function listAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // ❌ Remove 'balance' - it doesn't exist in User model
        // balance: true,
        // Instead, fetch related data if needed (e.g., UserExchangeAccount)
        // APIs: true, // If you want to include APIs, make sure it's defined in your schema
      },
    });
    return users;
  } catch (err) {
    console.error("Error fetching users:", err);
    throw err; // Re-throw for caller to handle
  }
}

export async function deleteUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await prisma.user.delete({
      where: { id: userId },
    });
    return user;
  } catch (err) {
    console.error("Error deleting user:", err);
    throw err;
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    return user;
  } catch (err) {
    console.error("Error updating user role:", err);
    throw err;
  }
}

export async function pauseUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: "paused" },
    });

    return user;
  } catch (err) {
    console.error("Error pausing user:", err);
    throw err;
  }
}

export async function disableUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: "disabled" },
    });

    return user;
  } catch (err) {
    console.error("Error disabling user:", err);
    throw err;
  }
}

export async function getUserStats(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);

    // Example: Fetch basic stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        // Add any other fields you need
      },
    });

    // You might want to add logic to calculate stats based on related tables
    // e.g., count of positions, total balance from exchange accounts

    return {
      user,
      // Add calculated stats here
      // totalPositions: ...,
      // totalBalance: ...
    };
  } catch (err) {
    console.error("Error fetching user stats:", err);
    throw err;
  }
}

export async function getUserPositions(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);

    // Fetch user's positions via their exchange accounts
    const userExchanges = await prisma.userExchangeAccount.findMany({
      where: { userId },
      select: {
        provider: true,
        type: true,
        apiKey: true,
        apiSecret: true,
        passphrase: true,
      },
    });

    // For each exchange, you would call fetchUserExchangeData or a similar function
    // This is a placeholder - you'd need to implement the actual position fetching logic
    const positions = [];

    for (const ex of userExchanges) {
      // Placeholder: In real code, you'd use your existing `fetchUserExchangeData` function
      // and extract positions
      // const exchangeData = await fetchUserExchangeData(userId); // This function needs to be available
      // positions.push(...exchangeData[0]?.openPositions || []);
    }

    return positions;
  } catch (err) {
    console.error("Error fetching user positions:", err);
    throw err;
  }
}

export async function unpauseUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: "active" },
    });

    return user;
  } catch (err) {
    console.error("Error unpausing user:", err);
    throw err;
  }
}

export async function enableUser(req, res, next) {
  try {
    const userId = parseInt(req.params.id, 10);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: "active" },
    });

    return user;
  } catch (err) {
    console.error("Error enabling user:", err);
    throw err;
  }
}