"use client";
import { FormEvent, useEffect, useState } from "react";
import { Bot, Loader2, Send, Server, ShieldCheck, Cpu, Database, Gauge, TriangleAlert } from "lucide-react";
import { RobotTeacher, type RobotState } from "@/components/RobotTeacher";
import { Card, Badge, Button } from "@/components/ui";

type Result = { answer?: string; model?: string; adapter?: string; latency_seconds?: number; detail?: string; json?: Record<string, unknown> | null; rag_used?: boolean; sources?: Array<{document_id:string;title:string;score:number;official_status:string}> };
type Overview = {
  model: { base: string; adapter: string; trained: boolean; device: string; method: string; metrics: Record<string, number | string> };
  dataset: { total: number; splits: Record<string, number>; classes: string[]; subjects: string[] };
  agents: Array<{ id: string; name: string; status: string; role: string }>;
};

export function TeacherModelLab() {
  const [instruction, setInstruction] = useState("Explique la loi d'Ohm à un élève de Troisième avec un exemple et une question de contrôle.");
  const [className, setClassName] = useState("Troisième");
  const [subject, setSubject] = useState("Physique-Chimie");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    fetch("/api/teacher-model")
      .then(async (r) => {
        setOnline(r.ok);
        if (r.ok) setOverview(await r.json());
      })
      .catch(() => setOnline(false));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/teacher-model", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ instruction, class_name: className, subject, max_new_tokens: 96 }),
      });
      setResult(await r.json());
      setOnline(r.ok);
    } catch {
      setResult({ detail: "Impossible de joindre le modèle." });
      setOnline(false);
    } finally {
      setLoading(false);
    }
  }

  const robot: RobotState = loading ? "reflexion" : result?.answer ? "parole" : online ? "salutation" : "arrivee";
  const metrics = overview?.model.metrics ?? {};
  const evalBefore = asNumber(metrics.eval_loss_before);
  const evalAfter = asNumber(metrics.eval_loss_after);
  const improved = evalBefore !== null && evalAfter !== null ? evalAfter < evalBefore : null;

  return (
    <div className="space-y-6">
      {/* Status strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Server} label="Modèle" value={overview?.model.base.split("/").pop() || "Hors ligne"} />
        <StatTile icon={Cpu} label="Adaptation" value={overview ? `${overview.model.method} (rang ${metrics.rank ?? "?"})` : "—"} />
        <StatTile icon={Database} label="Dataset d'entraînement" value={overview ? `${overview.dataset.total} exemples` : "—"} />
        <StatTile icon={Bot} label="Agents connectés" value={overview ? `${overview.agents.length}` : "—"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Robot + connection state */}
        <Card className="p-5">
          <div className="flex justify-center">
            <RobotTeacher state={robot} size={220} />
          </div>
          <div className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${online ? "bg-leaf/10 text-leaf" : "bg-amber-edu/10 text-amber-edu"}`}>
            <Server className="h-4 w-4" />
            {online ? "Modèle LoRA local connecté" : "Service modèle indisponible"}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-night-800/60">
            Réponses générées par <strong>Qwen2.5-0.5B-Instruct</strong> avec l&apos;adaptateur LoRA EduLab. Validation humaine recommandée avant tout usage pédagogique réel.
          </p>

          {overview && (
            <div className="mt-5 border-t border-night-900/10 pt-4">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-night-800/50">
                <Gauge className="h-3.5 w-3.5" /> Métriques d&apos;entraînement réelles
              </p>
              <dl className="mt-3 space-y-2 text-sm">
                <MetricRow label="Perte de validation — avant" value={evalBefore?.toFixed(3)} />
                <MetricRow label="Perte de validation — après" value={evalAfter?.toFixed(3)} good={improved} />
                <MetricRow label="Exemples d'entraînement utilisés" value={metrics.train_examples as number | undefined} />
                <MetricRow label="Étapes d'entraînement" value={metrics.max_steps as number | undefined} />
                <MetricRow label="Matériel" value={metrics.device as string | undefined} />
              </dl>
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-edu/10 p-2.5 text-[11px] leading-relaxed text-amber-edu">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {(metrics.train_examples as number | undefined ?? 0) < 50
                  ? "Preuve d'entraînement minimale (peu d'exemples, peu d'étapes) réalisée en local, faute de GPU. Un entraînement plus complet est prévu sur Colab GPU."
                  : "Entraînement local sur CPU, sans GPU. Validation humaine recommandée avant tout usage pédagogique réel."}
              </div>
            </div>
          )}
        </Card>

        {/* Lab form + result */}
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-violet-edu" />
            <h2 className="text-xl font-bold text-night-900">Laboratoire du professeur IA</h2>
          </div>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold text-night-900">
                Classe
                <select value={className} onChange={(e) => setClassName(e.target.value)} className="mt-1 w-full rounded-xl border border-night-900/15 p-3">
                  <option>Troisième</option>
                  <option>Terminale C</option>
                  <option>Terminale D</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-night-900">
                Matière
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full rounded-xl border border-night-900/15 p-3">
                  <option>Mathématiques</option>
                  <option>Physique-Chimie</option>
                  <option>SVT</option>
                </select>
              </label>
            </div>
            <label className="block text-sm font-semibold text-night-900">
              Demande
              <textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} rows={5} className="mt-1 w-full rounded-xl border border-night-900/15 p-3" />
            </label>
            <Button type="submit" disabled={loading || instruction.trim().length < 3}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {loading ? "Génération réelle en cours…" : "Générer avec le modèle"}
            </Button>
            <p className="text-xs text-night-800/50">
              Inférence CPU locale : compte 1 à 3 minutes par réponse tant qu&apos;aucun GPU n&apos;est utilisé.
            </p>
          </form>

          {result && (
            <div className="mt-6 rounded-2xl border border-night-900/10 bg-night-950 p-5 text-slate-100">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-turq">
                <ShieldCheck className="h-4 w-4" />
                <span>{result.model || "Erreur"}</span>
                {result.adapter && <Badge color="turq">{result.adapter}</Badge>}
                {result.latency_seconds !== undefined && <span className="text-slate-400">· {result.latency_seconds}s</span>}
              </div>
              {result.json ? <JsonAnswer data={result.json} /> : <p className="whitespace-pre-wrap text-sm leading-7">{result.answer || result.detail}</p>}
              {result.rag_used && <Badge color="leaf" className="mt-3">RAG utilisé</Badge>}
              {result.sources && result.sources.length > 0 && <div className="mt-4 border-t border-white/10 pt-3"><p className="text-xs font-semibold text-white/60">Sources utilisées</p>{result.sources.map(source=><p key={source.document_id} className="mt-1 text-xs text-white/45">• {source.title} · score {source.score.toFixed(2)} · {source.official_status}</p>)}</div>}
            </div>
          )}
        </Card>
      </div>

      {overview && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-bold text-night-900">
              <Bot className="h-5 w-5 text-amber-edu" /> Agents alimentés par le modèle
            </h3>
            <div className="flex flex-wrap gap-2 text-xs text-night-800/60">
              {Object.entries(overview.dataset.splits).map(([split, n]) => (
                <Badge key={split} color="sky">
                  {split} · {n}
                </Badge>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {overview.agents.map((a) => (
              <div key={a.id} className="rounded-xl border border-night-900/10 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-night-900">{a.name}</p>
                  <Badge color="leaf">{a.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-night-800/60">{a.role}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="mb-2 grid h-9 w-9 place-items-center rounded-lg bg-sky-edu/10 text-sky-edu">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wide text-night-800/50">{label}</p>
      <p className="mt-0.5 truncate font-bold text-night-900">{value}</p>
    </Card>
  );
}

function MetricRow({ label, value, good }: { label: string; value: string | number | undefined; good?: boolean | null }) {
  if (value === undefined || value === null || Number.isNaN(value as number)) return null;
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-night-800/60">{label}</dt>
      <dd className={`font-semibold ${good === true ? "text-leaf" : good === false ? "text-amber-edu" : "text-night-900"}`}>{value}</dd>
    </div>
  );
}

function JsonAnswer({ data }: { data: Record<string, unknown> }) {
  const order = ["teacher_text", "board_content", "avatar_state", "checkpoint", "sources"];
  const keys = [...order.filter((k) => k in data), ...Object.keys(data).filter((k) => !order.includes(k))];
  return (
    <div className="space-y-3 text-sm">
      {keys.map((key) => (
        <div key={key}>
          <p className="text-[11px] font-bold uppercase tracking-wide text-turq/80">{key}</p>
          <p className="mt-0.5 whitespace-pre-wrap leading-6 text-slate-100">
            {typeof data[key] === "string" ? (data[key] as string) : JSON.stringify(data[key])}
          </p>
        </div>
      ))}
    </div>
  );
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && !Number.isNaN(value) ? value : null;
}
