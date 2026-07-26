import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: "Corps de requête invalide." }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${API_URL}/voice/synthesize`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.json().catch(() => ({}));
      return NextResponse.json(
        { detail: detail?.detail || `Le service voix a échoué (${upstream.status}).` },
        { status: upstream.status },
      );
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "content-type": "audio/mpeg",
        "cache-control": upstream.headers.get("cache-control") || "private, max-age=2592000",
        "x-edulab-cache": upstream.headers.get("x-edulab-cache") || "MISS",
      },
    });
  } catch {
    return NextResponse.json(
      { detail: "Backend indisponible. Démarrez le service API (apps/api)." },
      { status: 503 },
    );
  }
}
