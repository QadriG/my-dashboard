import bcrypt from "bcryptjs";

/**
 * Hash a plain password
 * @param {string} password
 * @returns {Promise<string>} hashed password
 */
export const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

/**
 * Compare plain password with hash
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// ✅ ESM default export to support Node.js ESM named import issues
export default {
  encryptPassword,
  comparePassword,
};
