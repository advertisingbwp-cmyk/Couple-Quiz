/**
 * Secure Request Body Reader with strict byte-size enforcement.
 * Prevents memory exhaustion and DoS by terminating oversized streams early,
 * even when Content-Length is missing, forged, or chunked.
 */

export type ParseJsonResult<T> =
  | { success: true; data: T }
  | { success: false; status: 400 | 413; error: string };

/**
 * Reads and parses a JSON request body while enforcing an exact byte limit.
 *
 * @param req Web API Request object
 * @param maxBytes Maximum allowed payload size in bytes
 */
export async function readJsonWithLimit<T = Record<string, unknown>>(
  req: Request,
  maxBytes: number
): Promise<ParseJsonResult<T>> {
  // 1. Check Content-Length header early if present
  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader !== null) {
    const trimmed = contentLengthHeader.trim();
    if (/^\d+$/.test(trimmed)) {
      const parsedLength = parseInt(trimmed, 10);
      if (parsedLength > maxBytes) {
        return {
          success: false,
          status: 413,
          error: `Payload too large. Maximum ${Math.round(maxBytes / 1024)}KB allowed.`,
        };
      }
    }
    // If Content-Length is non-numeric/malformed, proceed to stream reading to enforce actual bytes
  }

  let rawText = "";

  // 2. Read request body stream with streaming byte limit enforcement
  if (req.body) {
    const reader = req.body.getReader();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.byteLength;
          if (totalBytes > maxBytes) {
            try {
              await reader.cancel("Payload limit exceeded");
            } catch {
              // Ignore cancellation error if stream already closed
            }
            return {
              success: false,
              status: 413,
              error: `Payload too large. Maximum ${Math.round(maxBytes / 1024)}KB allowed.`,
            };
          }
          chunks.push(value);
        }
      }
    } catch (streamErr) {
      if (totalBytes > maxBytes) {
        return {
          success: false,
          status: 413,
          error: `Payload too large. Maximum ${Math.round(maxBytes / 1024)}KB allowed.`,
        };
      }
      throw streamErr;
    }

    if (chunks.length === 0) {
      return { success: false, status: 400, error: "Empty request payload." };
    }

    const totalLength = chunks.reduce((acc, c) => acc + c.byteLength, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      combined.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const decoder = new TextDecoder("utf-8");
    rawText = decoder.decode(combined);
  } else {
    // Fallback if req.body stream is null (e.g. mock test environment)
    try {
      rawText = await req.text();
    } catch {
      rawText = "";
    }

    if (!rawText.trim()) {
      return { success: false, status: 400, error: "Empty request payload." };
    }

    const actualBytes = Buffer.byteLength(rawText, "utf-8");
    if (actualBytes > maxBytes) {
      return {
        success: false,
        status: 413,
        error: `Payload too large. Maximum ${Math.round(maxBytes / 1024)}KB allowed.`,
      };
    }
  }

  if (!rawText.trim()) {
    return { success: false, status: 400, error: "Empty request payload." };
  }

  // 3. Parse JSON safely
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { success: false, status: 400, error: "Invalid JSON format." };
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      success: false,
      status: 400,
      error: "Invalid request payload. Expected a JSON object.",
    };
  }

  return { success: true, data: parsed as T };
}
