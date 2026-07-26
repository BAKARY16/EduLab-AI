import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const text = await readFile(path.join(root, ".env.local"), "utf8");
const env = Object.fromEntries(text.split(/\r?\n/).filter(line => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line)).map(line => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1).trim().replace(/^"|"$/g, "")];
}));
const pool = new pg.Pool({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const result = await pool.query("select id from users where email like 'demo-video-%@example.com'");
for (const row of result.rows) {
  await pool.query("delete from users where id=$1", [row.id]);
  await supabase.auth.admin.deleteUser(row.id).catch(() => undefined);
}
await pool.end();
console.log(JSON.stringify({ removed: result.rowCount }));
