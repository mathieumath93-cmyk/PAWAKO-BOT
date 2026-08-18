/**
 * Utility for safe API fetching with bulletproof JSON handling.
 * Prevents "Failed to execute 'json' on 'Response': Unexpected end of JSON input" errors.
 */

export interface SafeFetchResult<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string;
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<SafeFetchResult<T>> {
  try {
    const res = await fetch(input, init);
    const status = res.status;
    const contentType = res.headers.get('content-type') || '(aucun)';
    const text = await res.text();

    console.log(`[safeFetchJson 📡] Response received for ${typeof input === 'string' ? input : input.toString()}`);
    console.log(`  - Status Code: ${status}`);
    console.log(`  - Content-Type: ${contentType}`);
    console.log(`  - Raw Text Snippet (first 300 chars): "${text ? text.slice(0, 300) : '(RÉPONSE VIDE)'}"`);

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
        error: `Type de contenu non-JSON reçu (${contentType}): ${text.slice(0, 100)}`,
      };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch (jsonErr) {
      console.error(`[safeFetchJson 🔴] JSON Parsing Error: Failed to parse raw text to JSON:`, jsonErr);
      return {
        ok: false,
        status,
        data: null,
        error: res.ok
          ? `Réponse format invalide (non-JSON): ${text.slice(0, 100)}`
          : `Erreur serveur HTTP ${status}: ${text.slice(0, 100)}`,
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
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || 'Erreur de connexion réseau au serveur',
    };
  }
}
