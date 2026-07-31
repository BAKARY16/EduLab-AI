import { LineChart, CheckCircle2, AlertCircle, Brain, TrendingUp, Target, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getProgressWithCourses, getRecentAttempts } from "@/lib/queries";
import { masteryLabel, nextActivity, adaptDifficulty } from "@/lib/ai";
import { Card, Badge, ProgressBar, SectionTitle, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SuiviPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const rows = await getProgressWithCourses(user.id);
  const attempts = await getRecentAttempts(user.id, 50);

  // ML-style signals
  const correct = attempts.filter((a) => a.correct).length;
  const total = attempts.length;
  const correctRate = total ? correct / total : 0;
  const avgHints = total ? attempts.reduce((a, b) => a + (b.hintsUsed ?? 0), 0) / total : 0;
  const mastery = rows.length ? rows.reduce((a, r) => a + (r.progress.mastery ?? 0), 0) / rows.length : 0;

  // Group mastery by subject
  const bySubject = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const s = r.course.subject;
    const cur = bySubject.get(s) || { sum: 0, n: 0 };
    cur.sum += r.progress.mastery ?? 0;
    cur.n += 1;
    bySubject.set(s, cur);
  }

  const recommendedDiff = adaptDifficulty(mastery);
  const recommendation = nextActivity(mastery);

  return (
    <div className="space-y-7">
      <SectionTitle
        eyebrow="Suivi personnalisé"
        title="Ta progression détaillée"
        subtitle="Tes réponses, ton temps de travail, les indices utilisés et tes erreurs alimentent une estimation de ta maîtrise par compétence."
      />

      {/* ML signals */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SignalCard label="Maîtrise globale" value={`${Math.round(mastery * 100)}%`} icon={TrendingUp} color="sky" />
        <SignalCard label="Taux de réussite" value={`${Math.round(correctRate * 100)}%`} icon={CheckCircle2} color="leaf" />
        <SignalCard label="Activités" value={`${total}`} icon={Brain} color="violet" />
        <SignalCard label="Difficulté conseillée" value={recommendedDiff} icon={Target} color="amber" />
      </div>

      <Card className="bg-gradient-to-r from-turq/5 to-violet-edu/5 p-5">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-turq text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-night-900">Recommandation pédagogique</h3>
            <p className="mt-1 text-sm text-night-800/80">{recommendation}</p>
            <p className="mt-1 text-xs text-night-800/60">
              Signaux analysés : taux de réussite, temps moyen, indices utilisés ({avgHints.toFixed(1)}), régularité et engagement.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-7 lg:grid-cols-2">
        {/* Per-subject mastery */}
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-bold text-night-900"><LineChart className="h-5 w-5 text-turq" /> Maîtrise par matière</h3>
          {bySubject.size === 0 ? (
            <EmptyState icon={<Brain className="h-5 w-5" />} title="Pas encore de données" description="Commence un cours pour voir ta progression apparaître." />
          ) : (
            <div className="mt-4 space-y-4">
              {Array.from(bySubject.entries()).map(([subject, v]) => {
                const m = v.sum / v.n;
                const lbl = masteryLabel(m);
                return (
                  <div key={subject}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-night-900">{subject}</span>
                      <Badge color={lbl.color}>{lbl.label} • {Math.round(m * 100)}%</Badge>
                    </div>
                    <ProgressBar value={m} color={lbl.color} className="mt-1.5" />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Competences detail */}
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-bold text-night-900"><Target className="h-5 w-5 text-leaf" /> Détail par compétence</h3>
          {rows.length === 0 ? (
            <p className="mt-3 text-sm text-night-800/60">Aucune compétence évaluée pour l’instant.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {rows.map(({ course, progress: p }) => {
                const m = p.mastery ?? 0;
                const lbl = masteryLabel(m);
                return (
                  <div key={course.key} className="flex items-center gap-3">
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ${lbl.color === "leaf" ? "bg-leaf/10 text-leaf" : lbl.color === "amber" ? "bg-amber-edu/10 text-amber-edu" : "bg-sky-edu/10 text-sky-edu"}`}>
                      {lbl.color === "leaf" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-night-900">{course.lesson}</p>
                      <p className="text-xs text-night-800/50">{course.skill}</p>
                    </div>
                    <Badge color={lbl.color}>{lbl.label}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="font-bold text-night-900">Points à revoir en priorité</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {rows.filter((r) => (r.progress.mastery ?? 0) < 0.6).length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-leaf"><CheckCircle2 className="h-4 w-4"/>Aucun point prioritaire détecté pour le moment.</p>
          ) : (
            rows.filter((r) => (r.progress.mastery ?? 0) < 0.6).map(({ course }) => (
              <Badge key={course.key} color="amber">{course.lesson}</Badge>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function SignalCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ComponentType<{ className?: string }>; color: string }) {
  const map: Record<string, string> = {
    sky: "bg-sky-edu/10 text-sky-edu", leaf: "bg-leaf/10 text-leaf",
    violet: "bg-violet-edu/10 text-violet-edu", amber: "bg-amber-edu/10 text-amber-edu",
  };
  return (
    <Card className="p-5">
      <div className={`mb-3 grid h-10 w-10 place-items-center rounded-lg ${map[color]}`}><Icon className="h-5 w-5" /></div>
      <p className="text-xl font-bold capitalize text-night-900">{value}</p>
      <p className="text-xs text-night-800/60">{label}</p>
    </Card>
  );
}
