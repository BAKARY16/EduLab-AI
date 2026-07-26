import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ detail: "Corps de requête invalide." }, { status: 400 });
  }
  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return NextResponse.json({ detail: "Fichier audio manquant." }, { status: 400 });
  }

  try {
    const upstreamForm = new FormData();
    upstreamForm.append("file", audio, "recording.webm");

    const upstream = await fetch(`${API_URL}/voice/transcribe`, {
      method: "POST",
      body: upstreamForm,
      signal: AbortSignal.timeout(90000),
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return NextResponse.json(
        { detail: data?.detail || "Le service de transcription a échoué." },
        { status: upstream.status },
      );
    }

    return NextResponse.json({ text: data.text ?? "", confidence: data.confidence ?? null, provider: data.provider ?? "unknown" });
  } catch {
    return NextResponse.json(
      { detail: "Backend indisponible. Démarrez le service API (apps/api)." },
      { status: 503 },
    );
  }
}
