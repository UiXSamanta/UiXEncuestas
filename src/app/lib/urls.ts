const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Current site origin (e.g. https://uixencuestas.vercel.app). */
export function getSiteOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  const envUrl = import.meta.env.VITE_SITE_URL as string | undefined;
  return envUrl?.replace(/\/$/, '') ?? '';
}

/** Live survey welcome URL — saves responses to Supabase. */
export function getSurveyUrl(id: string): string {
  return `${getSiteOrigin()}/survey/${id}`;
}

/**
 * Legacy Figma Sites format: /{uuid}
 * Kept for backward compatibility with links already shared or stored.
 */
export function getLegacySurveyUrl(id: string): string {
  return `${getSiteOrigin()}/${id}`;
}

/** Preview URL — does NOT save responses to Supabase. */
export function getPreviewUrl(id: string): string {
  return `${getSiteOrigin()}/preview/${id}`;
}

export function isSurveyUuid(value: string): boolean {
  return UUID_RE.test(value);
}
