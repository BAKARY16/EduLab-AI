import { ShieldCheck } from "lucide-react";
import { CourseExplorer } from "@/components/CourseExplorer";
import { getCourseTree } from "@/server/courseCatalog";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const tree = await getCourseTree();
  let total = 0;
  let available = 0;
  for (const level of tree.levels) for (const subject of level.subjects) for (const chapter of subject.chapters) for (const lesson of chapter.lessons) {
    total += 1;
    // Le professeur IA peut exposer n'importe quelle notion via le RAG, même sans document
    // hébergé ; seule la présence d'un document validé change ce qui est comptabilisé ici.
    if (lesson.resources?.some((resource) => resource.available)) available += 1;
  }

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-[2rem] border border-night-900/10 bg-[#174c3a] px-6 py-8 text-white shadow-[0_24px_60px_rgba(23,76,58,.16)] sm:px-9">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.22em] text-[#a8d3b7]">Bibliothèque pédagogique</p><h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Explore tes cours comme des dossiers.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Ouvre un niveau, une matière et un chapitre. Les cours et documents disponibles se lisent directement dans EduLab.</p></div><div className="grid grid-cols-2 gap-3"><Stat value={`${tree.levels.length}`} label="niveaux"/><Stat value={`${available}/${total}`} label="accessibles"/></div></div>
    </section>
    <CourseExplorer tree={tree}/>
    <div className="flex items-start gap-3 rounded-2xl border border-[#c8d8cc] bg-[#f4f8f3] p-4 text-sm text-night-800"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-turq"/><p><strong>Ressources internes :</strong> les documents officiels déjà validés sont servis par EduLab et ouverts dans le lecteur intégré. Les ressources non encore hébergées sont clairement signalées.</p></div>
  </div>;
}

function Stat({ value, label }: { value: string; label: string }) { return <div className="min-w-24 rounded-2xl border border-white/15 bg-white/8 px-4 py-3"><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-white/55">{label}</p></div>; }
