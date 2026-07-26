import "server-only";
import type { CourseDef } from "@/lib/content";

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function getBackendHealth() {
  try {
    const response = await fetch(`${API_URL}/health`, { cache: "no-store", signal: AbortSignal.timeout(2000) });
    if (!response.ok) return null;
    return (await response.json()) as { status: string; database: string; llm_mode: string };
  } catch {
    return null;
  }
}

export async function resolveCourseCatalog(fallback: CourseDef[]): Promise<CourseDef[]> {
  try {
    const response = await fetch(`${API_URL}/courses?limit=100`, { cache: "no-store", signal: AbortSignal.timeout(2000) });
    if (!response.ok) return fallback;
    const rows = (await response.json()) as Array<{ key: string }>;
    const allowedKeys = new Set(rows.map((row) => row.key));
    const connected = fallback.filter((course) => allowedKeys.has(course.key));
    return connected.length > 0 ? connected : fallback;
  } catch {
    return fallback;
  }
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  academic_class: string;
  subject: string;
  document_type: string;
  official_status: string;
  validation_status: string;
  year: number | null;
  source_url: string | null;
  source_name: string | null;
  chunk_count: number;
  lessons?: string[];
}

export async function getKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
  try {
    const response = await fetch(`${API_URL}/documents`, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!response.ok) return [];
    return (await response.json()) as KnowledgeDocument[];
  } catch {
    return [];
  }
}

export interface VoiceHealth {
  tts: { provider: string; configured: boolean; voice_id: string | null };
  stt: { provider: string; configured: boolean; permission_available: boolean | null; detail: string | null };
}

export async function getVoiceHealth(): Promise<VoiceHealth | null> {
  try {
    const response = await fetch(`${API_URL}/voice/health`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    return (await response.json()) as VoiceHealth;
  } catch {
    return null;
  }
}
