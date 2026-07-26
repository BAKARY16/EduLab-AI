import { redirect } from "next/navigation";
import { Users, MessageSquare } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, profiles, progress } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { Card, Badge, SectionTitle, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ApprenantsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "teacher") redirect("/app");

  const learners = await db
    .select({ id: users.id, name: users.name, email: users.email, grade: profiles.grade, examClass: profiles.examClass, cnt: count(progress.id) })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(progress, eq(progress.userId, users.id))
    .where(eq(users.role, "student"))
    .groupBy(users.id);

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Espace enseignant" title="Mes apprenants" subtitle="Consulte la progression des élèves autorisés et commente leurs résultats." />

      {learners.length === 0 ? (
        <EmptyState icon={<Users className="h-6 w-6" />} title="Aucun apprenant" description="Les élèves inscrits apparaîtront ici." />
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-night-900/5 text-xs uppercase tracking-wide text-night-800/60">
              <tr>
                <th className="px-5 py-3">Élève</th>
                <th className="px-5 py-3">Classe</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Activités</th>
                <th className="px-5 py-3">Commentaire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-night-900/5">
              {learners.map((l) => (
                <tr key={l.id} className="hover:bg-night-900/[0.02]">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-edu to-sky-edu text-sm font-bold text-white">{l.name.charAt(0)}</span>
                      <div>
                        <p className="font-semibold text-night-900">{l.name}</p>
                        <p className="text-xs text-night-800/50">{l.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><Badge color="sky">{l.grade || "—"}</Badge></td>
                  <td className="px-5 py-3">{l.examClass ? <Badge color="amber">Examen</Badge> : <Badge color="night">Standard</Badge>}</td>
                  <td className="px-5 py-3 font-semibold text-night-900">{l.cnt}</td>
                  <td className="px-5 py-3">
                    <button className="inline-flex items-center gap-1.5 rounded-lg bg-sky-edu/10 px-3 py-1.5 text-xs font-semibold text-sky-edu hover:bg-sky-edu/20">
                      <MessageSquare className="h-3.5 w-3.5" /> Commenter
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
