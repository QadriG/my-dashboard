import crypto from "crypto";

if (!process.env.API_SECRET) {
  throw new Error("API_SECRET is not set in environment variables");
}

const ALGORITHM = "aes-256-cbc";
const KEY = crypto.scryptSync(process.env.API_SECRET, "salt", 32);
const IV = Buffer.alloc(16, 0); // fixed IV

export const encrypt = (text) => {
  if (!text) throw new Error("No text provided to encrypt");
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

export const decrypt = (hash) => {
  if (!hash) throw new Error("No text provided to decrypt");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
  let decrypted = decipher.update(hash, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

export default { encrypt, decrypt };
