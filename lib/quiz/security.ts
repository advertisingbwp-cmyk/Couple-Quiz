import crypto from "crypto";

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
    // Mitigate timing leakage on length mismatch
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
 * In-memory brute force rate limiter for PIN verification: max 5 attempts per IP per 10 minutes.
 * Note: On serverless platforms, an in-memory Map is instance-scoped; Redis-backed rate limiting
 * is recommended for production multi-instance deployments.
 */
const pinAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkPinRateLimit(ip: string): boolean {
  const now = Date.now();
  const cleanIp = ip.trim() || "unknown";
  const entry = pinAttempts.get(cleanIp);
  if (!entry || now > entry.resetAt) {
    pinAttempts.set(cleanIp, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) {
    return false;
  }
  entry.count++;
  return true;
}

/**
 * Reset helper for rate limiter testing.
 */
export function _resetPinRateLimit(ip?: string): void {
  if (ip) {
    pinAttempts.delete(ip);
  } else {
    pinAttempts.clear();
  }
}
