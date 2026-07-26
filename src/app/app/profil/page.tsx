import Link from "next/link";
import { User, GraduationCap, Target, Languages, Brain, ShieldCheck, BookOpen, Pencil } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getProgressWithCourses } from "@/lib/queries";
import { Card, Badge, ProgressBar, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;
  const p = user.profile;
  const rows = await getProgressWithCourses(user.id);
  const mastery = rows.length ? rows.reduce((a, r) => a + (r.progress.mastery ?? 0), 0) / rows.length : 0;

  return (
    <div className="space-y-7">
      <SectionTitle eyebrow="Mon compte" title="Profil & préférences" subtitle="Tes informations et la personnalisation de ton apprentissage." />

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-night-950 to-night-800 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-turq text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-sm text-slate-300">{user.email}</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                <Badge color="sky">{user.role === "student" ? "Élève" : user.role === "teacher" ? "Enseignant" : "Administrateur"}</Badge>
                {p?.examClass && <Badge color="amber">Classe d'examen</Badge>}
              </div>
            </div>
          </div>
        </div>
        <div className="grid gap-px bg-night-900/5 sm:grid-cols-3">
          <Stat label="Niveau" value={p?.level || "—"} icon={GraduationCap} />
          <Stat label="Classe" value={p?.grade || "—"} icon={User} />
          <Stat label="Progression" value={`${Math.round(mastery * 100)}%`} icon={BookOpen} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-bold text-night-900"><Brain className="h-5 w-5 text-violet-edu" /> Apprentissage</h3>
          <div className="mt-4 space-y-3 text-sm">
            <Row label="Style d'apprentissage" value={p?.learningStyle || "Visuel"} />
            <Row label="Langue préférée" value={p?.preferredLanguage || "Français"} />
            <Row label="Cycle d'examen" value={p?.cycle || "—"} />
          </div>
          <div className="mt-4">
            <ProgressBar value={mastery} color="violet" />
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="flex items-center gap-2 font-bold text-night-900"><Target className="h-5 w-5 text-leaf" /> Objectifs & difficultés</h3>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-night-800/50">Objectifs</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {(p?.goals || "Réussir mon examen").split(",").filter(Boolean).map((g, i) => (
              <Badge key={i} color="leaf">{g.trim()}</Badge>
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-night-800/50">Matières difficiles</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {(p?.difficultSubjects || "Aucune").split(",").filter(Boolean).map((s, i) => (
              <Badge key={i} color="amber">{s.trim()}</Badge>
            )) || <Badge color="night">Aucune</Badge>}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="flex items-center gap-2 font-bold text-night-900"><ShieldCheck className="h-5 w-5 text-turq" /> Confidentialité & données</h3>
        <ul className="mt-3 space-y-2 text-sm text-night-800/80">
          <li>✓ Tes données d'apprentissage sont enregistrées de manière <strong>anonymisée</strong> (jamais ton identité).</li>
          <li>✓ Les données réelles sont séparées des données synthétiques utilisées pour initialiser les modèles.</li>
          <li>✓ La protection des mineurs est respectée : aucune donnée personnelle sensible n'est exposée.</li>
        </ul>
      </Card>

      <div className="flex items-center justify-between rounded-2xl border border-night-900/10 bg-white p-5">
        <p className="text-sm text-night-800/70">Tu veux ajuster ton niveau, tes objectifs ou ta langue ?</p>
        <Link href="/onboarding" className="inline-flex items-center gap-1.5 rounded-xl bg-sky-edu/10 px-4 py-2.5 text-sm font-semibold text-sky-edu hover:bg-sky-edu/20">
          <Pencil className="h-4 w-4" /> Modifier mon parcours
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-3 bg-white p-5">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-night-900/5 text-night-800"><Icon className="h-5 w-5" /></span>
      <div>
        <p className="text-xs text-night-800/50">{label}</p>
        <p className="font-bold text-night-900">{value}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-night-900/5 pb-2">
      <span className="text-night-800/70">{label}</span>
      <span className="font-semibold capitalize text-night-900">{value}</span>
    </div>
  );
}
