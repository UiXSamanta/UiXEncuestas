import * as kv from "./kv_store.tsx";

const FLAG = "meta:response_keys_v2";

export function responseKey(encuestaId: string, responseId: string): string {
  return `respuesta:${encuestaId}:${responseId}`;
}

export function responsePrefix(encuestaId: string): string {
  return `respuesta:${encuestaId}:`;
}

let migratePromise: Promise<void> | null = null;

async function runMigration(): Promise<void> {
  const flag = await kv.get(FLAG);
  if (flag?.done) return;

  const all = await kv.getByPrefix("respuesta:");
  for (const row of all) {
    if (!row?.id || !row?.encuesta_id) continue;
    const nextKey = responseKey(row.encuesta_id, row.id);
    await kv.set(nextKey, row);
    const legacyKey = `respuesta:${row.id}`;
    if (legacyKey !== nextKey) {
      await kv.del(legacyKey);
    }
  }

  await kv.set(FLAG, { done: true, migrated_at: new Date().toISOString() });
}

export async function migrateResponseKeysOnce(): Promise<void> {
  if (!migratePromise) migratePromise = runMigration();
  await migratePromise;
}

export async function getResponsesForSurvey(encuestaId: string): Promise<any[]> {
  await migrateResponseKeysOnce();
  return await kv.getByPrefix(responsePrefix(encuestaId));
}

export async function deleteResponsesForSurvey(encuestaId: string): Promise<number> {
  await migrateResponseKeysOnce();
  const rows = await kv.getByPrefix(responsePrefix(encuestaId));
  for (const row of rows) {
    if (!row?.id) continue;
    await kv.del(responseKey(encuestaId, row.id));
    await kv.del(`respuesta:${row.id}`);
  }
  return rows.length;
}
