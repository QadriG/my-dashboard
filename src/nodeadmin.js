const bcrypt = require("bcrypt");

// Generate a hash (do this once, not every time your server runs)
async function generateHash() {
  const plainPassword = "Seriousgains2025!";
  const saltRounds = 12; // higher is more secure, but slower
  const hash = await bcrypt.hash(plainPassword, saltRounds);
  console.log("Hashed Password:", hash);
}

generateHash();
