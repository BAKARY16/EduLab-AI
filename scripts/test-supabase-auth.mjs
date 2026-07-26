import dotenv from "dotenv";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

dotenv.config({ path: ".env.local", quiet: true });

const suffix = randomBytes(6).toString("hex");
const email = `integration-${suffix}@example.invalid`;
const password = `T3st-${randomBytes(12).toString("base64url")}!`;
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const auth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
let userId;

try {
  await db.connect();
  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: "Test intégration", role: "student" },
  });
  if (created.error || !created.data.user) throw created.error ?? new Error("Utilisateur Auth absent");
  userId = created.data.user.id;

  await db.query(
    "insert into users (id, name, email, password_hash, role) values ($1, $2, $3, $4, 'student')",
    [userId, "Test intégration", email, "supabase-managed"],
  );
  await db.query("insert into profiles (user_id, onboarding_completed) values ($1, false)", [userId]);

  const signedIn = await auth.auth.signInWithPassword({ email, password });
  if (signedIn.error || signedIn.data.user?.id !== userId) {
    throw signedIn.error ?? new Error("Identité retournée incorrecte");
  }
  const profile = await db.query("select user_id from profiles where user_id = $1", [userId]);
  if (profile.rowCount !== 1) throw new Error("Profil applicatif absent");

  console.log(JSON.stringify({ auth: true, profile: true, cleanup: "automatic" }));
} catch (error) {
  console.error(JSON.stringify({ auth: false, message: error.message }));
  process.exitCode = 1;
} finally {
  if (userId) {
    await db.query("delete from users where id = $1", [userId]).catch(() => undefined);
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
  }
  await db.end().catch(() => undefined);
}
