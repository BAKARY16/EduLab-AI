"use client";

import { useState } from "react";
import {
  PencilRuler,
  Send,
  Lightbulb,
  Sparkles,
  CheckCircle2,
  Search,
  ArrowRight,
  Loader2,
  BookMarked,
} from "lucide-react";
import { SectionTitle, Card, Badge } from "@/components/ui";
import { recordAttempt, logActivity } from "@/app/actions";

type Phase = "idle" | "analyzing" | "pipeline";
type HomeworkStep = { agent: string; title: string; body: string };

export default function HomeworkHelpPage() {
  const [statement, setStatement] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [pipeline, setPipeline] = useState<HomeworkStep[] | null>(null);
  const [attempt, setAttempt] = useState("");
  const [hintIndex, setHintIndex] = useState(-1);
  const [showSolution, setShowSolution] = useState(false);
  const [hint, setHint] = useState("");
  const [solution, setSolution] = useState("");

  async function queryTeacher(instruction: string) {
    const response = await fetch("/api/teacher-model", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ instruction, class_name: "Terminale D", subject: "Mathématiques", max_new_tokens: 128 }) });
    const result = await response.json() as { answer?: string; detail?: string };
    if (!response.ok) throw new Error(result.detail || "Service professeur indisponible");
    return result.answer || "Le corpus ne contient pas assez d'informations fiables.";
  }

  async function analyze() {
    if (!statement.trim()) return;
    setPhase("analyzing");
    try {
      const analysis = await queryTeacher(`Analyse cet exercice sans donner la réponse finale. Identifie la notion, les données, l'inconnue et les propriétés utiles. Énoncé: ${statement}`);
      setPipeline([
        { agent: "Agent Recherche RAG", title: "1. Analyse de l'énoncé", body: analysis },
        { agent: "Assistant de devoirs", title: "2. Ta tentative", body: "Écris ta propre tentative avant de demander un indice." },
        { agent: "Professeur IA", title: "3. Indices progressifs", body: "Chaque indice est généré à partir des cours retrouvés, sans révéler immédiatement la solution." },
        { agent: "Agent Évaluateur", title: "4. Correction et méthode", body: "La correction confronte ta tentative au raisonnement sourcé, étape par étape." },
      ]);
      setPhase("pipeline");
      setHintIndex(-1);
      setShowSolution(false);
      setAttempt("");
      setHint(""); setSolution("");
    } catch { setPhase("idle"); }
  }

  async function nextHint() {
    const ni = hintIndex + 1;
    setHintIndex(ni);
    setHint(await queryTeacher(`Donne uniquement l'indice progressif numéro ${ni + 1}, sans donner la réponse finale. Énoncé: ${statement}. Tentative: ${attempt || "aucune"}`));
    recordAttempt({
      scope: "homework",
      statement,
      attempt: attempt || undefined,
      hintsUsed: ni + 1,
      correct: undefined,
      timeSpentSec: 0,
    });
  }

  async function revealSolution() {
    setSolution(await queryTeacher(`Corrige au tableau étape par étape cet exercice. Vérifie le domaine, écris chaque transformation et conclus. Énoncé: ${statement}. Tentative de l'apprenant: ${attempt || "aucune"}`));
    setShowSolution(true);
    const correct = attempt.trim().length > 2;
    recordAttempt({
      scope: "homework",
      statement,
      attempt: attempt || undefined,
      hintsUsed: hintIndex + 1,
      correct,
      timeSpentSec: 0,
    });
    logActivity({ activityType: "homework_solved", meta: { hints: hintIndex + 1, revealed: true } });
  }

  return (
    <div className="space-y-7">
      <SectionTitle
        eyebrow="Aide aux devoirs"
        title="L'IA t'aide… sans faire le travail à ta place"
        subtitle="L'IA analyse l'énoncé, te demande d'abord ta tentative, puis donne des indices et corrige avant la solution."
      />

      {/* Input */}
      <Card className="p-5">
        <label className="text-sm font-semibold text-night-900">Colle ton énoncé d'exercice</label>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={3}
          placeholder="Ex : Un conducteur ohmique de résistance R = 20 Ω est parcouru par un courant d'intensité I = 0,3 A. Calcule la tension à ses bornes."
          className="mt-2 w-full rounded-xl border border-night-900/15 p-3 text-sm outline-none focus:border-sky-edu"
        />
        <button
          onClick={analyze}
          disabled={!statement.trim() || phase === "analyzing"}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-turq px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
        >
          {phase === "analyzing" ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Analyse en cours…</>
          ) : (
            <><Search className="h-4 w-4" /> Analyser l'énoncé</>
          )}
        </button>
      </Card>

      {/* Pipeline */}
      {phase === "pipeline" && pipeline && (
        <div className="space-y-4">
          {/* Step 1 — analysis */}
          <PipelineCard icon={Search} color="sky" title={pipeline[0].title} agent={pipeline[0].agent}>
            <pre className="whitespace-pre-wrap font-sans text-sm text-night-800">{pipeline[0].body}</pre>
          </PipelineCard>

          {/* Step 2 — attempt */}
          <PipelineCard icon={PencilRuler} color="violet" title={pipeline[1].title} agent={pipeline[1].agent}>
            <p className="mb-2 text-sm text-night-800">{pipeline[1].body}</p>
            <textarea
              value={attempt}
              onChange={(e) => setAttempt(e.target.value)}
              rows={2}
              placeholder="Écris ta tentative ici…"
              className="w-full rounded-xl border border-night-900/15 p-3 text-sm outline-none focus:border-violet-edu"
            />
          </PipelineCard>

          {/* Step 3 — hints */}
          <PipelineCard icon={Lightbulb} color="amber" title={pipeline[2].title} agent={pipeline[2].agent}>
            <p className="mb-2 text-sm text-night-800">{pipeline[2].body}</p>
            <div className="space-y-2">
              {hintIndex >= 0 && (
                <div className="animate-float-up rounded-xl bg-amber-edu/10 p-3 text-sm text-night-800">
                  <span className="font-semibold text-amber-edu">Indice {hintIndex + 1} : </span>
                  {hint}
                </div>
              )}
              <button
                onClick={nextHint}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-edu/10 px-3 py-2 text-xs font-semibold text-amber-edu hover:bg-amber-edu/20"
              >
                <Lightbulb className="h-4 w-4" /> {hintIndex >= 0 ? "Indice suivant" : "Demander un indice"}
              </button>
            </div>
          </PipelineCard>

          {/* Step 4 — solution */}
          <PipelineCard icon={CheckCircle2} color="leaf" title={pipeline[3].title} agent={pipeline[3].agent}>
            <p className="mb-3 text-sm text-night-800">{pipeline[3].body}</p>
            {!showSolution ? (
              <button
                onClick={revealSolution}
                className="inline-flex items-center gap-1.5 rounded-lg bg-leaf/10 px-4 py-2 text-sm font-semibold text-leaf hover:bg-leaf/20"
              >
                <BookMarked className="h-4 w-4" /> Voir la solution détaillée
              </button>
            ) : (
              <div className="animate-float-up rounded-xl border border-leaf/20 bg-leaf/5 p-4 text-sm text-night-800">
                <p className="font-semibold text-leaf">Solution & méthode</p>
                <p className="mt-1 whitespace-pre-wrap">{solution}</p>
              </div>
            )}
          </PipelineCard>

          <p className="flex items-center gap-2 text-xs text-night-800/50">
            <Sparkles className="h-3.5 w-3.5" /> Tes tentatives sont enregistrées pour adapter ton suivi.
          </p>
        </div>
      )}

      {phase === "idle" && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Search, t: "Analyse", d: "L'IA identifie la notion et récupère le contexte." },
            { icon: Lightbulb, t: "Indices", d: "Des indices progressifs, sans donner la réponse." },
            { icon: CheckCircle2, t: "Correction", d: "Méthode expliquée puis solution détaillée." },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <Card key={i} className="p-4">
                <Icon className="h-6 w-6 text-turq" />
                <p className="mt-2 font-semibold text-night-900">{s.t}</p>
                <p className="text-sm text-night-800/70">{s.d}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PipelineCard({
  icon: Icon, color, title, agent, children,
}: {
  icon: typeof Send; color: string; title: string; agent: string; children: React.ReactNode;
}) {
  const map: Record<string, string> = {
    sky: "bg-sky-edu/10 text-sky-edu", violet: "bg-violet-edu/10 text-violet-edu",
    amber: "bg-amber-edu/10 text-amber-edu", leaf: "bg-leaf/10 text-leaf",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${map[color]}`}><Icon className="h-5 w-5" /></span>
        <div>
          <p className="font-bold text-night-900">{title}</p>
          <p className="text-xs text-night-800/50">{agent}</p>
        </div>
      </div>
      <div className="mt-3">{children}</div>
    </Card>
  );
}
