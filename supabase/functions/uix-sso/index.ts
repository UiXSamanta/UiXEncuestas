import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const SECRET = Deno.env.get("UIX_SSO_SECRET") ?? "";
const ALLOWED_ORIGINS = [
  Deno.env.get("UIX_ENCUESTAS_URL") ?? "https://uixencuestas.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function b64urlToJson(s: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));
}

async function verifyJwt(token: string): Promise<string | null> {
  if (!SECRET) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    b64urlToBytes(sig),
    new TextEncoder().encode(`${header}.${payload}`),
  );
  if (!ok) return null;

  const head = b64urlToJson(header);
  if (head.alg !== "HS256") return null;

  const claims = b64urlToJson(payload) as { email?: string; exp?: number };
  if (typeof claims.exp !== "number" || claims.exp < Math.floor(Date.now() / 1000)) return null;
  if (!claims.email) return null;

  return String(claims.email).trim().toLowerCase();
}

const DEFAULT_SSO_DOMAINS = ["upax.com.mx"];

function allowedSsoDomains(): string[] {
  const raw = Deno.env.get("UIX_SSO_ALLOWED_DOMAINS") ?? "";
  const fromEnv = raw.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : DEFAULT_SSO_DOMAINS;
}

function isSsoEmailAllowed(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return false;
  return allowedSsoDomains().includes(domain);
}

async function ensureAdminRecord(userId: string, email: string, name?: string | null) {
  const existing = (await kv.get(`admin:${userId}`)) as Record<string, unknown> | null;
  if (existing) return;

  const displayName = name?.trim() || email.split("@")[0];
  await kv.set(`admin:${userId}`, {
    id: userId,
    email,
    name: displayName,
    role: "Editor",
    can_access_notifications: false,
    can_access_settings: false,
    must_change_password: false,
    source: "uix-space-sso",
    created_at: new Date().toISOString(),
  });
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405, origin);
  }

  const { token } = await req.json().catch(() => ({ token: null }));
  if (!token) return json({ error: "sin token" }, 400, origin);

  const email = await verifyJwt(String(token));
  if (!email) return json({ error: "token invalido" }, 401, origin);

  if (!isSsoEmailAllowed(email)) {
    return json({ error: "dominio no autorizado" }, 403, origin);
  }

  await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { origen: "uix-space", name: email.split("@")[0] },
  }).catch(() => null);

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error || !data?.properties?.hashed_token) {
    return json({ error: "no se pudo crear la sesion" }, 500, origin);
  }

  const user = data.user;
  if (user?.id) {
    await ensureAdminRecord(
      user.id,
      email,
      user.user_metadata?.name as string | undefined,
    );
  }

  return json({ token_hash: data.properties.hashed_token }, 200, origin);
});
