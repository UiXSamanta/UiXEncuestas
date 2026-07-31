import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

// This script creates the initial admin user
// Run this once to set up the first admin: samanta.camacho@upax.com.mx

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

async function createInitialAdmin() {
  const email = "samanta.camacho@upax.com.mx";
  const password = "1qaz2wsx3edc";
  const name = "Samanta Camacho";

  console.log("🔍 Checking if initial admin already exists...");
  console.log("Email:", email);

  try {
    // Check if user already exists by trying to list all users
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (!listError && existingUsers?.users) {
      const existingUser = existingUsers.users.find(u => u.email === email);
      
      if (existingUser) {
        console.log("✓ Initial admin already exists");
        console.log("User ID:", existingUser.id);
        
        // Make sure admin info is in KV store
        const existingAdmin = await kv.get(`admin:${existingUser.id}`);
        if (!existingAdmin) {
          await kv.set(`admin:${existingUser.id}`, {
            id: existingUser.id,
            email: existingUser.email,
            name: name,
            can_access_notifications: true,
            can_access_settings: true,
            created_at: new Date().toISOString(),
          });
          console.log("✓ Admin info added to KV store");
        } else if (existingAdmin.can_access_notifications === undefined || existingAdmin.can_access_settings === undefined) {
          // Update existing admin with permissions if they don't have them
          await kv.set(`admin:${existingUser.id}`, {
            ...existingAdmin,
            can_access_notifications: true,
            can_access_settings: true,
          });
          console.log("✓ Admin permissions updated in KV store");
        }
        
        console.log("\n=== Initial Admin Ready ===" );
        console.log("Email:", email);
        console.log("Password:", password);
        console.log("===========================\n");
        return;
      }
    }

    console.log("Creating new admin user...");
    
    // Create user with Supabase Auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error("❌ Error creating user:", error);
      return;
    }

    console.log("✓ User created in Supabase Auth");
    console.log("User ID:", data.user.id);

    // Store admin info in KV store
    await kv.set(`admin:${data.user.id}`, {
      id: data.user.id,
      email: data.user.email,
      name: name,
      can_access_notifications: true,
      can_access_settings: true,
      created_at: new Date().toISOString(),
    });

    console.log("✓ Admin info stored in KV store");
    console.log("\n=== Initial Admin Created Successfully ===");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("==========================================\n");

  } catch (error) {
    console.error("❌ Error in setup:", error);
  }
}

// Run on server startup
createInitialAdmin();

export { createInitialAdmin };