import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getExperimentByKey } from "@/lib/content";
import { SIMULATIONS } from "@/components/Simulations";
import { Badge, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

const LEGACY_EXPERIMENT_KEYS: Record<string, string> = {
  genetique: "genetics",
  fonctions: "function",
  statistiques: "stats",
  "loi-ohm": "ohm",
  circuits: "circuit",
};

export default async function ExperimentPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  await getCurrentUser();

  const experimentKey = LEGACY_EXPERIMENT_KEYS[key] ?? key;
  const exp = getExperimentByKey(experimentKey);
  const Comp = SIMULATIONS[experimentKey];
  if (!exp || (!Comp && !exp.phetSim)) redirect("/app/labo");

  const color = exp.subject.includes("Math") ? "sky" : exp.subject.includes("Phys") ? "amber" : "leaf";
  const phetUrl = exp.phetSim
    ? `https://phet.colorado.edu/sims/html/${exp.phetSim}/latest/${exp.phetSim}_all.html?locale=fr`
    : null;

  return (
    <div className="space-y-6">
      <Link href="/app/labo" className="inline-flex items-center gap-1.5 text-sm font-semibold text-night-800/70 hover:text-sky-edu">
        <ArrowLeft className="h-4 w-4" /> Laboratoire
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle eyebrow={exp.subject} title={exp.title} subtitle={exp.summary} />
        <div className="flex items-center gap-2">
          <Badge color={color}>Leçon : {exp.lesson}</Badge>
          <Badge color="night">{exp.difficulty}</Badge>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-leaf/5 px-4 py-2.5 text-xs text-night-800/70">
        <ShieldCheck className="h-4 w-4 text-leaf" /> Résultats calculés en temps réel — lois réelles du programme.
      </div>

      {phetUrl ? (
        <div className="animate-fade-in overflow-hidden rounded-3xl border border-night-900/10 bg-white shadow-[0_10px_35px_rgba(26,61,47,0.05)]">
          <iframe
            src={phetUrl}
            title={exp.title}
            allowFullScreen
            className="aspect-[16/10] w-full border-0"
            loading="lazy"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-night-900/10 px-4 py-2 text-[11px] text-night-800/50">
            <p>Simulation PhET Interactive Simulations, Université du Colorado Boulder — licence CC-BY-4.0. Connexion Internet requise.</p>
            <a href={phetUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-sky-edu hover:underline">
              Ouvrir directement <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">{Comp && <Comp />}</div>
      )}
    </div>
  );
}
