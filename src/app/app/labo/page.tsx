import Link from "next/link";
import { FlaskConical, ArrowRight, FlaskRound } from "lucide-react";
import { EXPERIMENTS } from "@/lib/content";
import { getCurrentUser } from "@/lib/auth";
import { Card, Badge, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const ICONS: Record<string, string> = {
  "Physique-Chimie": "amber",
  Mathématiques: "sky",
  SVT: "leaf",
};

export default async function LabPage() {
  await getCurrentUser();

  const bySubject = new Map<string, typeof EXPERIMENTS>();
  for (const e of EXPERIMENTS) {
    if (!bySubject.has(e.subject)) bySubject.set(e.subject, []);
    bySubject.get(e.subject)!.push(e);
  }

  return (
    <div className="space-y-7">
      <SectionTitle
        eyebrow="Laboratoire virtuel"
        title="Expériences scientifiques réalistes"
        subtitle="Manipule les paramètres, observe les résultats en temps réel, tire des conclusions et réponds au quiz. Classées par matière et par leçon."
      />

      <div className="flex items-start gap-3 rounded-2xl border border-amber-edu/20 bg-amber-edu/5 p-4 text-sm text-night-800">
        <FlaskRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-edu" />
        <p>
          Ces simulations sont calculées en temps réel (SVG, Canvas) à partir des lois physiques et
          mathématiques du programme. Aucune donnée n'est simulée : les résultats sont réels.
        </p>
      </div>

      {Array.from(bySubject.entries()).map(([subject, items]) => {
        const color = ICONS[subject] || "sky";
        const tone = color === "amber" ? "bg-amber-edu/10 text-amber-edu" : color === "leaf" ? "bg-leaf/10 text-leaf" : "bg-sky-edu/10 text-sky-edu";
        return (
          <section key={subject} className="space-y-4">
            <h2 className="flex items-center gap-3 text-xl font-bold text-night-900">
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><FlaskConical className="h-5 w-5" /></span>
              {subject}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((e) => (
                <Link key={e.key} href={`/app/labo/${e.key}`} className="group rounded-2xl border border-night-900/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className={`grid h-10 w-10 place-items-center rounded-lg ${tone}`}><FlaskConical className="h-5 w-5" /></span>
                    <Badge color={color}>{e.difficulty}</Badge>
                  </div>
                  <h3 className="mt-3 font-bold text-night-900">{e.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-night-800/70">{e.summary}</p>
                  <p className="mt-2 text-xs text-night-800/50">Leçon : {e.lesson}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-edu">
                    Lancer l'expérience <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
