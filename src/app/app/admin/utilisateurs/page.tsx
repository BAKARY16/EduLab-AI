import { redirect } from "next/navigation";
import { Users, ScrollText, Database } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/db";
import { users, activities } from "@/db/schema";
import { desc } from "drizzle-orm";
import { Card, Badge, SectionTitle, EmptyState } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "admin") redirect("/app");

  const allUsers = await db.select({ name: users.name, email: users.email, role: users.role }).from(users);
  const logs = await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(15);

  return (
    <div className="space-y-7">
      <SectionTitle eyebrow="Administration" title="Utilisateurs & journaux" subtitle="Gestion des comptes et activité anonymisée (séparation données réelles / synthétiques)." />

      <Card className="overflow-hidden">
        <h3 className="flex items-center gap-2 border-b border-night-900/5 px-5 py-4 font-bold text-night-900"><Users className="h-5 w-5 text-sky-edu" /> Comptes ({allUsers.length})</h3>
        {allUsers.length === 0 ? (
          <EmptyState title="Aucun utilisateur" />
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-night-900/5 text-xs uppercase tracking-wide text-night-800/60">
              <tr><th className="px-5 py-3">Nom</th><th className="px-5 py-3">E-mail</th><th className="px-5 py-3">Rôle</th></tr>
            </thead>
            <tbody className="divide-y divide-night-900/5">
              {allUsers.map((u) => (
                <tr key={u.email}>
                  <td className="px-5 py-3 font-semibold text-night-900">{u.name}</td>
                  <td className="px-5 py-3 text-night-800/70">{u.email}</td>
                  <td className="px-5 py-3">
                    <Badge color={u.role === "admin" ? "amber" : u.role === "teacher" ? "violet" : "sky"}>
                      {u.role === "student" ? "Élève" : u.role === "teacher" ? "Enseignant" : "Administrateur"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="flex items-center gap-2 font-bold text-night-900"><ScrollText className="h-5 w-5 text-violet-edu" /> Journal d'activité anonymisé</h3>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-night-800/60"><Database className="h-3.5 w-3.5" /> L'identité n'est jamais stockée : un hash anonyme uniquement.</p>
        {logs.length === 0 ? (
          <p className="mt-3 text-sm text-night-800/60">Aucune activité enregistrée. Les interactions des apprenants apparaîtront ici (anonymisées).</p>
        ) : (
          <div className="mt-4 space-y-2">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-night-900/10 px-3 py-2 text-xs">
                <span className="font-medium text-night-900">{l.activityType}</span>
                <span className="text-night-800/50">{l.userHash.slice(0, 8)}…</span>
                <Badge color={l.origin === "real" ? "leaf" : "amber"}>{l.origin === "real" ? "Réel" : "Synthétique"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
