// prisma/middleware/encryptDecrypt.mjs
import { encrypt } from "../../server/utils/apiencrypt.mjs"; // ✅ fixed path

export function registerEncryptionMiddleware(client) {
  if (typeof client.$use !== "function") {
    throw new Error("$use is not available on the Prisma client instance");
  }

  client.$use(async (params, next) => {
    // Only handle UserExchange or UserAPI
    if (params.model === "UserExchange" || params.model === "UserAPI") {
      if (["create", "update"].includes(params.action)) {
        try {
          if (params.args.data.apiKey) {
            params.args.data.apiKey = encrypt(params.args.data.apiKey);
          }
          if (params.args.data.apiSecret) {
            params.args.data.apiSecret = encrypt(params.args.data.apiSecret);
          }
          if (params.args.data.passphrase) {
            params.args.data.passphrase = encrypt(params.args.data.passphrase);
          }
        } catch (err) {
          console.error("Failed to encrypt API keys/secrets:", err);
          throw err;
        }
      }
    }

    return next(params);
  });
}
