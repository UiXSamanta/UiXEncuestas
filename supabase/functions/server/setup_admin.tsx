import * as kv from "./kv_store.tsx";

// LEGACY — do not deploy. First admin is created in the Supabase dashboard.

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
