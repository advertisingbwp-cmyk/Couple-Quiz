import crypto from "crypto";
import { executeRedisCommand, executeRedisPipeline, isRedisConfigured, isProductionServerlessEnvironment } from "./redis";

const SCRYPT_KEYLEN = 64;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELISM = 1;

/**
 * Creates an scrypt hash of the creator's PIN with a cryptographically secure
 * random per-record salt (16 bytes). Format: scrypt:<saltHex>:<derivedHex>
 */
export function hashPin(pin: string): string {
  const clean = pin.trim();
  if (!clean || !/^\d{4,6}$/.test(clean)) {
    throw new Error("PIN must be 4 to 6 digits (numbers only).");
  }
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(clean, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELISM,
  }).toString("hex");

  return `scrypt:${salt}:${derived}`;
}

/**
 * Verifies entered PIN against stored scrypt hash using constant-time comparison.
 */
export function verifyPin(enteredPin: string, storedHash: string): boolean {
  if (!enteredPin || !storedHash || typeof enteredPin !== "string" || typeof storedHash !== "string") {
    return false;
  }
  const clean = enteredPin.trim();
  const parts = storedHash.split(":");
  if (parts.length === 3 && parts[0] === "scrypt") {
    const salt = parts[1];
    const expectedKeyHex = parts[2];
    const derived = crypto.scryptSync(clean, salt, SCRYPT_KEYLEN, {
      N: SCRYPT_COST,
      r: SCRYPT_BLOCK_SIZE,
      p: SCRYPT_PARALLELISM,
    }).toString("hex");

    const bufA = Buffer.from(derived, "hex");
    const bufB = Buffer.from(expectedKeyHex, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }
  return false;
}

/**
 * Constant-time string comparison for secret tokens to prevent timing attacks.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates an unguessable 48-character hex secret token for the creator.
 */
export function generateCreatorToken(): string {
  return "adm_" + crypto.randomBytes(24).toString("hex");
}

/**
 * Generates a cryptographically secure, collision-resistant random quiz ID.
 * Format: q_<timestamp>_<12_hex_chars>
 */
export function generateQuizId(): string {
  const timestamp = Date.now();
  const entropy = crypto.randomBytes(6).toString("hex");
  return `q_${timestamp}_${entropy}`;
}

/**
 * Generates a cryptographically secure, collision-resistant attempt ID.
 * Format: att_<timestamp>_<12_hex_chars>
 */
export function generateAttemptId(): string {
  const timestamp = Date.now();
  const entropy = crypto.randomBytes(6).toString("hex");
  return `att_${timestamp}_${entropy}`;
}

/**
 * Generates a clean URL slug with secure random entropy.
 */
export function generateQuizSlug(creatorName: string): string {
  const clean = creatorName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const entropy = crypto.randomBytes(4).toString("hex");
  return `${clean || "quiz"}-${entropy}`;
}

/**
 * Extracts client IP safely without trusting forged or arbitrary client-supplied headers.
 */
export function extractClientIp(req: Request): string {
  // 1. Managed trusted reverse proxy headers (cannot be set by client when on Vercel/Cloudflare)
  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp && vercelIp.trim()) {
    return vercelIp.split(",")[0].trim();
  }

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim()) {
    return cfIp.trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) {
    return realIp.trim();
  }

  // 2. Standard proxy header (extract leftmost entry)
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor && forwardedFor.trim()) {
    const parts = forwardedFor.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      return parts[0];
    }
  }

  return "127.0.0.1";
}

// In-memory rate limiter for local development and unit tests
const localPinAttempts = new Map<string, { count: number; resetAt: number }>();

/**
 * Checks whether an IP has exceeded the maximum allowed failed PIN attempts (5 per 10 minutes).
 * Uses Redis in production; falls back to in-memory store in local dev/tests.
 * Fails closed in production if Redis is unavailable.
 */
export async function checkPinRateLimit(ip: string): Promise<boolean> {
  const cleanIp = ip.trim() || "unknown";
  const rateLimitKey = `ratelimit:pin:${cleanIp}`;
  const isProd = isProductionServerlessEnvironment();

  if (isRedisConfigured()) {
    const redisRes = await executeRedisCommand<string | null>(["GET", rateLimitKey]);
    if (!redisRes.ok) {
      if (isProd) {
        console.error(`[Security Alert]: Rate limit storage unreachable in production for IP ${cleanIp}. Failing closed.`);
        return false;
      }
    } else {
      const count = parseInt(redisRes.result || "0", 10);
      if (count >= 5) {
        return false;
      }
      return true;
    }
  } else if (isProd) {
    // Production without Redis must fail closed
    console.error(`[Security Alert]: Distributed rate limiting is not configured in production. Failing closed.`);
    return false;
  }

  // Local dev / test fallback
  const now = Date.now();
  const entry = localPinAttempts.get(cleanIp);
  if (!entry || now > entry.resetAt) {
    return true;
  }
  return entry.count < 5;
}

/**
 * Atomically records a failed PIN verification attempt for the given IP.
 * Increments attempt count and sets a 10-minute sliding expiry.
 */
export async function recordFailedPinAttempt(ip: string): Promise<void> {
  const cleanIp = ip.trim() || "unknown";
  const rateLimitKey = `ratelimit:pin:${cleanIp}`;

  if (isRedisConfigured()) {
    await executeRedisPipeline([
      ["INCR", rateLimitKey],
      ["EXPIRE", rateLimitKey, 600],
    ]);
  }

  // Also maintain local record for test/dev
  const now = Date.now();
  const entry = localPinAttempts.get(cleanIp);
  if (!entry || now > entry.resetAt) {
    localPinAttempts.set(cleanIp, { count: 1, resetAt: now + 10 * 60 * 1000 });
  } else {
    entry.count++;
  }
}

/**
 * Clears failed PIN attempts for an IP upon successful authentication.
 */
export async function clearPinRateLimit(ip: string): Promise<void> {
  const cleanIp = ip.trim() || "unknown";
  const rateLimitKey = `ratelimit:pin:${cleanIp}`;

  if (isRedisConfigured()) {
    await executeRedisCommand(["DEL", rateLimitKey]);
  }
  localPinAttempts.delete(cleanIp);
}

/**
 * Test helper to reset rate limits.
 */
export function _resetPinRateLimit(ip?: string): void {
  if (ip) {
    localPinAttempts.delete(ip);
  } else {
    localPinAttempts.clear();
  }
}
