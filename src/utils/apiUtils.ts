/**
 * Utility for safe API fetching with bulletproof JSON handling.
 * Prevents "Failed to execute 'json' on 'Response': Unexpected end of JSON input" errors.
 */

import { AI_STUDIO_DISCORD_NOTICE, setBackendAvailabilityCache } from './runtimeEnv';

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string;
  backendMissing?: boolean;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    let fetchInput = input;
    if (typeof window === 'undefined' && typeof fetchInput === 'string' && fetchInput.startsWith('/')) {
      const port = process.env.PORT || '3000';
      fetchInput = `http://127.0.0.1:${port}${fetchInput}`;
    }

    const res = await fetch(fetchInput, init);
    const status = res.status;
    const contentType = res.headers.get('content-type') || '(aucun)';
    const text = await res.text();
    const isApiRoute = typeof input === 'string' && input.startsWith('/api');

    console.log(`[safeFetchJson 📡] Response received for ${typeof input === 'string' ? input : input.toString()}`);
    console.log(`  - Status Code: ${status}`);
    console.log(`  - Content-Type: ${contentType}`);

    // Check if HTML is returned for an API route (Vite SPA fallback when backend isn't running)
    const isHtmlResponse = contentType.toLowerCase().includes('text/html') || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
    if (isApiRoute && isHtmlResponse) {
      console.warn(`[safeFetchJson ⚠️] /api route returned HTML instead of JSON! Backend Node server is absent.`);
      setBackendAvailabilityCache(false);
      return {
        ok: false,
        status: status || 404,
        data: null,
        error: AI_STUDIO_DISCORD_NOTICE,
        backendMissing: true,
      };
    }

    if (!text || !text.trim()) {
      console.warn(`[safeFetchJson ⚠️] Empty response body received! Cannot parse JSON.`);
      return {
        ok: false,
        status,
        data: null,
        error: res.ok
          ? `Le serveur a renvoyé une réponse vide (HTTP ${status})`
          : `Erreur serveur HTTP ${status} (réponse vide)`,
      };
    }

    // Verify valid Content-Type before attempting to parse JSON
    const isJsonContentType = contentType.toLowerCase().includes('json');
    if (!isJsonContentType) {
      console.warn(`[safeFetchJson ⚠️] Content-Type "${contentType}" does not indicate JSON! Skipping JSON parse.`);
      return {
        ok: false,
        status,
        data: null,
        error: isApiRoute ? AI_STUDIO_DISCORD_NOTICE : `Type de contenu non-JSON reçu (${contentType}): ${text.slice(0, 100)}`,
        backendMissing: isApiRoute,
      };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
      if (isApiRoute) setBackendAvailabilityCache(true);
    } catch (jsonErr) {
      console.warn(`[safeFetchJson Info] Non-JSON payload received:`, jsonErr);
      return {
        ok: false,
        status,
        data: null,
        error: isApiRoute
          ? AI_STUDIO_DISCORD_NOTICE
          : (res.ok
            ? `Réponse format invalide (non-JSON): ${text.slice(0, 100)}`
            : `Erreur serveur HTTP ${status}: ${text.slice(0, 100)}`),
        backendMissing: isApiRoute,
      };
    }

    if (!res.ok) {
      const errMsg =
        parsed?.error ||
        parsed?.message ||
        parsed?.details ||
        `Erreur serveur HTTP ${status}`;
      return {
        ok: false,
        status,
        data: parsed,
        error: errMsg,
      };
    }

    return {
      ok: true,
      status,
      data: parsed,
      error: '',
    };
  } catch (err: any) {
    const isApiRoute = typeof input === 'string' && input.startsWith('/api');
    return {
      ok: false,
      status: 0,
      data: null,
      error: isApiRoute ? AI_STUDIO_DISCORD_NOTICE : (err?.message || 'Erreur de connexion réseau au serveur'),
      backendMissing: isApiRoute,
    };
  }
}

export interface RetryOptions {
  timeoutMs?: number; // Default 8000ms
  maxRetries?: number; // Default 3
  retryDelayMs?: number; // Default 500ms
}

/**
 * Fetch helper with AbortController timeout and exponential backoff retries.
 * Handles Discord API timeouts and transient network failures cleanly.
 */
export async function safeFetchJsonWithRetryAndTimeout<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<SafeFetchResult<T>> {
  const timeoutMs = options.timeoutMs ?? 8000;
  const maxRetries = options.maxRetries ?? 3;
  let retryDelayMs = options.retryDelayMs ?? 500;

  let lastResult: SafeFetchResult<T> = {
    ok: false,
    status: 0,
    data: null,
    error: 'Initialisation de la requête',
  };

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const mergedInit: RequestInit = {
        ...init,
        signal: controller.signal,
      };

      lastResult = await safeFetchJson<T>(input, mergedInit);
      clearTimeout(timeoutId);

      // If request succeeded or got a non-retriable client error (400, 401, 403, 404), return immediately
      if (lastResult.ok || (lastResult.status >= 400 && lastResult.status <= 404)) {
        return lastResult;
      }

      console.warn(`[safeFetchJson Retry ${attempt}/${maxRetries}] Request to ${input} returned status ${lastResult.status}. Retrying in ${retryDelayMs}ms...`);
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err?.name === 'AbortError';
      lastResult = {
        ok: false,
        status: isTimeout ? 504 : 0,
        data: null,
        error: isTimeout
          ? `Délai d'attente réseau dépassé (${timeoutMs}ms - Timeout Discord API)`
          : `Erreur réseau: ${err?.message || 'Connexion interrompue'}`,
      };

      console.warn(`[safeFetchJson Retry ${attempt}/${maxRetries}] ${lastResult.error}. Retrying in ${retryDelayMs}ms...`);
    }

    if (attempt < maxRetries) {
      await new Promise((res) => setTimeout(res, retryDelayMs));
      retryDelayMs = Math.round(retryDelayMs * 1.5);
    }
  }

  return lastResult;
}
