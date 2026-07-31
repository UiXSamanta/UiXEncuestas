import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Store instance globally on window to ensure true singleton across HMR reloads
declare global {
  interface Window {
    __supabaseClient?: SupabaseClient;
  }
}

// Create a singleton Supabase client instance
// This prevents multiple GoTrueClient instances warning
export function getSupabaseClient() {
  // Check if we already have an instance on window (persists across HMR)
  if (typeof window !== 'undefined' && window.__supabaseClient) {
    return window.__supabaseClient;
  }

  // Create new instance
  const client = createClient(
    `https://${projectId}.supabase.co`,
    publicAnonKey,
    {
      auth: {
        // Use a unique storage key to avoid conflicts with other instances
        storageKey: 'survey-app-auth-token',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // Prevent duplicate session listeners
        flowType: 'pkce',
      }
    }
  );
  
  // Store on window to persist across HMR reloads
  if (typeof window !== 'undefined') {
    window.__supabaseClient = client;
  }
  
  console.log('✅ Supabase singleton client created');
  return client;
}

// Export the singleton instance - this ensures only one instance is created
export const supabase = getSupabaseClient();