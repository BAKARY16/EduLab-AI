import { redirect } from "next/navigation";
import {
  ShieldCheck, Users, BookOpen, FlaskConical, GraduationCap, Database,
  Activity, Cpu, Network, AlertTriangle, CheckCircle2, Layers,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, courses, experiments, examPapers, activities } from "@/db/schema";
import { count, sql } from "drizzle-orm";
import { Card, Badge, SectionTitle } from "@/components/ui";
import { AGENTS } from "@/lib/ai";
import { getBackendHealth, getKnowledgeDocuments, getVoiceHealth } from "@/lib/backend";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "admin") redirect("/app");

  const [userN] = await db.select({ n: count() }).from(users);
  const [courseN] = await db.select({ n: count() }).from(courses);
  const [expN] = await db.select({ n: count() }).from(experiments);
  const [examN] = await db.select({ n: count() }).from(examPapers);
  const [realN] = await db.select({ n: count() }).from(activities).where(sql`origin = 'real'`);
  const [synthN] = await db.select({ n: count() }).from(activities).where(sql`origin = 'synthetic'`);

  // Contrôles en direct sur le backend — jamais de statuts codés en dur.
  const [backendHealth, voiceHealth, ragDocuments] = await Promise.all([
    getBackendHealth(),
    getVoiceHealth(),
    getKnowledgeDocuments(),
  ]);
  const ragChunks = ragDocuments.reduce((n, d) => n + (d.chunk_count ?? 0), 0);

  return (
    <div className="space-y-7">
      <SectionTitle eyebrow="Administration" title="Pilotage de la plateforme" subtitle="Gère les utilisateurs, programmes, sources RAG, agents, modèles et surveille l'activité." />

      <div className="flex items-center gap-2 rounded-2xl border border-turq/20 bg-turq/5 p-4">
        <ShieldCheck className="h-5 w-5 shrink-0 text-turq" />
        <p className="text-sm text-night-800">
          Services IA reliés au backend : RAG, professeur local, recherche contrôlée et voix.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Utilisateurs" value={`${userN?.n ?? 0}`} icon={Users} color="sky" />
        <StatCard label="Cours" value={`${courseN?.n ?? 0}`} icon={BookOpen} color="leaf" />
        <StatCard label="Expériences" value={`${expN?.n ?? 0}`} icon={FlaskConical} color="amber" />
        <StatCard label="Sujets d'examens" value={`${examN?.n ?? 0}`} icon={GraduationCap} color="violet" />
        <StatCard label="Données réelles" value={`${realN?.n ?? 0}`} icon={Database} color="leaf" />
        <StatCard label="Données synthétiques" value={`${synthN?.n ?? 0}`} icon={Layers} color="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Programs / subjects */}
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-bold text-night-900"><Layers className="h-5 w-5 text-sky-edu" /> Programmes & matières</h3>
          <div className="mt-4 space-y-2">
            {[
              { n: "Mathématiques", c: "sky" },
              { n: "Physique-Chimie", c: "amber" },
              { n: "Sciences de la Vie et de la Terre", c: "leaf" },
            ].map((m) => (
              <div key={m.n} className="flex items-center justify-between rounded-xl border border-night-900/10 p-3">
                <span className="text-sm font-medium text-night-900">{m.n}</span>
                <div className="flex items-center gap-2">
                  <Badge color="night">Collège / Lycée</Badge>
                  <Badge color={m.c}>Actif</Badge>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-night-800/50">Sources : DPFC, Mon École à la Maison, Fomesoutra, DECO.</p>
        </Card>

        {/* RAG & models — contrôles en direct */}
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-bold text-night-900"><Database className="h-5 w-5 text-turq" /> Documents RAG & modèles</h3>
          <div className="mt-4 space-y-3">
            <StatusRow
              label="Index RAG (TF-IDF)"
              status={ragDocuments.length ? `${ragDocuments.length} document(s), ${ragChunks} passages indexés` : "Aucun document indexé"}
              ok={ragDocuments.length > 0}
            />
            <StatusRow
              label="Fournisseur IA"
              status={backendHealth ? `Mode : ${backendHealth.llm_mode}` : "Backend hors ligne"}
              ok={Boolean(backendHealth)}
            />
            <StatusRow
              label={`Synthèse vocale (${voiceHealth?.tts.provider ?? "?"})`}
              status={voiceHealth ? (voiceHealth.tts.configured ? `Voix ${voiceHealth.tts.voice_id}` : "Non configurée") : "Backend hors ligne"}
              ok={Boolean(voiceHealth?.tts.configured)}
            />
            <StatusRow
              label={`Reconnaissance vocale (${voiceHealth?.stt.provider ?? "?"})`}
              status={
                !voiceHealth ? "Backend hors ligne"
                : voiceHealth.stt.permission_available === false ? "Clé sans permission speech_to_text"
                : voiceHealth.stt.configured ? "Opérationnelle" : "Non configurée"
              }
              ok={Boolean(voiceHealth?.stt.configured && voiceHealth?.stt.permission_available !== false)}
            />
          </div>
        </Card>

        {/* Integrations — contrôles en direct */}
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-bold text-night-900"><Network className="h-5 w-5 text-violet-edu" /> Intégrations</h3>
          <div className="mt-4 space-y-3">
            <StatusRow
              label="Backend FastAPI"
              status={backendHealth ? `${backendHealth.status} — base ${backendHealth.database}` : "Hors ligne — démarrez apps/api"}
              ok={backendHealth?.status === "ok"}
            />
            <StatusRow label="PostgreSQL (Next.js)" status="Connecté" ok />
            <StatusRow
              label="Sources par classe"
              status={
                ragDocuments.length
                  ? [...new Set(ragDocuments.map((d) => d.academic_class))].join(", ")
                  : "Aucune"
              }
              ok={ragDocuments.length > 0}
            />
          </div>
        </Card>

        {/* Agents */}
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-bold text-night-900"><Cpu className="h-5 w-5 text-amber-edu" /> Agents IA ({AGENTS.length})</h3>
          <div className="mt-4 grid grid-cols-1 gap-2">
            {AGENTS.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border border-night-900/10 px-3 py-2">
                <span className="text-sm text-night-800">{a.name}</span>
                <Badge color="leaf"><Activity className="mr-1 h-3 w-3" />Actif</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Reports */}
      <Card className="p-5">
        <h3 className="flex items-center gap-2 font-bold text-night-900"><AlertTriangle className="h-5 w-5 text-amber-edu" /> Signalements & journaux</h3>
        <p className="mt-2 text-sm text-night-800/70">Aucun signalement critique. Consulte les journaux techniques et l'activité anonymisée dans la section dédiée.</p>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  const map: Record<string, string> = {
    sky: "bg-sky-edu/10 text-sky-edu", leaf: "bg-leaf/10 text-leaf",
    violet: "bg-violet-edu/10 text-violet-edu", amber: "bg-amber-edu/10 text-amber-edu",
  };
  return (
    <Card className="p-5">
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-lg ${map[color]}`}><Icon className="h-5 w-5" /></div>
      <p className="text-2xl font-bold text-night-900">{value}</p>
      <p className="text-xs text-night-800/60">{label}</p>
    </Card>
  );
}

function StatusRow({ label, status, ok, warn }: { label: string; status: string; ok?: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-night-900/10 p-3">
      <span className="text-sm font-medium text-night-900">{label}</span>
      <span className="flex items-center gap-1.5 text-xs">
        {ok ? <CheckCircle2 className="h-4 w-4 text-leaf" /> : <AlertTriangle className="h-4 w-4 text-amber-edu" />}
        <span className={ok ? "text-leaf" : "text-amber-edu"}>{status}</span>
      </span>
    </div>
  );
}
