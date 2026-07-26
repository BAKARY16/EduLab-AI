import dotenv from "dotenv";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local", quiet: true });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await db.connect();
  const settingsResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
    headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
  });
  const settings = await settingsResponse.json();
  const [remote, local] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    db.query("select id::text, email from users"),
  ]);
  if (remote.error) throw remote.error;
  const localIds = new Set(local.rows.map((row) => row.id));
  const authIds = new Set(remote.data.users.map((user) => user.id));
  console.log(JSON.stringify({
    authUsers: authIds.size,
    appUsers: localIds.size,
    authWithoutProfile: [...authIds].filter((id) => !localIds.has(id)).length,
    profileWithoutAuth: [...localIds].filter((id) => !authIds.has(id)).length,
    emailAutoConfirm: settings.mailer_autoconfirm ?? null,
    emailSignupDisabled: settings.disable_signup ?? null,
  }));
} catch (error) {
  console.error(JSON.stringify({ ok: false, message: error.message }));
  process.exitCode = 1;
} finally {
  await db.end().catch(() => undefined);
}
