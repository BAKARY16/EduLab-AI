import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local", quiet: true });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10_000,
});

try {
  await client.connect();
  const result = await client.query(`
    select current_database() as database,
           current_user as username,
           exists(
             select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'users'
           ) as users_table
  `);
  const row = result.rows[0];
  console.log(JSON.stringify({
    connected: true,
    database: row.database,
    username: row.username,
    usersTable: row.users_table,
  }));
} catch (error) {
  console.error(JSON.stringify({
    connected: false,
    code: error.code,
    message: error.message,
  }));
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
