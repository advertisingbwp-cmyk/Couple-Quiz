import { AUTH_WINDOW_SCRIPT, DELETE_QUIZ_SCRIPT, RECORD_ATTEMPT_SCRIPT } from "./redisScripts";
type Command = (string | number)[];
type RedisResult<T> = { ok: boolean; result: T | null; error?: string };
const config = () => ({
  url: process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, ""),
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
export function isProductionServerlessEnvironment(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1" ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) || process.env.QUIZ_REQUIRE_DURABLE_STORAGE === "true";
}
function canMock(): boolean {
  return process.env.NODE_ENV === "test" && !isProductionServerlessEnvironment();
}
export function isRedisConfigured(): boolean {
  const { url, token } = config();
  return Boolean((canMock() && mockRedisStore) || (url && token));
}
export interface InMemoryRedisStore {
  hashes: Map<string, Map<string, string>>;
  strings: Map<string, string>;
  // Absolute expiry; lazily evicted before every operation.
  ttls: Map<string, number>;
}
let mockRedisStore: InMemoryRedisStore | null = null;
let timeOffset = 0;
export function _enableMockRedis(enable: boolean): void {
  if (enable && !canMock()) throw new Error("Mock Redis is allowed only in isolated test mode.");
  mockRedisStore = enable ? { hashes: new Map(), strings: new Map(), ttls: new Map() } : null;
  timeOffset = 0;
}
export function _getMockRedisStore(): InMemoryRedisStore | null {
  if (!canMock()) throw new Error("Test mode required.");
  return mockRedisStore;
}
export function _advanceMockRedisTime(milliseconds: number): void {
  if (!canMock() || milliseconds < 0) throw new Error("Invalid test clock operation.");
  timeOffset += milliseconds;
}
function handleMock(store: InMemoryRedisStore, args: Command): RedisResult<unknown> {
  const now = Date.now() + timeOffset;
  for (const [key, expiry] of store.ttls) {
    if (expiry <= now) { store.strings.delete(key); store.hashes.delete(key); store.ttls.delete(key); }
  }
  const [cmd, ...values] = args.map(String);
  const key = values[0];
  const ok = (result: unknown): RedisResult<unknown> => ({ ok: true, result });
  const error = (message: string): RedisResult<unknown> => ({ ok: false, result: null, error: message });
  const exists = (k: string) => store.strings.has(k) || store.hashes.has(k);
  const drop = (k: string) => {
    const count = exists(k) ? 1 : 0;
    store.strings.delete(k); store.hashes.delete(k); store.ttls.delete(k); return count;
  };
  const fixedArity: Record<string, number> = { GET: 1, SET: 2, INCR: 1, HVALS: 1, TTL: 1, EXPIRE: 2 };
  const arity = fixedArity[cmd.toUpperCase()];
  if ((arity !== undefined && values.length !== arity) ||
      (["DEL", "EXISTS"].includes(cmd.toUpperCase()) && values.length < 1) ||
      (cmd.toUpperCase() === "HDEL" && values.length < 2))
    return error("Wrong number of arguments");
  if (["HSET", "HVALS", "HDEL"].includes(cmd.toUpperCase()) && store.strings.has(key)) return error("WRONGTYPE");
  if (["GET", "INCR"].includes(cmd.toUpperCase()) && store.hashes.has(key)) return error("WRONGTYPE");
  switch (cmd.toUpperCase()) {
    case "HSET": {
      if (values.length < 3 || values.length % 2 !== 1) return error("Wrong number of arguments");
      const hash = store.hashes.get(key) || new Map<string, string>();
      let added = 0;
      for (let i = 1; i < values.length; i += 2) { if (!hash.has(values[i])) added++; hash.set(values[i], values[i + 1]); }
      store.hashes.set(key, hash); return ok(added);
    }
    case "HVALS": return ok(Array.from(store.hashes.get(key)?.values() || []));
    case "HDEL": {
      const hash = store.hashes.get(key); let removed = 0;
      for (const field of values.slice(1)) if (hash?.delete(field)) removed++;
      if (hash?.size === 0) drop(key);
      return ok(removed);
    }
    case "DEL": return ok(values.reduce((sum, k) => sum + drop(k), 0));
    case "EXISTS": return ok(values.reduce((sum, k) => sum + Number(exists(k)), 0));
    case "GET": return ok(store.strings.get(key) ?? null);
    case "SET": drop(key); store.strings.set(key, values[1]); return ok("OK");
    case "INCR": {
      const current = store.strings.get(key) ?? "0";
      if (!/^-?\d+$/.test(current) || String(BigInt(current)) !== current) return error("Value is not an integer");
      const next = BigInt(current) + 1n;
      if (next > 9223372036854775807n || next < -9223372036854775808n) return error("Increment would overflow");
      store.strings.set(key, String(next)); return ok(Number(next));
    }
    case "EXPIRE": {
      if (!/^-?\d+$/.test(values[1])) return error("Invalid expiry");
      if (!exists(key)) return ok(0);
      if (Number(values[1]) <= 0) drop(key);
      else store.ttls.set(key, now + Number(values[1]) * 1000);
      return ok(1);
    }
    case "TTL": return ok(!exists(key) ? -2 : !store.ttls.has(key) ? -1 : Math.floor((store.ttls.get(key)! - now + 500) / 1000));
    case "EVAL": {
      // Models only the application's known scripts, not a general Lua runtime.
      const [script, keyCount, ...rest] = values;
      if (script === AUTH_WINDOW_SCRIPT && keyCount === "1") {
        const read = handleMock(store, ["GET", rest[0]]);
        if (!read.ok) return read;
        const count = Number(read.result ?? 0);
        if (!Number.isInteger(count) || count < 0) return error("Invalid failure counter");
        if (count >= 5) return ok(0);
        if (rest[1] === "success") return ok(1);
        const incr = handleMock(store, ["INCR", rest[0]]);
        if (!incr.ok) return incr;
        if (incr.result === 1) handleMock(store, ["EXPIRE", rest[0], 600]);
        return ok(-1);
      }
      if (script === DELETE_QUIZ_SCRIPT && keyCount === "2") {
        const removed = drop(rest[0]); drop(rest[1]); return ok(removed);
      }
      if (script === RECORD_ATTEMPT_SCRIPT && keyCount === "2")
        return exists(rest[0]) ? handleMock(store, ["HSET", rest[1], rest[2], rest[3]]) : ok(-1);
      return error("Unsupported mock Lua script");
    }
    default: return error("Unsupported mock command");
  }
}
function decode<T>(value: unknown): RedisResult<T> {
  if (!value || typeof value !== "object") return { ok: false, result: null, error: "Malformed Redis response" };
  const object = value as Record<string, unknown>;
  if (object.error !== undefined) return { ok: false, result: null, error: "Redis command failed" };
  if (!Object.hasOwn(object, "result")) return { ok: false, result: null, error: "Missing Redis result" };
  return { ok: true, result: object.result as T | null };
}
async function request(endpoint: string, payload: unknown): Promise<unknown> {
  const { url, token } = config();
  if (!url || !token) throw new Error("Redis unavailable");
  const response = await fetch(url + endpoint, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload), cache: "no-store", signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Redis transport failed");
  return response.json();
}
export async function executeRedisCommand<T = unknown>(args: Command): Promise<RedisResult<T>> {
  if (canMock() && mockRedisStore) return handleMock(mockRedisStore, args) as RedisResult<T>;
  try { return decode<T>(await request("", args)); }
  catch { return { ok: false, result: null, error: "Redis unavailable" }; }
}
/** Batches transport; a Redis pipeline is NOT an atomic transaction. */
export async function executeRedisPipeline(commands: Command[]): Promise<{ ok: boolean; results: unknown[]; error?: string }> {
  let replies: RedisResult<unknown>[];
  if (canMock() && mockRedisStore) replies = commands.map(command => handleMock(mockRedisStore!, command));
  else {
    try {
      const raw = await request("/pipeline", commands);
      if (!Array.isArray(raw) || raw.length !== commands.length) throw new Error("Malformed pipeline");
      replies = raw.map(decode);
    } catch { return { ok: false, results: [], error: "Redis pipeline unavailable" }; }
  }
  return { ok: replies.every(reply => reply.ok), results: replies.map(reply => reply.result),
    ...(replies.some(reply => !reply.ok) ? { error: "Redis pipeline command failed" } : {}) };
}
