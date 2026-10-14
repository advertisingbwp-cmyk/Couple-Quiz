import crypto from "crypto";

const PIN_SALT = process.env.QUIZ_PIN_SALT || "quiz_secure_salt_2026";

/**
 * Creates a deterministic SHA-256 hash of the creator's PIN with salt.
 */
export function hashPin(pin: string): string {
  const clean = pin.trim();
  return crypto.createHash("sha256").update(`${PIN_SALT}:${clean}`).digest("hex");
}

/**
 * Verifies if entered PIN matches stored hash.
 */
export function verifyPin(enteredPin: string, storedHash: string): boolean {
  if (!enteredPin || !storedHash) return false;
  const hash = hashPin(enteredPin);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

/**
 * Generates an unguessable 32-character hex secret token for the creator.
 */
export function generateCreatorToken(): string {
  return "adm_" + crypto.randomBytes(16).toString("hex");
}

/**
 * In-memory brute force rate limiter for PIN verification: max 5 attempts per IP per 10 minutes.
 */
const pinAttempts = new Map<string, { count: number; resetAt: number }>();

export function checkPinRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = pinAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    pinAttempts.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return true;
  }
  if (entry.count >= 5) {
    return false;
  }
  entry.count++;
  return true;
}

/**
 * Compact URL-safe Base64 encoding for self-contained quiz payload fallback.
 */
export function encodeQuizPayload(payload: unknown): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json).toString("base64url");
}

export function decodeQuizPayload<T>(token: string): T | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * AES-256-GCM authenticated encryption for private quiz answer validation.
 * Enables zero-dependency scoring on stateless serverless lambdas.
 */
const QUIZ_ENCRYPTION_SECRET = process.env.QUIZ_SECRET_KEY || "quiz_aes_secret_key_32bytes_2026_safe";
const DERIVED_KEY = crypto.createHash("sha256").update(QUIZ_ENCRYPTION_SECRET).digest();

export function encryptPayload(data: unknown): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", DERIVED_KEY, iv);
  const json = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptPayload<T>(ciphertext: string): T | null {
  try {
    const buf = Buffer.from(ciphertext, "base64url");
    if (buf.length < 28) return null; // 12 bytes IV + 16 bytes auth tag
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const encrypted = buf.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", DERIVED_KEY, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8")) as T;
  } catch {
    return null;
  }
}

