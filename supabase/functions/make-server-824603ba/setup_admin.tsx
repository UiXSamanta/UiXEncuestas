import * as kv from "./kv_store.tsx";

// Bootstrap of the first admin is done in the Supabase dashboard (Auth → Users).
// This module must not create users or log credentials on cold start.

export async function ensureAdminRecord(userId: string, email: string, name: string) {
  const existing = await kv.get(`admin:${userId}`);
  if (existing) return existing;

  const admin = {
    id: userId,
    email,
    name,
    can_access_notifications: true,
    can_access_settings: true,
    created_at: new Date().toISOString(),
  };
  await kv.set(`admin:${userId}`, admin);
  return admin;
}
