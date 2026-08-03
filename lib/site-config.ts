/** Public Supabase project config — safe to use in Edge Middleware. */
export const SUPABASE_PROJECT_ID = 'buqpkujiozvrsizitwti';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1cXBrdWppb3p2cnNpeml0d3RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MjA2NzAsImV4cCI6MjA4NzA5NjY3MH0.iTySxtz8EPrxaJ8qGs0f8OOlvy96eetX6wmM7zjzELc';

export const API_BASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-824603ba`;

/** Single-segment app routes that must never be treated as legacy survey UUIDs. */
export const RESERVED_ROOT_SEGMENTS = new Set([
  'login',
  'admin',
  'preview',
  'survey',
  'builder',
  'analytics',
  'comparador',
  'settings',
  'notifications',
  'admin-request',
  'forgot-password',
  'reset-password',
  'survey-error',
  'survey-loader',
  'survey-welcome',
  'survey-thankyou',
]);

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
