// src/sessionStore.ts
import crypto from "crypto";
import { redisClient } from "./redisClient.js";

const ALGORITHM = "aes-256-gcm";
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  throw new Error("Missing SESSION_SECRET environment variable");
}

// Type assertion for TypeScript 
const SECRET_BUFFER = Buffer.from(SESSION_SECRET as string, "hex");

/**
 * Store an API key securely in Redis (encrypted + TTL).
 */
export async function storeApiKey(
  sessionId: string,
  apiKey: string,
  ttlSeconds = 1800
) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_BUFFER, iv);

  const encrypted = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  const payload = JSON.stringify({
    iv: iv.toString("hex"),
    data: encrypted.toString("hex"),
    tag: tag.toString("hex"),
  });

  await redisClient.set(sessionId, payload, { EX: ttlSeconds });
}

/**
 * Retrieve and decrypt a stored API key.
 */
export async function getApiKey(sessionId: string): Promise<string | null> {
  const payload = await redisClient.get(sessionId);
  if (!payload) return null;

  try {
    const { iv, data, tag } = JSON.parse(payload);

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      SECRET_BUFFER,
      Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(tag, "hex"));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(data, "hex")),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (err) {
    console.error("Redis decryption error:", err);
    return null;
  }
}

/**
 * Delete a stored API key.
 */
export async function deleteApiKey(sessionId: string) {
  await redisClient.del(sessionId);
}
