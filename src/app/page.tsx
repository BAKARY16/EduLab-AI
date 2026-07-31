import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Atom,
  BarChart3,
  BrainCircuit,
  BookOpen,
  Building2,
  Bot,
  Check,
  ChevronRight,
  CirclePlay,
  Cuboid,
  Database,
  FileCheck2,
  FlaskConical,
  GraduationCap,
  Handshake,
  Lightbulb,
  LockKeyhole,
  MapPin,
  Mic2,
  PenLine,
  School,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Target,
  Rocket,
  TrendingUp,
  UserRoundCheck,
  Users,
  WalletCards,
} from "lucide-react";

const problems = [
  { icon: Users, title: "Peu de temps individuel", text: "Dans une classe chargée, il est difficile de reprendre chaque incompréhension au rythme de chaque élève." },
  { icon: FlaskConical, title: "Une science trop théorique", text: "Sans laboratoire accessible, les formules restent abstraites et les phénomènes difficiles à visualiser." },
  { icon: BookOpen, title: "Des ressources dispersées", text: "Cours, exercices et annales sont rarement réunis dans un parcours clair, adapté au niveau de l’élève." },
];

const solutions = [
  { icon: Bot, title: "Professeur IA", text: "Il explique, questionne et reformule sans donner immédiatement la réponse." },
  { icon: BookOpen, title: "Cours structurés", text: "Objectifs, prérequis, exemples, synthèses et contrôles organisés par classe." },
  { icon: FlaskConical, title: "Laboratoire virtuel", text: "L’élève modifie des paramètres, observe les résultats et construit sa conclusion." },
  { icon: PenLine, title: "Aide aux devoirs", text: "Une correction guidée par indices, étapes de raisonnement et vérification finale." },
  { icon: GraduationCap, title: "Préparation BEPC/BAC", text: "Annales, entraînement chronométré, corrections expliquées et analyse des erreurs." },
  { icon: TrendingUp, title: "Suivi personnalisé", text: "Progression par compétence, points à revoir et recommandations après chaque activité." },
];

const journey = [
  { icon: UserRoundCheck, step: "01", title: "Créer son profil", text: "Classe, matières prioritaires et objectif scolaire." },
  { icon: Target, step: "02", title: "Faire le diagnostic", text: "Identifier les acquis et les notions fragiles." },
  { icon: Bot, step: "03", title: "Apprendre activement", text: "Cours, questions, exercices et simulations." },
  { icon: BarChart3, step: "04", title: "Mesurer les progrès", text: "Comprendre ses erreurs et consolider les acquis." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f5ec] text-[#173c30] selection:bg-[#9ad9c2]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#173c30]/10 bg-[#f8f5ec]/90 backdrop-blur-xl">
        <nav aria-label="Navigation principale" className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5" aria-label="EduLab AI — Accueil">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#173c30] text-[#70d5ae]"><Atom className="h-5 w-5" /></span>
            <span className="text-xl font-extrabold tracking-tight">EduLab <span className="text-[#0d9b78]">AI</span></span>
          </Link>
          <div className="hidden items-center gap-7 text-sm font-semibold lg:flex">
            <a href="#probleme" className="transition hover:text-[#0d9b78]">Problème</a>
            <a href="#solution" className="transition hover:text-[#0d9b78]">Solution</a>
            <a href="#technologie" className="transition hover:text-[#0d9b78]">Technologie</a>
            <a href="#demonstration" className="transition hover:text-[#0d9b78]">Démonstration</a>
            <a href="#modele-economique" className="transition hover:text-[#0d9b78]">Modèle économique</a>
            <a href="#impact" className="transition hover:text-[#0d9b78]">Impact</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="hidden rounded-full px-4 py-2.5 text-sm font-bold sm:block">Se connecter</Link>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 rounded-full bg-[#0d9b78] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#08775c]">Essayer EduLab <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden px-5 pb-24 pt-32 lg:pb-32 lg:pt-40">
          <div className="absolute -right-40 top-0 h-[35rem] w-[35rem] rounded-full bg-[#d5ead9] blur-3xl" />
          <div className="absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-[#f2c88d]/30 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[.92fr_1.08fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#dc741f]/25 bg-[#dc741f]/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[.16em] text-[#a64f12]"><MapPin className="h-3.5 w-3.5" /> Pensé pour l’école ivoirienne</span>
              <h1 className="mt-7 text-5xl font-black leading-[.98] tracking-[-.055em] text-[#10271f] sm:text-6xl lg:text-[4.8rem]">Comprendre aujourd’hui pour <span className="text-[#0d9b78]">réussir demain.</span></h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-[#38594c]">EduLab AI réunit un professeur intelligent, des cours structurés, un laboratoire virtuel et la préparation aux examens dans un seul environnement d’apprentissage.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#173c30] px-7 py-4 font-bold text-white transition hover:bg-[#245343]">Créer mon espace <ArrowRight className="h-4 w-4" /></Link>
                <a href="#probleme" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#173c30]/20 bg-white/50 px-7 py-4 font-bold transition hover:bg-white"><CirclePlay className="h-4 w-4" /> Découvrir le projet</a>
              </div>
              <div className="mt-8 flex flex-wrap gap-5 text-sm font-semibold text-[#557165]"><span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#0d9b78]" /> Collège et lycée</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#0d9b78]" /> BEPC et BAC</span><span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#0d9b78]" /> Mobile et ordinateur</span></div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rotate-2 rounded-[2.5rem] bg-[#173c30]" />
              <Image src="/images/edulab-dashboard-laptop.png" alt="Tableau de bord pédagogique EduLab AI affiché sur un ordinateur" width={1536} height={1024} priority className="relative aspect-[3/2] w-full rounded-[2rem] object-cover shadow-2xl" />
              <div className="absolute -bottom-6 left-5 rounded-2xl border border-[#173c30]/10 bg-white p-4 shadow-xl sm:left-10"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#0d9b78]">Un seul espace</p><p className="mt-1 font-extrabold">Apprendre · pratiquer · progresser</p></div>
            </div>
          </div>
        </section>

        <section id="probleme" className="bg-[#173c30] px-5 py-24 text-white">
          <div className="mx-auto max-w-7xl">
            <Chapter number="01" title="Le problème" light />
            <SectionIntro light eyebrow="Le défi concret" title="Pourquoi ce projet ?" text="EduLab AI part d’un constat simple : beaucoup d’élèves veulent réussir, mais tous ne disposent pas des mêmes conditions pour comprendre, pratiquer et être accompagnés." />
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {problems.map(({ icon: Icon, title, text }, index) => <article key={title} className="rounded-3xl border border-white/12 bg-white/[.06] p-7"><span className="text-sm font-black text-[#efb66f]">0{index + 1}</span><Icon className="mt-8 h-7 w-7 text-[#70d5ae]" /><h3 className="mt-5 text-xl font-extrabold">{title}</h3><p className="mt-3 leading-7 text-white/65">{text}</p></article>)}
            </div>
            <div className="mt-10 grid gap-8 rounded-3xl bg-[#f0b15f] p-8 text-[#173c30] lg:grid-cols-[.6fr_1.4fr] lg:items-center lg:p-12"><div><Lightbulb className="h-10 w-10" /><p className="mt-5 text-sm font-black uppercase tracking-[.18em]">Notre conviction</p></div><p className="text-2xl font-extrabold leading-snug sm:text-3xl">La technologie devient utile lorsqu’elle rend l’élève plus actif, l’enseignant mieux informé et les ressources pédagogiques réellement accessibles.</p></div>
          </div>
        </section>

        <section id="solution" className="px-5 py-24">
          <div className="mx-auto max-w-7xl">
            <Chapter number="02" title="La solution" />
            <SectionIntro eyebrow="La réponse EduLab" title="Une plateforme, six leviers d’apprentissage" text="Chaque outil répond à un besoin pédagogique précis. Ensemble, ils forment un parcours continu, de l’explication jusqu’à la maîtrise." />
            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {solutions.map(({ icon: Icon, title, text }) => <article key={title} className="group rounded-3xl border border-[#173c30]/10 bg-white p-7 shadow-[0_12px_40px_rgba(23,60,48,.06)] transition hover:-translate-y-1"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#dff1e8] text-[#0d7e62]"><Icon className="h-6 w-6" /></span><h3 className="mt-6 text-xl font-extrabold text-[#10271f]">{title}</h3><p className="mt-3 leading-7 text-[#557165]">{text}</p></article>)}
            </div>
          </div>
        </section>

        <section id="technologie" className="bg-[#10271f] px-5 py-24 text-white">
          <div className="mx-auto max-w-7xl">
            <Chapter number="03" title="La technologie" light />
            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <SectionIntro light eyebrow="Architecture de la solution" title="L’IA reliée à des données pédagogiques traçables." text="Le projet combine IA générative, recherche documentaire, voix, simulations interactives et suivi de progression dans une architecture unifiée." />
              <p className="rounded-2xl border border-white/10 bg-white/[.06] p-6 leading-7 text-white/65">Le professeur ne répond pas à partir d’une mémoire isolée : il recherche d’abord les ressources disponibles, construit une réponse contextualisée et conserve la provenance utilisée.</p>
            </div>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TechCard icon={BrainCircuit} title="IA générative" text="Explications adaptées, reformulation et guidage du raisonnement." />
              <TechCard icon={Database} title="RAG et données" text="Recherche dans les cours, annales et ressources indexées avec leurs sources." />
              <TechCard icon={Mic2} title="Interaction vocale" text="Reconnaissance et synthèse vocales pour dialoguer en français." />
              <TechCard icon={Cuboid} title="Simulations" text="Expériences interactives fondées sur les lois scientifiques étudiées." />
              <TechCard icon={ServerCog} title="Backend sécurisé" text="Next.js, API métier, Supabase Auth, PostgreSQL et règles d’accès." />
              <TechCard icon={BarChart3} title="Learning analytics" text="Mesure des tentatives, compétences maîtrisées et besoins de remédiation." />
            </div>
          </div>
        </section>

        <section id="pedagogie" className="bg-[#e8efe6] px-5 py-24">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:items-center">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#173c30] p-2"><Image src="/images/edulab-ai-classroom.png" alt="Professeur IA accompagnant des élèves pendant un cours de sciences" width={1450} height={1085} className="aspect-[4/3] rounded-[1.6rem] object-cover" /><div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-[#10271f]/90 p-5 text-white backdrop-blur"><p className="text-xs font-extrabold uppercase tracking-[.16em] text-[#70d5ae]">Le principe pédagogique</p><p className="mt-2 text-lg font-bold">Expliquer, faire essayer, observer, corriger puis consolider.</p></div></div>
            <div><SectionIntro eyebrow="Apprendre en faisant" title="L’IA n’est pas là pour travailler à la place de l’élève." text="Le professeur EduLab guide le raisonnement. Il commence par vérifier ce que l’élève comprend, propose un indice, reformule la notion et n’affiche une solution complète qu’au bon moment." />
              <ul className="mt-8 space-y-4">{["Une explication adaptée au niveau et à la classe", "Des questions régulières pour vérifier la compréhension", "Une correction qui explique l’erreur et la méthode", "Des simulations reliées directement aux notions du cours"].map((item) => <li key={item} className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 font-semibold"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#0d9b78] text-white"><Check className="h-3.5 w-3.5" /></span>{item}</li>)}</ul>
            </div>
          </div>
        </section>

        <section id="demonstration" className="px-5 py-24">
          <div className="mx-auto max-w-7xl"><Chapter number="04" title="La démonstration" /><SectionIntro eyebrow="Parcours à montrer en direct" title="Du premier diagnostic à la progression" text="La démonstration suit un scénario court et vérifiable : connexion, choix d’un cours, question au professeur IA, manipulation d’une expérience puis consultation du suivi." />
            <div className="mt-14 grid gap-4 lg:grid-cols-4">{journey.map(({ icon: Icon, step, title, text }) => <article key={step} className="relative rounded-3xl border border-[#173c30]/10 bg-white p-6"><div className="flex items-center justify-between"><span className="text-3xl font-black text-[#0d9b78]">{step}</span><Icon className="h-6 w-6 text-[#c06a25]" /></div><h3 className="mt-10 text-lg font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#557165]">{text}</p>{step !== "04" && <ChevronRight className="absolute -right-4 top-1/2 z-10 hidden h-8 w-8 rounded-full bg-[#173c30] p-2 text-white lg:block" />}</article>)}</div>
            <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-3xl bg-[#e3efe8] p-7 sm:flex-row sm:items-center"><div><p className="font-extrabold">La plateforme est fonctionnelle</p><p className="mt-1 text-sm text-[#557165]">Les actions présentées utilisent l’authentification, les données et les services réels du projet.</p></div><Link href="/auth/login" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#173c30] px-6 py-3 font-bold text-white"><CirclePlay className="h-4 w-4" /> Lancer la démo</Link></div>
          </div>
        </section>

        <section id="confiance" className="bg-[#fffaf0] px-5 py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <SectionIntro eyebrow="Contenus et confiance" title="Une information utile doit aussi être vérifiable." text="EduLab distingue les ressources officielles, les contenus validés et les démonstrations. La provenance et le statut d’une correction doivent rester visibles pour l’élève comme pour l’enseignant." />
            <div className="grid gap-4 sm:grid-cols-2">
              <TrustCard icon={FileCheck2} title="Provenance affichée" text="Source, année, matière, série et statut sont associés aux ressources." />
              <TrustCard icon={ShieldCheck} title="Protection des élèves" text="Accès contrôlé, données personnelles limitées et rôles séparés." />
              <TrustCard icon={School} title="Contexte ivoirien" text="Organisation par niveaux, examens et référentiels du système scolaire ivoirien." />
              <TrustCard icon={LockKeyhole} title="Pas de faux résultat" text="La progression affichée repose sur les activités réellement réalisées." />
            </div>
          </div>
        </section>

        <section id="modele-economique" className="bg-white px-5 py-24">
          <div className="mx-auto max-w-7xl">
            <Chapter number="05" title="Le modèle économique" />
            <div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
              <SectionIntro eyebrow="Accessibilité et pérennité" title="Un modèle freemium complété par des offres pour les établissements." text="L’accès essentiel reste abordable pour les familles. Les fonctions avancées, le pilotage pédagogique et le déploiement institutionnel financent l’amélioration continue des contenus et de l’infrastructure." />
              <div className="grid gap-4 sm:grid-cols-2">
                <TrustCard icon={Users} title="Élève — accès gratuit" text="Cours essentiels, exercices, progression de base et accès limité au professeur IA." />
                <TrustCard icon={WalletCards} title="Élève Plus" text="IA et voix étendues, préparation intensive BEPC/BAC, bilans et parcours personnalisés." />
                <TrustCard icon={Building2} title="Établissements" text="Licences par classe ou par école, espace enseignant, tableaux de bord et accompagnement." />
                <TrustCard icon={Handshake} title="Partenariats" text="Programmes pilotes avec institutions, opérateurs, ONG et acteurs de l’éducation numérique." />
              </div>
            </div>
            <div className="mt-12 grid gap-4 rounded-3xl bg-[#173c30] p-7 text-white md:grid-cols-3">
              <ImpactCard title="Revenus" text="Abonnements premium, licences B2B/B2G et services de déploiement." />
              <ImpactCard title="Coûts maîtrisés" text="Routage des modèles selon la difficulté, cache sémantique et contenus réutilisables." />
              <ImpactCard title="Mesure de valeur" text="Activation, assiduité, progression, réussite aux exercices et rétention des établissements." />
            </div>
          </div>
        </section>

        <section id="impact" className="bg-[#e8efe6] px-5 py-24">
          <div className="mx-auto max-w-7xl">
            <Chapter number="06" title="L’impact" />
            <div className="grid gap-12 lg:grid-cols-2">
              <SectionIntro eyebrow="Pourquoi c’est important" title="Réduire l’écart entre apprendre une notion et réellement la comprendre." text="EduLab AI vise à rendre l’accompagnement personnalisé et la pratique scientifique accessibles au-delà des contraintes de temps, de lieu et d’équipement." />
              <div className="grid gap-4 sm:grid-cols-2">
                <ImpactCard title="Pour l’élève" text="Plus d’autonomie, de pratique et de visibilité sur ses progrès." />
                <ImpactCard title="Pour l’enseignant" text="Des indicateurs pour repérer les difficultés et mieux accompagner." />
                <ImpactCard title="Pour l’établissement" text="Un complément numérique utilisable sur ordinateur et mobile." />
                <ImpactCard title="Pour l’écosystème" text="Une base structurée de ressources éducatives contextualisées." />
              </div>
            </div>
            <div className="mt-14 rounded-3xl bg-[#173c30] p-8 text-white lg:p-12"><div className="flex items-center gap-3 text-[#70d5ae]"><Rocket className="h-6 w-6" /><p className="text-xs font-black uppercase tracking-[.18em]">Prochaines étapes</p></div><div className="mt-7 grid gap-4 md:grid-cols-3"><NextStep number="01" title="Valider les contenus" text="Renforcer la revue pédagogique avec des enseignants et institutions." /><NextStep number="02" title="Étendre le catalogue" text="Ajouter progressivement les classes, matières, annales et simulations." /><NextStep number="03" title="Mesurer l’efficacité" text="Conduire des pilotes et suivre des indicateurs d’apprentissage réels." /></div></div>
          </div>
        </section>

        <section className="px-5 py-24">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#173c30] px-7 py-16 text-center text-white sm:px-12 lg:py-20">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[.16em] text-[#70d5ae]"><Sparkles className="h-4 w-4" /> Découvrir la plateforme</span>
            <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-black tracking-[-.04em] sm:text-6xl">Une meilleure expérience d’apprentissage commence par une première leçon.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/65">Créez votre profil, choisissez votre classe et accédez aux modules actuellement disponibles.</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#70d5ae] px-8 py-4 font-extrabold text-[#10271f]">Créer un compte <ArrowRight className="h-4 w-4" /></Link><Link href="/auth/login" className="inline-flex items-center justify-center rounded-full border border-white/25 px-8 py-4 font-extrabold">Se connecter</Link></div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#173c30]/10 px-5 py-12"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row"><div><Link href="/" className="flex items-center gap-2 text-lg font-black"><Atom className="h-5 w-5 text-[#0d9b78]" /> EduLab AI</Link><p className="mt-3 max-w-md text-sm leading-6 text-[#557165]">Plateforme éducative scientifique destinée à accompagner les apprentissages dans le contexte scolaire ivoirien.</p></div><div className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-semibold"><a href="#probleme">Problème</a><a href="#solution">Solution</a><a href="#technologie">Technologie</a><a href="#demonstration">Démo</a><a href="#modele-economique">Modèle économique</a><a href="#impact">Impact</a></div></div><div className="mx-auto mt-10 flex max-w-7xl flex-col justify-between gap-2 border-t border-[#173c30]/10 pt-6 text-xs text-[#6b8077] sm:flex-row"><p>© {new Date().getFullYear()} EduLab AI.</p><p>Les contenus de démonstration sont explicitement identifiés.</p></div></footer>
    </div>
  );
}

function SectionIntro({ eyebrow, title, text, light = false }: { eyebrow: string; title: string; text: string; light?: boolean }) {
  return <div className="max-w-3xl"><p className={`text-xs font-black uppercase tracking-[.2em] ${light ? "text-[#70d5ae]" : "text-[#0d9b78]"}`}>{eyebrow}</p><h2 className={`mt-4 text-4xl font-black tracking-[-.04em] sm:text-5xl ${light ? "text-white" : "text-[#10271f]"}`}>{title}</h2><p className={`mt-5 text-lg leading-8 ${light ? "text-white/65" : "text-[#557165]"}`}>{text}</p></div>;
}

function TrustCard({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return <article className="rounded-3xl border border-[#173c30]/10 bg-white p-6"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#e2f1e9] text-[#0d7e62]"><Icon className="h-5 w-5" /></span><h3 className="mt-5 font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#557165]">{text}</p></article>;
}

function Chapter({ number, title, light = false }: { number: string; title: string; light?: boolean }) {
  return <div className={`mb-9 flex items-center gap-4 border-b pb-4 ${light ? "border-white/15" : "border-[#173c30]/15"}`}><span className={`text-sm font-black ${light ? "text-[#70d5ae]" : "text-[#0d9b78]"}`}>{number}</span><span className={`text-sm font-black uppercase tracking-[.18em] ${light ? "text-white" : "text-[#173c30]"}`}>{title}</span></div>;
}

function TechCard({ icon: Icon, title, text }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }) {
  return <article className="rounded-3xl border border-white/10 bg-white/[.06] p-6"><Icon className="h-6 w-6 text-[#70d5ae]" /><h3 className="mt-5 font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/60">{text}</p></article>;
}

function ImpactCard({ title, text }: { title: string; text: string }) {
  return <article className="rounded-3xl bg-white p-6"><h3 className="font-extrabold text-[#10271f]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#557165]">{text}</p></article>;
}

function NextStep({ number, title, text }: { number: string; title: string; text: string }) {
  return <article className="rounded-2xl border border-white/10 bg-white/[.06] p-5"><span className="text-xs font-black text-[#efb66f]">{number}</span><h3 className="mt-4 font-extrabold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/60">{text}</p></article>;
}
