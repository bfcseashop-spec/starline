import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "admin@starlineb.com";
const ADMIN_PASSWORD = "Admin@2814";
const ADMIN_NAME = "Starline Admin";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing required environment variables.");
  console.error("Expected:");
  console.error("- SUPABASE_URL (or VITE_SUPABASE_URL)");
  console.error("- SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function findUserByEmail(email) {
  let page = 1;
  const perPage = 200;

  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const found = users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (users.length < perPage) return null;
    page += 1;
  }
}

async function upsertAdmin() {
  const existing = await findUserByEmail(ADMIN_EMAIL);
  let userId = existing?.id;

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        ...(existing.user_metadata || {}),
        full_name: ADMIN_NAME,
      },
    });
    if (error) throw error;
    console.log(`Updated existing auth user: ${ADMIN_EMAIL}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME },
    });
    if (error) throw error;
    if (!data.user?.id) throw new Error("User creation succeeded but no user id returned.");
    userId = data.user.id;
    console.log(`Created auth user: ${ADMIN_EMAIL}`);
  }

  if (!userId) {
    throw new Error("Unable to resolve admin user id.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        full_name: ADMIN_NAME,
      },
      { onConflict: "user_id" },
    );

  if (profileError) throw profileError;

  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert(
      {
        user_id: userId,
        role: "admin",
      },
      { onConflict: "user_id,role" },
    );

  if (roleError) throw roleError;

  console.log("Upserted profile and admin role.");
  console.log("Admin login is ready:");
  console.log(`email: ${ADMIN_EMAIL}`);
  console.log(`password: ${ADMIN_PASSWORD}`);
}

upsertAdmin().catch((error) => {
  console.error("admin:upsert failed");
  console.error(error);
  process.exit(1);
});
