import { NextRequest, NextResponse } from "next/server";

const MODEL_URL = process.env.TEACHER_MODEL_URL || "http://127.0.0.1:8010";
const BACKEND_URL = process.env.API_URL || "http://127.0.0.1:8000/api/v1";

export async function GET() {
  try {
    const response = await fetch(`${MODEL_URL}/metadata`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`model health ${response.status}`);
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ status: "unavailable", trained: false }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  try {
    const response = await fetch(`${BACKEND_URL}/tutor/generate`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...body, use_rag: true }), signal: AbortSignal.timeout(240000), cache: "no-store",
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json({ detail: "Le modèle local n'est pas démarré. Lancez le service teacher-model." }, { status: 503 });
  }
}
