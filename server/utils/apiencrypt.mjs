import crypto from "crypto";

if (!process.env.API_SECRET) {
  throw new Error("API_SECRET is not set in environment variables");
}

const ALGORITHM = "aes-256-cbc";
const KEY = crypto.scryptSync(process.env.API_SECRET, "salt", 32);

export const encrypt = (text) => {
  if (!text) throw new Error("No text provided to encrypt");
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

export const decrypt = (hash) => {
  if (!hash) throw new Error("No text provided to decrypt");
  const [ivHex, encrypted] = hash.split(":");
  if (!ivHex || !encrypted) {
    console.error("Invalid hash format:", hash);
    throw new Error("Invalid encrypted data format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

export default { encrypt, decrypt };