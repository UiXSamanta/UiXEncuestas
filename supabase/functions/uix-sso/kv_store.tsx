import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

const client = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

export const set = async (key: string, value: unknown): Promise<void> => {
  const { error } = await client().from("kv_store_824603ba").upsert({ key, value });
  if (error) throw new Error(error.message);
};

export const get = async (key: string): Promise<unknown> => {
  const { data, error } = await client()
    .from("kv_store_824603ba")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value;
};
