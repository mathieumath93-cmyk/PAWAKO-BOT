/**
 * Utility to detect runtime environment (Google AI Studio Preview vs Deployed Full-Stack Backend).
 */

let cachedBackendStatus: boolean | null = null;

export const AI_STUDIO_DISCORD_NOTICE =
  'Action Discord indisponible dans Google AI Studio (pas de serveur /api ni bot permanent). Déployez sur Render/Railway pour activer le bot et les routes Discord.';

export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined';
}

export function isAiStudioPreview(): boolean {
  if (!isBrowserEnvironment()) return false;
  const hostname = window.location.hostname;
  return (
    hostname.includes('ais-dev') ||
    hostname.includes('ais-pre') ||
    hostname.includes('webcontainer') ||
    hostname.includes('stackblitz') ||
    hostname.includes('google')
  );
}

/**
 * Quick check to verify if Express backend (/api/health or similar) is listening and responding.
 */
export async function checkBackendAvailability(): Promise<boolean> {
  if (cachedBackendStatus !== null) {
    return cachedBackendStatus;
  }

  try {
    const res = await fetch('/api/health', { method: 'GET', headers: { Accept: 'application/json' } });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('json')) {
      cachedBackendStatus = true;
      return true;
    }
  } catch {
    // Ignore fetch error
  }

  cachedBackendStatus = false;
  return false;
}

export function setBackendAvailabilityCache(status: boolean) {
  cachedBackendStatus = status;
}
