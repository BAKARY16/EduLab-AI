import dotenv from "dotenv";
import pg from "pg";
import { readFile } from "node:fs/promises";

dotenv.config({ path: ".env.local", quiet: true });

const migration = process.argv[2];
if (!migration) {
  console.error("Usage: node scripts/migrate.mjs <migration.sql>");
  process.exit(2);
}

const sql = await readFile(migration, "utf8");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  await client.query("begin");
  await client.query(sql);
  await client.query("commit");
  console.log(JSON.stringify({ migrated: true, file: migration }));
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  console.error(JSON.stringify({ migrated: false, code: error.code, message: error.message }));
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
