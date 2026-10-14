/**
 * Centralized Redis Client for Upstash REST API and atomic commands.
 */

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, "");
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export function isRedisConfigured(): boolean {
  return Boolean(upstashUrl && upstashToken);
}

export function isProductionServerlessEnvironment(): boolean {
  return (
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    process.env.QUIZ_REQUIRE_DURABLE_STORAGE === "true"
  );
}

/**
 * In-memory simulated Redis for local testing of atomic Redis commands (HSET, HVALS, HDEL, DEL, INCR).
 */
export interface InMemoryRedisStore {
  hashes: Map<string, Map<string, string>>;
  strings: Map<string, string>;
  ttls: Map<string, number>;
}

let mockRedisStore: InMemoryRedisStore | null = null;

export function _enableMockRedis(enable: boolean): void {
  if (enable) {
    mockRedisStore = {
      hashes: new Map(),
      strings: new Map(),
      ttls: new Map(),
    };
  } else {
    mockRedisStore = null;
  }
}

export function _getMockRedisStore(): InMemoryRedisStore | null {
  return mockRedisStore;
}

function handleMockRedisCommand<T>(
  store: InMemoryRedisStore,
  args: (string | number)[]
): { ok: boolean; result: T | null; error?: string } {
  const [cmd, ...rest] = args;
  const command = String(cmd).toUpperCase();

  switch (command) {
    case "HSET": {
      const key = String(rest[0]);
      const field = String(rest[1]);
      const value = String(rest[2]);
      if (!store.hashes.has(key)) {
        store.hashes.set(key, new Map());
      }
      store.hashes.get(key)!.set(field, value);
      return { ok: true, result: 1 as unknown as T };
    }
    case "HVALS": {
      const key = String(rest[0]);
      const hash = store.hashes.get(key);
      const values = hash ? Array.from(hash.values()) : [];
      return { ok: true, result: values as unknown as T };
    }
    case "HDEL": {
      const key = String(rest[0]);
      const field = String(rest[1]);
      const hash = store.hashes.get(key);
      if (hash && hash.has(field)) {
        hash.delete(field);
        return { ok: true, result: 1 as unknown as T };
      }
      return { ok: true, result: 0 as unknown as T };
    }
    case "DEL": {
      let count = 0;
      for (const k of rest) {
        const key = String(k);
        if (store.hashes.delete(key)) count++;
        if (store.strings.delete(key)) count++;
      }
      return { ok: true, result: count as unknown as T };
    }
    case "GET": {
      const key = String(rest[0]);
      const val = store.strings.get(key) ?? null;
      return { ok: true, result: val as unknown as T };
    }
    case "SET": {
      const key = String(rest[0]);
      const val = String(rest[1]);
      store.strings.set(key, val);
      return { ok: true, result: "OK" as unknown as T };
    }
    case "INCR": {
      const key = String(rest[0]);
      const current = parseInt(store.strings.get(key) || "0", 10);
      const next = current + 1;
      store.strings.set(key, String(next));
      return { ok: true, result: next as unknown as T };
    }
    case "EXPIRE": {
      return { ok: true, result: 1 as unknown as T };
    }
    default:
      return { ok: false, result: null, error: `Unsupported mock command: ${command}` };
  }
}

/**
 * Executes an atomic command against Upstash Redis REST API or mock.
 */
export async function executeRedisCommand<T = unknown>(
  args: (string | number)[]
): Promise<{ ok: boolean; result: T | null; error?: string }> {
  if (mockRedisStore) {
    return handleMockRedisCommand<T>(mockRedisStore, args);
  }

  if (!upstashUrl || !upstashToken) {
    return { ok: false, result: null, error: "Redis not configured" };
  }

  try {
    const res = await fetch(upstashUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, result: null, error: `Upstash HTTP ${res.status}` };
    }

    const json = await res.json();
    return { ok: true, result: (json.result as T) ?? null };
  } catch (err) {
    return { ok: false, result: null, error: String(err) };
  }
}

/**
 * Executes a pipeline of commands in a single atomic network request.
 */
export async function executeRedisPipeline(
  commands: (string | number)[][]
): Promise<{ ok: boolean; results: unknown[]; error?: string }> {
  if (mockRedisStore) {
    const results = [];
    for (const cmd of commands) {
      const res = handleMockRedisCommand(mockRedisStore, cmd);
      results.push(res.result);
    }
    return { ok: true, results };
  }

  if (!upstashUrl || !upstashToken) {
    return { ok: false, results: [], error: "Redis not configured" };
  }

  try {
    const res = await fetch(`${upstashUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${upstashToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, results: [], error: `Upstash Pipeline HTTP ${res.status}` };
    }

    const json = await res.json();
    const results = Array.isArray(json) ? json.map((j: { result?: unknown }) => j.result) : [];
    return { ok: true, results };
  } catch (err) {
    return { ok: false, results: [], error: String(err) };
  }
}
