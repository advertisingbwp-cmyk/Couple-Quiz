import crypto from "crypto";
import { isIP } from "node:net";
import type { QuizData } from "./types";
import { dbRpc, isSupabaseConfigured, isProductionServerlessEnvironment } from "./supabase";

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
 * Computes a SHA-256 digest of the creator secret token for secure database storage.
 */
export function hashCreatorToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const CREATOR_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generates an HMAC-signed, time-limited creator session token.
 * Format: adm_cts_<timestampMs>_<hmacHex>
 */
export function generateCreatorSessionToken(quizId: string, pinHash: string): string {
  const timestamp = Date.now();
  const signature = crypto
    .createHmac("sha256", pinHash)
    .update(`${quizId}:${timestamp}`)
    .digest("hex");
  return `adm_cts_${timestamp}_${signature}`;
}

/**
 * Verifies an HMAC-signed creator session token against the quiz ID and PIN hash,
 * checking signature integrity and verifying expiration.
 */
export function verifyCreatorSessionToken(
  token: string,
  quizId: string,
  pinHash: string,
  maxAgeMs = CREATOR_SESSION_TTL_MS
): boolean {
  if (typeof token !== "string" || !token.startsWith("adm_cts_")) return false;
  const parts = token.slice("adm_cts_".length).split("_");
  if (parts.length !== 2) return false;
  const timestamp = Number(parts[0]);
  const signature = parts[1];
  if (!Number.isFinite(timestamp) || !signature) return false;

  const now = Date.now();
  // Reject future tokens (> 60s clock skew) and expired tokens
  if (timestamp > now + 60_000 || now - timestamp > maxAgeMs) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", pinHash)
    .update(`${quizId}:${timestamp}`)
    .digest("hex");

  return timingSafeEqualString(signature, expectedSignature);
}

/**
 * Constant-time verification of creator secret token against raw token, session token, or SHA-256 hash.
 * A stored SHA-256 digest is NEVER accepted directly as a bearer credential (prevents pass-the-hash attacks).
 */
export function verifyCreatorToken(
  enteredToken: string,
  storedTokenOrHash: string,
  quizContext?: { quizId: string; pinHash: string }
): boolean {
  if (typeof enteredToken !== "string" || typeof storedTokenOrHash !== "string") return false;
  if (!enteredToken || !storedTokenOrHash) return false;

  // 1. Session token verification (issued on PIN login)
  if (quizContext && enteredToken.startsWith("adm_cts_")) {
    return verifyCreatorSessionToken(enteredToken, quizContext.quizId, quizContext.pinHash);
  }

  // 2. Stored SHA-256 digest: requires the original valid raw creator token.
  // A stored digest is NEVER accepted directly as a bearer credential.
  if (/^[0-9a-f]{64}$/i.test(storedTokenOrHash)) {
    // Prevent pass-the-hash: presenting the stored digest directly is strictly rejected
    if (timingSafeEqualString(enteredToken, storedTokenOrHash)) {
      return false;
    }
    const enteredHash = hashCreatorToken(enteredToken);
    return timingSafeEqualString(enteredHash, storedTokenOrHash);
  }

  // 3. Raw creator secret token verification for local/test storage (where storedToken is the raw secret)
  return timingSafeEqualString(enteredToken, storedTokenOrHash);
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
 * Only platform-attested headers are trusted. Custom Cloudflare mode requires
 * an origin restricted to Cloudflare (documented deployment contract).
 */
export function normalizeClientIp(value: string): string | null {
  const ip = value.trim();
  const family = isIP(ip);
  if (family === 4) return ip;
  if (family !== 6 || ip.includes("%")) return null;
  const normalized = new URL(`http://[${ip}]`).hostname.slice(1, -1).toLowerCase();
  const mapped = normalized.match(/^::ffff:([0-9a-f]+):([0-9a-f]+)$/);
  if (mapped) {
    const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16);
    return [high >> 8, high & 255, low >> 8, low & 255].join(".");
  }
  return normalized;
}

export function extractClientIp(req: Request): string {
  const header = process.env.VERCEL === "1" ? "x-vercel-forwarded-for"
    : process.env.QUIZ_TRUSTED_PROXY === "cloudflare" ? "cf-connecting-ip" : null;
  // Unknown callers deliberately share a conservative bucket, never a spoofable
  // header-derived identity. Lists, ports and invalid values are not accepted.
  return (header && normalizeClientIp(req.headers.get(header) || "")) || "unknown";
}

const localPinAttempts = new Map<string, { count: number; resetAt: number }>();
const rateKey = (ip: string) => `ratelimit:pin:${normalizeClientIp(ip) || "unknown"}`;

export class RateLimitUnavailableError extends Error {
  constructor() {
    super("Authentication temporarily unavailable");
    this.name = "RateLimitUnavailableError";
  }
}

export async function checkPinRateLimit(ip: string): Promise<boolean> {
  const key = rateKey(ip);
  if (isSupabaseConfigured()) {
    const res = await dbRpc<boolean>("check_pin_rate_limit", {
      p_rate_key: key,
      p_max_attempts: 5,
    });
    if (res.error || typeof res.data !== "boolean") {
      throw new RateLimitUnavailableError();
    }
    return res.data;
  }
  if (isProductionServerlessEnvironment()) throw new RateLimitUnavailableError();
  const entry = localPinAttempts.get(key);
  return !entry || Date.now() >= entry.resetAt || entry.count < 5;
}

async function finishAuthentication(ip: string, valid: boolean): Promise<"allowed" | "invalid" | "limited"> {
  const key = rateKey(ip);
  if (isSupabaseConfigured()) {
    const res = await dbRpc<number>("record_pin_rate_limit_outcome", {
      p_rate_key: key,
      p_outcome: valid ? "success" : "failure",
      p_max_attempts: 5,
      p_window_seconds: 600,
    });
    if (res.error || ![0, 1, -1].includes(res.data as number)) {
      throw new RateLimitUnavailableError();
    }
    return res.data === 0 ? "limited" : res.data === 1 ? "allowed" : "invalid";
  }
  if (isProductionServerlessEnvironment()) throw new RateLimitUnavailableError();
  const now = Date.now();
  let entry = localPinAttempts.get(key);
  if (entry && now >= entry.resetAt) { localPinAttempts.delete(key); entry = undefined; }
  if (entry && entry.count >= 5) return "limited";
  if (valid) return "allowed";
  if (!entry) localPinAttempts.set(key, { count: 1, resetAt: now + 600_000 });
  else entry.count++;
  return "invalid";
}

export async function recordFailedPinAttempt(ip: string): Promise<boolean> {
  return (await finishAuthentication(ip, false)) === "invalid";
}

export async function clearPinRateLimit(ip: string): Promise<void> {
  const key = rateKey(ip);
  if (isSupabaseConfigured()) {
    const res = await dbRpc("clear_pin_rate_limit", { p_rate_key: key });
    if (res.error) throw new RateLimitUnavailableError();
  } else if (isProductionServerlessEnvironment()) throw new RateLimitUnavailableError();
  localPinAttempts.delete(key);
}

/**
 * All protected routes share this atomic final decision. Successful requests
 * consume no allowance and do not erase concurrent failures in the fixed window.
 */
export async function authenticateCreator(
  req: Request,
  quiz: QuizData,
  credentials: { pin?: unknown; creatorToken?: unknown }
): Promise<200 | 403 | 429> {
  const ip = extractClientIp(req);
  if (!(await checkPinRateLimit(ip))) return 429;

  const valid =
    (typeof credentials.creatorToken === "string" &&
      verifyCreatorToken(credentials.creatorToken, quiz.creatorToken, {
        quizId: quiz.id,
        pinHash: quiz.pinHash,
      })) ||
    (typeof credentials.pin === "string" &&
      /^\d{4,6}$/.test(credentials.pin.trim()) &&
      verifyPin(credentials.pin, quiz.pinHash));

  const decision = await finishAuthentication(ip, valid);
  return decision === "allowed" ? 200 : decision === "limited" ? 429 : 403;
}

export function _resetPinRateLimit(ip?: string): void {
  if (process.env.NODE_ENV !== "test" || isProductionServerlessEnvironment()) {
    throw new Error("Test mode required");
  }
  if (ip) {
    localPinAttempts.delete(rateKey(ip));
    if (isSupabaseConfigured()) {
      clearPinRateLimit(ip).catch(() => {});
    }
  } else {
    localPinAttempts.clear();
  }
}
