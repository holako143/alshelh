/**
 * Safe HTTP API Client
 * Guaranteed never to throw "JSON.parse: unexpected character at line 1 column 1"
 * Automatically guards against HTML error pages, non-JSON text, network drops, and serverless crashes.
 */

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(input, init);

    // Guard against non-2xx responses that might contain HTML/plain text error pages
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const rawText = await res.text();

    if (!rawText || !rawText.trim()) {
      return {
        ok: res.ok,
        status: res.status,
        data: null,
        error: res.ok ? undefined : `HTTP ${res.status}`,
      };
    }

    const trimmed = rawText.trim();
    // Verify JSON signature (starts with { or [) before attempting JSON.parse
    const isJsonLike = trimmed.startsWith('{') || trimmed.startsWith('[');

    if (!isJsonLike || !contentType.includes('application/json')) {
      // It was an HTML error page (like 404 / 500 FUNCTION_INVOCATION_FAILED)
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Non-JSON response from server (status ${res.status})`,
      };
    }

    let parsed: T;
    try {
      parsed = JSON.parse(trimmed) as T;
    } catch {
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Failed to parse JSON response (status ${res.status})`,
      };
    }

    return {
      ok: res.ok,
      status: res.status,
      data: parsed,
      error: res.ok ? undefined : (parsed as any)?.error || `HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || 'Network request failed',
    };
  }
}
