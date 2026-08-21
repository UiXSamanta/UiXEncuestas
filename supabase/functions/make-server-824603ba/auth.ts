import type { Context } from "npm:hono";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

export const PRIMARY_ADMIN_EMAIL = "samanta.camacho@upax.com.mx";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

export type AuthUser = { id: string; email?: string };

type AuthOk = { user: AuthUser; admin: Record<string, unknown>; error: null };
type AuthFail = { user: null; admin: null; error: Response };

function bearerFromHeader(c: Context): string {
  const header = c.req.header("Authorization") || "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token || token === ANON_KEY) return "";
  return token;
}

export async function getOptionalUser(c: Context): Promise<AuthUser | null> {
  const token = bearerFromHeader(c);
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email };
}

export function isPrimaryAdmin(email?: string | null): boolean {
  return !!email && email.toLowerCase() === PRIMARY_ADMIN_EMAIL;
}

export function canAccessSettings(user: AuthUser, admin: Record<string, unknown> | null): boolean {
  return isPrimaryAdmin(user.email) || admin?.can_access_settings === true;
}

export function canAccessNotifications(user: AuthUser, admin: Record<string, unknown> | null): boolean {
  return isPrimaryAdmin(user.email) || admin?.can_access_notifications === true;
}

export async function requireAdmin(c: Context): Promise<AuthOk | AuthFail> {
  const user = await getOptionalUser(c);
  if (!user) {
    return { user: null, admin: null, error: c.json({ data: null, error: "No autorizado" }, 401) };
  }

  const admin = (await kv.get(`admin:${user.id}`)) as Record<string, unknown> | null;
  if (!admin && !isPrimaryAdmin(user.email)) {
    return { user: null, admin: null, error: c.json({ data: null, error: "No autorizado" }, 401) };
  }

  return {
    user,
    admin: admin ?? { id: user.id, email: user.email },
    error: null,
  };
}

export async function requirePermission(
  c: Context,
  perm: "settings" | "notifications",
): Promise<AuthOk | AuthFail> {
  const auth = await requireAdmin(c);
  if (auth.error) return auth;

  const allowed = perm === "settings"
    ? canAccessSettings(auth.user, auth.admin)
    : canAccessNotifications(auth.user, auth.admin);

  if (!allowed) {
    return { user: null, admin: null, error: c.json({ data: null, error: "Permisos insuficientes" }, 403) };
  }
  return auth;
}

export function stripAdminSecrets<T>(admin: T): T {
  if (!admin || typeof admin !== "object") return admin;
  const { temp_password: _ignored, ...rest } = admin as Record<string, unknown>;
  return rest as T;
}

export function stripProyectoSecrets<T>(proyecto: T): T {
  if (!proyecto || typeof proyecto !== "object") return proyecto;
  const { password, _token: _ignored, ...rest } = proyecto as Record<string, unknown>;
  return { ...rest, hasPassword: !!password } as T;
}

export function stripTrashSecrets<T>(item: T): T {
  if (!item || typeof item !== "object") return item;
  const row = item as Record<string, unknown>;
  if (row.type === "proyecto" && row.data && typeof row.data === "object") {
    return { ...row, data: stripProyectoSecrets(row.data) } as T;
  }
  return item;
}

export async function persistAdminWithoutTempPassword(admin: Record<string, unknown>) {
  if (!admin?.id || admin.temp_password == null) return stripAdminSecrets(admin);
  const { temp_password: _ignored, ...rest } = admin;
  await kv.set(`admin:${admin.id}`, rest);
  return rest;
}

export const PRODUCTION_SITE_URL = "https://uix-encuestas.figma.site";

export const ALLOWED_CORS_ORIGINS = [
  (Deno.env.get("SITE_URL") ?? PRODUCTION_SITE_URL).replace(/\/$/, ""),
  PRODUCTION_SITE_URL,
  "https://uixencuestas.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  ...(Deno.env.get("CORS_EXTRA_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];

/** Vercel preview URLs: uixencuestas-*.vercel.app (same project) */
const VERCEL_PREVIEW_ORIGIN = /^https:\/\/uixencuestas(-[a-z0-9-]+)*\.vercel\.app$/i;

const FIGMA_SITE_ORIGIN = /^https:\/\/uix-encuestas\.figma\.site$/i;

export function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  if (ALLOWED_CORS_ORIGINS.includes(origin)) return true;
  return VERCEL_PREVIEW_ORIGIN.test(origin) || FIGMA_SITE_ORIGIN.test(origin);
}

export function resolveCorsOrigin(origin: string | undefined): string | null {
  if (origin && isAllowedCorsOrigin(origin)) return origin;
  return null;
}
