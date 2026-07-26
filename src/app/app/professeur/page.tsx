import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Presentation, BookPlus, FileQuestion, ClipboardList, CheckSquare,
  Users, FolderTree, Sparkles, ArrowRight, Bot, MessageSquare,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, courses, profiles, progress } from "@/db/schema";
import { eq, sql, count } from "drizzle-orm";
import { Card, Badge, SectionTitle, Button } from "@/components/ui";
import { AGENTS } from "@/lib/ai";

export const dynamic = "force-dynamic";

export default async function TeacherPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "teacher") redirect("/app");

  const [studentCount] = await db.select({ n: count() }).from(users).where(eq(users.role, "student"));
  const [courseCount] = await db.select({ n: count() }).from(courses);
  const [progressCount] = await db.select({ n: count() }).from(progress);

  // sample students with their progress count
  const learners = await db
    .select({ name: users.name, email: users.email, grade: profiles.grade, cnt: count(progress.id) })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(progress, eq(progress.userId, users.id))
    .where(eq(users.role, "student"))
    .groupBy(users.id)
    .limit(6);

  return (
    <div className="space-y-7">
      <SectionTitle eyebrow="Espace enseignant" title={`Bonjour ${user.name.split(" ")[0]}`} subtitle="Crée et valide des contenus, suis tes apprenants et vérifie les contenus générés par l'IA." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Apprenants" value={`${studentCount?.n ?? 0}`} icon={Users} color="sky" />
        <StatCard label="Cours validés" value={`${courseCount?.n ?? 0}`} icon={FolderTree} color="leaf" />
        <StatCard label="Activités suivies" value={`${progressCount?.n ?? 0}`} icon={CheckSquare} color="violet" />
        <StatCard label="Agents IA" value={`${AGENTS.length}`} icon={Bot} color="amber" />
      </div>

      {/* Create tools */}
      <Card className="p-5">
        <h3 className="flex items-center gap-2 font-bold text-night-900"><BookPlus className="h-5 w-5 text-turq" /> Créer un contenu</h3>
        <p className="mt-1 text-sm text-night-800/60">Les nouveaux contenus passent par validation avant publication.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BookPlus, t: "Nouveau cours", c: "turq" },
            { icon: FileQuestion, t: "Exercice", c: "sky" },
            { icon: ClipboardList, t: "Quiz", c: "violet" },
            { icon: FolderTree, t: "Devoir", c: "amber" },
          ].map((t) => {
            const tone = t.c === "turq" ? "bg-turq/10 text-turq" : t.c === "sky" ? "bg-sky-edu/10 text-sky-edu" : t.c === "violet" ? "bg-violet-edu/10 text-violet-edu" : "bg-amber-edu/10 text-amber-edu";
            const Icon = t.icon;
            return (
              <button key={t.t} className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-night-900/15 p-5 text-center transition hover:border-sky-edu">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
                <span className="text-sm font-semibold text-night-900">{t.t}</span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI validation queue */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-night-900"><Sparkles className="h-5 w-5 text-violet-edu" /> Validation des contenus IA</h3>
          </div>
          <div className="mt-4 space-y-3">
            {[
              { t: "Exercice généré — Loi d'Ohm (3e)", s: "Agent Exercices", risk: "faible" },
              { t: "Fiche — Respiration alvéolaire", s: "Agent Explication", risk: "moyen" },
              { t: "Sujet BAC — Croisement génétique", s: "Agent Examens", risk: "élevé" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-night-900/10 p-3">
                <div>
                  <p className="text-sm font-semibold text-night-900">{item.t}</p>
                  <p className="text-xs text-night-800/50">{item.s}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={item.risk === "élevé" ? "amber" : item.risk === "moyen" ? "sky" : "leaf"}>{item.risk}</Badge>
                  <button className="grid h-8 w-8 place-items-center rounded-lg bg-leaf/10 text-leaf hover:bg-leaf/20"><CheckSquare className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-night-800/50">Aucun contenu n'est présenté comme officiel sans validation humaine et provenance.</p>
        </Card>

        {/* Learners */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-bold text-night-900"><Users className="h-5 w-5 text-sky-edu" /> Apprenants autorisés</h3>
            <Link href="/app/professeur/apprenants" className="text-sm font-semibold text-sky-edu hover:underline">Voir tout</Link>
          </div>
          <div className="mt-4 space-y-2">
            {learners.length === 0 ? (
              <p className="text-sm text-night-800/60">Aucun apprenant pour l'instant.</p>
            ) : (
              learners.map((l) => (
                <div key={l.email} className="flex items-center justify-between rounded-xl border border-night-900/10 p-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-edu to-sky-edu text-sm font-bold text-white">{l.name.charAt(0)}</span>
                    <div>
                      <p className="text-sm font-semibold text-night-900">{l.name}</p>
                      <p className="text-xs text-night-800/50">{l.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color="sky">{l.grade || "—"}</Badge>
                    <Badge color="leaf">{l.cnt} activités</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Agents overview */}
      <Card className="p-5">
        <h3 className="flex items-center gap-2 font-bold text-night-900"><Bot className="h-5 w-5 text-amber-edu" /> Agents IA du système</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a) => (
            <div key={a.id} className="rounded-xl border border-night-900/10 p-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-night-900"><MessageSquare className="h-4 w-4 text-turq" /> {a.name}</p>
              <p className="mt-1 text-xs text-night-800/60">{a.role}</p>
            </div>
          ))}
        </div>
      </Card>

      <Link href="/app/professeur/apprenants" className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-edu">
        Suivi détaillé des apprenants <ArrowRight className="h-4 w-4" />
      </Link>
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
