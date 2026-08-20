import type { Context } from "npm:hono";
import * as kv from "./kv_store.tsx";

export function clientIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return c.req.header("x-real-ip") || c.req.header("cf-connecting-ip") || "unknown";
}

/** Simple fixed-window counter in KV. Returns null if allowed, or a 429 Response. */
export async function enforceRateLimit(
  c: Context,
  scope: string,
  maxRequests: number,
  windowMs: number,
): Promise<Response | null> {
  const bucket = Math.floor(Date.now() / windowMs);
  const ip = clientIp(c);
  const kvKey = `ratelimit:${scope}:${ip}:${bucket}`;

  const entry = (await kv.get(kvKey)) as { count?: number } | null;
  const count = (entry?.count ?? 0) + 1;

  if (count > maxRequests) {
    const retryAfterSec = Math.max(1, Math.ceil((windowMs - (Date.now() % windowMs)) / 1000));
    return c.json(
      { data: null, error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." },
      429,
      { "Retry-After": String(retryAfterSec) },
    );
  }

  await kv.set(kvKey, { count, bucket, ip, scope });
  return null;
}
