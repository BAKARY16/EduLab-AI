import Link from "next/link";
import { GraduationCap, ArrowRight, Clock, Layers } from "lucide-react";
import { EXAMS } from "@/lib/content";
import { getCurrentUser } from "@/lib/auth";
import { Card, Badge, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ExamsPage() {
  const user = await getCurrentUser();
  const examClass = user?.profile?.examClass;
  const cycle = user?.profile?.cycle;

  const grouped = new Map<string, typeof EXAMS>();
  for (const e of EXAMS) {
    const k = `${e.exam}`;
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k)!.push(e);
  }

  return (
    <div className="space-y-7">
      <SectionTitle
        eyebrow="Préparation aux examens"
        title="Sujets BEPC & BAC"
        subtitle="Sujets classés par année, matière, chapitre et difficulté. Mode entraînement, examen chronométré, correction expliquée, analyse des erreurs et fiches de révision."
      />

      <div className="flex items-start gap-3 rounded-2xl border border-violet-edu/20 bg-violet-edu/5 p-4 text-sm text-night-800">
        <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-violet-edu" />
        <p>
          {examClass
            ? `Tu es en classe d'examen (${cycle || "BEPC/BAC"}). Les fiches de révision sont générées à partir de tes erreurs.`
            : "Coche « classe d'examen » dans ton profil pour activer un suivi dédié."}{" "}
          Chaque sujet affiche sa source et son année. Les contenus non encore vérifiés doivent être utilisés comme entraînement, jamais comme document officiel de référence.
        </p>
      </div>

      {Array.from(grouped.entries()).map(([exam, items]) => (
        <section key={exam} className="space-y-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-night-900">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${exam === "BAC" ? "bg-violet-edu/10 text-violet-edu" : "bg-sky-edu/10 text-sky-edu"}`}>
              <GraduationCap className="h-5 w-5" />
            </span>
            {exam}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((e) => {
              const diffColor = e.difficulty === "facile" ? "leaf" : e.difficulty === "difficile" ? "amber" : "sky";
              return (
                <Link key={e.key} href={`/app/examens/${e.key}`} className="group rounded-2xl border border-night-900/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-center justify-between">
                    <Badge color="sky"><Clock className="mr-1 h-3 w-3" />{e.year}</Badge>
                    <Badge color={diffColor}>{e.difficulty}</Badge>
                  </div>
                  <h3 className="mt-3 font-bold text-night-900">{e.subject}</h3>
                  <p className="text-xs text-night-800/60">{e.title}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-night-800/50">
                    <Layers className="h-3.5 w-3.5" /> {e.questions.length} questions
                  </p>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-sky-edu">
                    S’entraîner <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
