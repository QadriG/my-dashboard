// nodeadmin.js
import { hashPassword } from "./utils/encrypt.js";

const generateHash = async () => {
  const plainPassword = "Seriousgains2025!";
  const hash = await hashPassword(plainPassword);
  console.log("Hashed Password:", hash);
};

// Run immediately if script executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateHash();
}
