import { projectId } from '../../../utils/supabase/info';

export const UIX_SPACE_URL = 'https://uix-space.vercel.app';
export const UIX_SSO_FUNCTION_URL =
  `https://${projectId}.supabase.co/functions/v1/uix-sso`;

export const UIX_SSO_TOKEN_KEY = '_uix_sso_token';

/** Read SSO JWT from sessionStorage (early capture) or URL hash/search. */
export function consumeSsoToken(): string | null {
  const stored = sessionStorage.getItem(UIX_SSO_TOKEN_KEY);
  if (stored) {
    sessionStorage.removeItem(UIX_SSO_TOKEN_KEY);
    return stored;
  }

  const fromHash = new URLSearchParams(window.location.hash.slice(1)).get('token');
  const fromSearch = new URLSearchParams(window.location.search).get('token');
  return fromHash ?? fromSearch;
}

/** Persist token before SPA boot clears the URL (called from index.html inline script). */
export function captureSsoTokenFromUrl(): void {
  const path = window.location.pathname;
  if (path !== '/sso' && path !== '/api/auth/sso') return;

  const fromHash = new URLSearchParams(window.location.hash.slice(1)).get('token');
  const fromSearch = new URLSearchParams(window.location.search).get('token');
  const token = fromHash ?? fromSearch;
  if (!token) return;

  sessionStorage.setItem(UIX_SSO_TOKEN_KEY, token);
  window.history.replaceState(null, '', path);
}
