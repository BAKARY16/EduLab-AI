import dotenv from "dotenv";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";

dotenv.config({ path: ".env.local", quiet: true });
let baseUrl = "http://127.0.0.1:3000";
let server;
let logs = "";

const suffix = randomBytes(6).toString("hex");
const email = `http-${suffix}@example.com`;
const password = `Test${randomBytes(8).toString("hex")}A1`;
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
let userId;

async function waitForServer() {
  try {
    const existing = await fetch(`${baseUrl}/auth/signup`);
    if (existing.ok) return;
  } catch {}

  baseUrl = "http://127.0.0.1:3100";
  server = spawn("npm run dev -- --hostname 127.0.0.1 --port 3100", [], {
    cwd: process.cwd(), env: process.env, stdio: ["ignore", "pipe", "pipe"], windowsHide: true, shell: true,
  });
  server.stdout.on("data", (chunk) => { logs += chunk.toString(); });
  server.stderr.on("data", (chunk) => { logs += chunk.toString(); });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/auth/signup`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Serveur indisponible. ${logs.slice(-500)}`);
}

try {
  await db.connect();
  await waitForServer();
  const page = await fetch(`${baseUrl}/auth/signup`);
  const html = await page.text();
  const form = new FormData();
  const hiddenActions = [...html.matchAll(/<input[^>]+name="(\$ACTION[^"]+)"([^>]*)>/g)];
  if (hiddenActions.length === 0) throw new Error("Identifiant de l'action d'inscription introuvable");
  const decode = (value) => value
    .replaceAll("&quot;", '"').replaceAll("&#x27;", "'")
    .replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&");
  for (const [, actionName, attributes] of hiddenActions) {
    const actionValue = attributes.match(/value="([^"]*)"/)?.[1] ?? "";
    form.set(actionName, decode(actionValue));
  }
  form.set("name", "Test HTTP");
  form.set("email", email);
  form.set("password", password);
  form.set("role", "student");
  const signup = await fetch(`${baseUrl}/auth/signup`, { method: "POST", body: form, redirect: "manual" });
  const location = signup.headers.get("location");
  const cookie = signup.headers.get("set-cookie")?.split(";")[0];
  if (location !== "/onboarding" || !cookie) {
    const body = await signup.text();
    throw new Error(`Inscription sans redirection attendue (${signup.status}, ${location}). ${body.slice(0, 200)}`);
  }

  const appUser = await db.query("select id::text from users where email = $1", [email]);
  if (appUser.rowCount !== 1) throw new Error("Profil PostgreSQL absent après inscription HTTP");
  userId = appUser.rows[0].id;
  const onboarding = await fetch(`${baseUrl}/onboarding`, { headers: { cookie }, redirect: "manual" });
  if (onboarding.status !== 200) throw new Error(`Onboarding inaccessible (${onboarding.status})`);

  const loginPage = await fetch(`${baseUrl}/auth/login`);
  const loginHtml = await loginPage.text();
  const loginActions = [...loginHtml.matchAll(/<input[^>]+name="(\$ACTION[^"]+)"([^>]*)>/g)];
  const loginForm = new FormData();
  for (const [, actionName, attributes] of loginActions) {
    const actionValue = attributes.match(/value="([^"]*)"/)?.[1] ?? "";
    loginForm.set(actionName, decode(actionValue));
  }
  loginForm.set("email", email);
  loginForm.set("password", password);
  const login = await fetch(`${baseUrl}/auth/login`, { method: "POST", body: loginForm, redirect: "manual" });
  if (login.headers.get("location") !== "/onboarding" || !login.headers.get("set-cookie")) {
    throw new Error(`Connexion sans redirection attendue (${login.status}, ${login.headers.get("location")})`);
  }

  console.log(JSON.stringify({ signup: true, login: true, sessionCookie: true, onboarding: true, cleanup: "automatic" }));
} catch (error) {
  console.error(JSON.stringify({ signup: false, message: error.message }));
  process.exitCode = 1;
} finally {
  if (!userId) {
    const remote = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }).catch(() => null);
    userId = remote?.data?.users?.find((user) => user.email === email)?.id;
  }
  if (userId) {
    await db.query("delete from users where id = $1", [userId]).catch(() => undefined);
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
  }
  await db.end().catch(() => undefined);
  server?.kill();
}
