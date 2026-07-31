"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Download, FileText, Folder, FolderOpen, GraduationCap, Home } from "lucide-react";
import type { CatalogChapter, CatalogLesson, CatalogLevel, CatalogSubject, CourseTree } from "@/server/courseCatalog";
import { AIProfessorClassroom } from "@/components/AIProfessorClassroom";

type Selection = { level?: CatalogLevel; subject?: CatalogSubject; chapter?: CatalogChapter; lesson?: CatalogLesson };

export function CourseExplorer({ tree }: { tree: CourseTree }) {
  const [selection, setSelection] = useState<Selection>({});
  const entries = useMemo(() => {
    if (selection.lesson) return [];
    if (selection.chapter) return selection.chapter.lessons.map((item) => ({ type: "lesson" as const, item }));
    if (selection.subject) return selection.subject.chapters.map((item) => ({ type: "chapter" as const, item }));
    if (selection.level) return selection.level.subjects.map((item) => ({ type: "subject" as const, item }));
    return tree.levels.map((item) => ({ type: "level" as const, item }));
  }, [selection, tree.levels]);

  const open = (type: "level" | "subject" | "chapter" | "lesson", item: CatalogLevel | CatalogSubject | CatalogChapter | CatalogLesson) => {
    if (type === "level") setSelection({ level: item as CatalogLevel });
    if (type === "subject") setSelection({ level: selection.level, subject: item as CatalogSubject });
    if (type === "chapter") setSelection({ level: selection.level, subject: selection.subject, chapter: item as CatalogChapter });
    if (type === "lesson") setSelection({ ...selection, lesson: item as CatalogLesson });
  };

  const crumbs = [
    { label: "Cours", action: () => setSelection({}) },
    selection.level && { label: selection.level.title, action: () => setSelection({ level: selection.level }) },
    selection.subject && { label: selection.subject.title, action: () => setSelection({ level: selection.level, subject: selection.subject }) },
    selection.chapter && { label: selection.chapter.title, action: () => setSelection({ level: selection.level, subject: selection.subject, chapter: selection.chapter }) },
    selection.lesson && { label: selection.lesson.title, action: () => undefined },
  ].filter(Boolean) as { label: string; action: () => void }[];

  return <section className="overflow-hidden rounded-[1.75rem] border border-night-900/10 bg-white shadow-[0_16px_45px_rgba(24,53,42,.07)]">
    <div className="flex min-h-14 items-center gap-1 overflow-x-auto border-b border-night-900/10 bg-[#fbfaf6] px-4 py-2 text-sm">
      {crumbs.map((crumb, index) => <div key={`${crumb.label}-${index}`} className="flex shrink-0 items-center gap-1">
        {index > 0 && <ChevronRight className="h-4 w-4 text-night-800/30"/>}
        <button onClick={crumb.action} className={`rounded-lg px-2 py-1.5 transition hover:bg-[#edf4ee] ${index === crumbs.length - 1 ? "font-semibold text-[#175c44]" : "text-night-800/60"}`}>
          {index === 0 && <Home className="mr-1.5 inline h-4 w-4"/>}{crumb.label}
        </button>
      </div>)}
    </div>

    <div className={`grid min-h-[560px] ${selection.lesson ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_320px]"}`}>
      <div className="p-4 sm:p-6">
        {selection.lesson ? <LessonViewer lesson={selection.lesson} chapterLessons={selection.chapter?.lessons.map(item => item.title) ?? [selection.lesson.title]}/> : <>
          <div className="mb-5 flex items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-night-800/40">Explorateur de cours</p><h2 className="mt-1 text-2xl font-bold text-night-900">{selection.chapter?.title ?? selection.subject?.title ?? selection.level?.title ?? "Tous les niveaux"}</h2></div>
            <span className="text-sm text-night-800/45">{entries.length} dossier{entries.length > 1 ? "s" : ""}</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{entries.map(({ type, item }) => {
            const lesson = type === "lesson" ? item as CatalogLesson : undefined;
            const available = lesson ? lesson.available : true;
            return <button key={item.id} onClick={() => open(type, item)} className={`group min-h-36 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg ${lesson && !available ? "border-dashed border-night-900/15 bg-[#f7f5ed] opacity-80 hover:border-night-900/25" : "border-night-900/10 bg-[#fffefa] hover:border-[#175c44]/30"}`}>
              <span className={`grid h-12 w-12 place-items-center rounded-2xl ${type === "lesson" ? (available ? "bg-[#f3eee4] text-[#d97836]" : "bg-night-900/5 text-night-800/35") : "bg-[#edf4ee] text-[#175c44]"}`}>
                {type === "level" ? <GraduationCap className="h-6 w-6"/> : type === "lesson" ? <FileText className="h-6 w-6"/> : <><Folder className="h-6 w-6 group-hover:hidden"/><FolderOpen className="hidden h-6 w-6 group-hover:block"/></>}
              </span>
              <span className="mt-4 block font-bold text-night-900">{item.title}</span>
              {lesson ? <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${available ? "bg-[#edf4ee] text-[#175c44]" : "bg-[#f3e4d1] text-[#8a5a1f]"}`}>{available ? "● Disponible" : "◌ Pas encore disponible"}</span>
                : <span className="mt-1 block text-xs text-night-800/45">{type === "level" ? `${(item as CatalogLevel).subjects.length} matières` : type === "subject" ? `${(item as CatalogSubject).chapters.length} chapitres` : `${(item as CatalogChapter).lessons.length} notions`}</span>}
            </button>})}</div>
        </>}
      </div>
      {!selection.lesson && <aside className="border-t border-night-900/10 bg-[#f7f5ed] p-5 lg:border-l lg:border-t-0">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-night-800/40">Emplacement actuel</p>
        <div className="mt-4 space-y-3 text-sm">
          <Info label="Niveau" value={selection.level?.title}/><Info label="Matière" value={selection.subject?.title}/><Info label="Chapitre" value={selection.chapter?.title}/><Info label="Notion" value={undefined}/>
        </div>
        <div className="mt-6 rounded-2xl border border-[#c8d8cc] bg-white p-4 text-sm leading-6 text-night-800/65"><BookOpen className="mb-2 h-5 w-5 text-[#175c44]"/>Clique sur un dossier pour l’ouvrir. Le fil d’Ariane permet de revenir à n’importe quel niveau.</div>
      </aside>}
    </div>
  </section>;
}

function LessonViewer({ lesson, chapterLessons }: { lesson: CatalogLesson; chapterLessons: string[] }) {
  const [activeResource, setActiveResource] = useState(lesson.resources?.find((resource) => resource.available));
  return <div>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#d97836]">Notion</p><h2 className="mt-1 text-2xl font-bold text-night-900">{lesson.title}</h2><p className="mt-2 text-sm text-night-800/50">{lesson.class_name} · {lesson.subject} · {lesson.chapter}</p></div></div>
    {!lesson.available && <div className="mt-4 rounded-2xl border border-[#e2b98a] bg-[#f3e4d1] p-4 text-sm text-[#8a5a1f]"><strong>Notion pas encore disponible pour l’exposition.</strong> Le contenu ci-dessous peut être générique (programme complet) ou incomplet — à ne pas présenter comme une leçon finalisée devant le jury.</div>}
    <AIProfessorClassroom lesson={lesson} chapterLessons={chapterLessons} pedagogicalPlan={lesson.pedagogical_plan}/>
    <div className="mt-6 flex flex-wrap gap-2">{lesson.resources?.map((resource) => <button key={resource.id} onClick={() => setActiveResource(resource)} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${activeResource?.id === resource.id ? "border-[#175c44] bg-[#edf4ee] text-[#175c44]" : "border-night-900/10 bg-white text-night-800/60"}`}><FileText className="mr-2 inline h-4 w-4"/>{resource.title}</button>)}</div>
    {activeResource?.externalUrl && <div className="mt-5 rounded-2xl border border-[#175c44]/20 bg-[#edf4ee] p-5"><p className="font-bold text-night-900">{activeResource.title}</p><p className="mt-1 text-sm text-night-800/60">Ressource hébergée par {activeResource.authority}. Elle s’ouvre directement sur la page du document.</p><a href={activeResource.externalUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#175c44] px-4 py-2.5 text-sm font-semibold text-white"><BookOpen className="h-4 w-4"/>Consulter la ressource</a></div>}
    {activeResource?.viewerUrl ? <div className="mt-5 overflow-hidden rounded-2xl border border-night-900/10 bg-[#efeee9]">
      <div className="flex items-center justify-between gap-3 border-b border-night-900/10 bg-white px-4 py-3"><div><p className="text-sm font-bold text-night-900">{activeResource.title}</p><p className="text-xs text-night-800/45">Source : {activeResource.authority}</p></div><a href={activeResource.viewerUrl} download className="rounded-lg p-2 text-[#175c44] hover:bg-[#edf4ee]" aria-label="Télécharger le PDF"><Download className="h-5 w-5"/></a></div>
      <iframe src={activeResource.viewerUrl} title={activeResource.title} className="h-[620px] w-full bg-white"/>
    </div> : !activeResource?.externalUrl && <div className="mt-6 rounded-2xl border border-dashed border-night-900/15 bg-[#fbfaf6] p-8 text-center"><FileText className="mx-auto h-8 w-8 text-night-800/25"/><p className="mt-3 font-semibold text-night-900">Aucun document hébergé pour cette notion</p><p className="mt-1 text-sm text-night-800/50">Le professeur IA ci-dessus peut tout de même l’exposer à partir des sources indexées.</p></div>}
  </div>;
}

function Info({ label, value }: { label: string; value?: string }) { return <div><p className="text-xs text-night-800/40">{label}</p><p className="font-semibold text-night-900">{value ?? "—"}</p></div>; }
