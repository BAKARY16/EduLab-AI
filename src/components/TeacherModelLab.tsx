"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bot, BookOpenCheck, LoaderCircle, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { MathBoardContent } from "@/components/MathBoardContent";
import { RobotTeacher, type RobotState } from "@/components/RobotTeacher";

type Source = { document_id?: string | null; title?: string; url?: string; official_status?: string };
type TutorResult = { answer?: string; detail?: string; sources?: Source[]; pipeline?: { retrieval?: string; web?: string; reasoning_model?: string } };
type Message = { role: "learner" | "teacher"; text: string; sources?: Source[] };

const SUGGESTIONS = [
  "Explique-moi cette notion avec un exemple simple.",
  "Pose-moi une question pour vérifier ma compréhension.",
  "Montre-moi une méthode de résolution étape par étape.",
];

export function TeacherModelLab() {
  const [question, setQuestion] = useState("");
  const [className, setClassName] = useState("Terminale D");
  const [subject, setSubject] = useState("Mathématiques");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/teacher-model").then(response => setOnline(response.ok)).catch(() => setOnline(false));
  }, []);

  async function ask(event?: FormEvent) {
    event?.preventDefault();
    const value = question.trim();
    if (!value || loading) return;
    const learnerMessage: Message = { role: "learner", text: value };
    const history = [...messages, learnerMessage];
    setMessages(history); setQuestion(""); setLoading(true);
    try {
      const response = await fetch("/api/teacher-model", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          instruction: `Réponds clairement à la question de l'apprenant. Explique avec une méthode progressive et un exemple lorsque cela aide. Question : ${value}`,
          learner_question: value,
          session_topic: `${subject} — ${className}`,
          context: messages.slice(-4).map(message => `${message.role === "learner" ? "Apprenant" : "Professeur"}: ${message.text}`).join("\n"),
          class_name: className,
          subject,
          max_new_tokens: 240,
          allow_web_research: true,
        }),
      });
      const result = await response.json() as TutorResult;
      if (!response.ok) throw new Error(result.detail || "Le professeur est momentanément indisponible.");
      setMessages(current => [...current, { role: "teacher", text: result.answer || "Je ne dispose pas encore d'éléments suffisamment fiables pour répondre.", sources: result.sources }]);
      setOnline(true);
    } catch (error) {
      setMessages(current => [...current, { role: "teacher", text: error instanceof Error ? error.message : "Le professeur est momentanément indisponible." }]);
      setOnline(false);
    } finally { setLoading(false); }
  }

  const robotState: RobotState = loading ? "reflexion" : messages.length ? "ecoute" : "salutation";

  return <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
    <aside className="rounded-[1.75rem] border border-[#d9e2d9] bg-[#f9f8f2] p-5">
      <div className="rounded-3xl bg-[#e9eee6] pt-3"><RobotTeacher state={robotState} size={230}/></div>
      <div className="mt-4 flex items-center justify-between"><div><p className="font-bold text-night-900">Professeur EduLab</p><p className="text-xs text-night-800/50">Assistant pédagogique</p></div><span className={`h-2.5 w-2.5 rounded-full ${online === false ? "bg-amber-500" : "bg-emerald-500"}`}/></div>
      <div className="mt-5 space-y-3">
        <label className="block text-xs font-semibold text-night-800/65">Niveau<select value={className} onChange={event=>setClassName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-night-900/10 bg-white p-2.5 text-sm text-night-900"><option>Troisième</option><option>Terminale C</option><option>Terminale D</option></select></label>
        <label className="block text-xs font-semibold text-night-800/65">Matière<select value={subject} onChange={event=>setSubject(event.target.value)} className="mt-1.5 w-full rounded-xl border border-night-900/10 bg-white p-2.5 text-sm text-night-900"><option>Mathématiques</option><option>Physique-Chimie</option><option>SVT</option><option>Français</option><option>Histoire-Géographie</option></select></label>
      </div>
      <p className="mt-5 flex items-start gap-2 rounded-xl bg-white p-3 text-xs leading-5 text-night-800/55"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#175c44]"/>Les réponses s’appuient sur les ressources disponibles et signalent leurs limites.</p>
    </aside>

    <section className="flex min-h-[650px] flex-col overflow-hidden rounded-[1.75rem] border border-night-900/10 bg-white shadow-[0_16px_45px_rgba(26,61,47,.05)]">
      <header className="flex items-center gap-3 border-b border-night-900/8 px-5 py-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#175c44] text-white"><Bot className="h-5 w-5"/></span><div><h2 className="font-bold text-night-900">Échange avec le professeur</h2><p className="text-xs text-night-800/45">{className} · {subject}</p></div></header>
      <div className="flex-1 space-y-4 overflow-y-auto bg-[#fbfaf6] p-5">
        {messages.length === 0 && <div className="mx-auto max-w-xl py-12 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e7f0e7] text-[#175c44]"><Sparkles className="h-6 w-6"/></span><h3 className="mt-4 text-xl font-semibold text-night-900">Que souhaites-tu comprendre ?</h3><p className="mt-2 text-sm leading-6 text-night-800/55">Pose une question précise. Le professeur peut expliquer, construire un exemple ou vérifier ton raisonnement.</p><div className="mt-6 grid gap-2">{SUGGESTIONS.map(suggestion=><button key={suggestion} onClick={()=>setQuestion(suggestion)} className="rounded-xl border border-night-900/8 bg-white px-4 py-3 text-left text-sm text-night-800/70 transition hover:border-[#175c44]/35 hover:text-[#175c44]">{suggestion}</button>)}</div></div>}
        {messages.map((message,index)=><div key={index} className={`flex gap-3 ${message.role === "learner" ? "justify-end" : "justify-start"}`}>{message.role === "teacher"&&<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#175c44] text-white"><Bot className="h-4 w-4"/></span>}<div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "learner" ? "bg-[#175c44] text-white" : "border border-night-900/8 bg-white text-night-800"}`}><MathBoardContent text={message.text}/>{message.sources&&message.sources.length>0&&<div className="mt-3 border-t border-night-900/8 pt-2 text-[11px] text-night-800/45"><p className="mb-1 flex items-center gap-1 font-semibold"><BookOpenCheck className="h-3.5 w-3.5"/>Sources consultées</p>{message.sources.slice(0,3).map((source,sourceIndex)=>source.url?<a key={sourceIndex} href={source.url} target="_blank" rel="noreferrer" className="mr-2 underline">{source.title||"Source"}</a>:<span key={sourceIndex} className="mr-2">{source.title||"Ressource EduLab"}</span>)}</div>}</div>{message.role === "learner"&&<span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#dceadf] text-[#175c44]"><UserRound className="h-4 w-4"/></span>}</div>)}
        {loading&&<div className="flex items-center gap-3 text-sm text-night-800/50"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#175c44] text-white"><Bot className="h-4 w-4"/></span><LoaderCircle className="h-4 w-4 animate-spin"/>Le professeur prépare une réponse structurée…</div>}
      </div>
      <form onSubmit={ask} className="border-t border-night-900/8 bg-white p-4"><div className="flex gap-2"><textarea value={question} onChange={event=>setQuestion(event.target.value)} rows={2} placeholder="Écris ta question ou décris ce que tu ne comprends pas…" className="min-h-14 flex-1 resize-none rounded-xl border border-night-900/12 px-4 py-3 text-sm outline-none focus:border-[#175c44]/50"/><button disabled={!question.trim()||loading} className="grid w-14 place-items-center rounded-xl bg-[#175c44] text-white transition hover:bg-[#124534] disabled:opacity-40" aria-label="Envoyer la question">{loading?<LoaderCircle className="h-5 w-5 animate-spin"/>:<Send className="h-5 w-5"/>}</button></div></form>
    </section>
  </div>;
}
