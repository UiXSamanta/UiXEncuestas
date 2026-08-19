export const UIX_SPACE_URL = 'https://uix-space.vercel.app';
export const UIX_SSO_SESSION_KEY = 'uix_sso_session';

export function markUixSpaceSsoSession(): void {
  localStorage.setItem(UIX_SSO_SESSION_KEY, '1');
}

export function clearUixSpaceSsoSession(): void {
  localStorage.removeItem(UIX_SSO_SESSION_KEY);
}

export function isUixSpaceSsoUser(user?: { source?: string } | null): boolean {
  if (user?.source === 'uix-space-sso') return true;
  try {
    return localStorage.getItem(UIX_SSO_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}
