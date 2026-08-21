-- Fase 0: la tabla KV no debe ser leíble ni escribible por anon/authenticated.
-- service_role (Edge Functions) bypasea RLS. Aplicar en el SQL Editor del proyecto
-- o con: supabase db push
--
-- Proyecto: buqpkujiozvrsizitwti
-- Tabla: public.kv_store_824603ba

ALTER TABLE IF EXISTS public.kv_store_824603ba ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.kv_store_824603ba FROM PUBLIC;
REVOKE ALL ON TABLE public.kv_store_824603ba FROM anon;
REVOKE ALL ON TABLE public.kv_store_824603ba FROM authenticated;

GRANT ALL ON TABLE public.kv_store_824603ba TO service_role;

-- Sin policies para anon/authenticated = denegado por defecto cuando RLS está activo.
