import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getBackendHealth } from "@/lib/backend";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    const backend = await getBackendHealth();
    return Response.json({ ok: true, database: "ok", backend: backend ?? "offline" });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
