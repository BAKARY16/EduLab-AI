import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCourseResource } from "@/server/courseResources";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ sourceId: string }> }) {
  const { sourceId } = await context.params;
  const resource = getCourseResource(sourceId);
  if (!resource?.available || !resource.localPath) {
    return NextResponse.json({ error: "Ressource indisponible" }, { status: 404 });
  }

  const workspace = path.resolve(/* turbopackIgnore: true */ process.cwd());
  const filePath = path.resolve(workspace, resource.localPath);
  if (!filePath.startsWith(`${workspace}${path.sep}`)) {
    return NextResponse.json({ error: "Chemin de ressource invalide" }, { status: 400 });
  }

  try {
    const file = await readFile(filePath);
    return new Response(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${sourceId}.pdf"`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }
}
