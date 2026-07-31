"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Bot, Eraser, LoaderCircle, MessageCircleQuestion, Mic, Pause, Play, Presentation, Square, Sparkles, Volume2, VolumeX } from "lucide-react";
import { RobotTeacher, type RobotState } from "@/components/RobotTeacher";
import { MathBoardContent } from "@/components/MathBoardContent";
import type { CatalogLesson, PedagogicalPlan } from "@/server/courseCatalog";
import { recordAttempt } from "@/app/actions";

type Checkpoint = { question: string; choices: string[]; correct_index?: number; explanation?: string };
type TutorPipeline = { retrieval?: string; web?: string; research_model?: string; reasoning_model?: string };
type TutorResult = { answer?: string; detail?: string; checkpoint?: Checkpoint; web_research_used?: boolean; pipeline?: TutorPipeline; sources?: { title?: string; source_id?: string; url?: string }[] };
type Mode = "lesson" | "chapter";
type VoiceIntent = "question" | "answer";

export function AIProfessorClassroom({ lesson, chapterLessons, pedagogicalPlan }: { lesson: CatalogLesson; chapterLessons: string[]; pedagogicalPlan?: PedagogicalPlan }) {
  const [mode, setMode] = useState<Mode>("lesson");
  const [board, setBoard] = useState("Choisis ton parcours puis lance l’exposé.\n\nLe professeur présentera uniquement les connaissances essentielles à retenir.");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<RobotState>("salutation");
  const [sources, setSources] = useState<TutorResult["sources"]>([]);
  const [pipeline, setPipeline] = useState<TutorPipeline | null>(null);
  const [voiceOn, setVoiceOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [checkpoint, setCheckpoint] = useState<Checkpoint | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [chapterStep, setChapterStep] = useState(0);
  const [pendingChapterStep, setPendingChapterStep] = useState<number | null>(null);
  const [voiceIntent, setVoiceIntent] = useState<VoiceIntent>("question");
  const [activeSection, setActiveSection] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechEnergy = useRef(0);
  const audioFrame = useRef<number | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const speechFinishedRef = useRef<(() => void) | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderStreamRef = useRef<MediaStream | null>(null);
  const boardTimerRef = useRef<number | null>(null);
  // Horodatage réel pour mesurer le temps passé sur chaque interaction avant de la persister.
  const clockRef = useRef(0);
  const promptShownAtRef = useRef(0);
  const elapsedSec = () => Math.max(1, Math.round((clockRef.current - promptShownAtRef.current) / 1000));

  const scope = useMemo(() => mode === "lesson" ? `le cours « ${lesson.title} »` : `toute la notion « ${lesson.chapter} », comprenant : ${chapterLessons.join(", ")}`, [mode, lesson, chapterLessons]);
  const fullLessonContext = useMemo(() => pedagogicalPlan?.sections.map(section => `${section.title}\n${section.content}`).join("\n\n") || "", [pedagogicalPlan]);

  const stopVoice = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (audioFrame.current !== null) cancelAnimationFrame(audioFrame.current);
    audioFrame.current = null; speechEnergy.current = 0;
    if (audioContext.current) { void audioContext.current.close(); audioContext.current = null; }
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);
  useEffect(() => stopVoice, [stopVoice]);
  useEffect(() => () => {
    if (boardTimerRef.current !== null) window.clearInterval(boardTimerRef.current);
  }, []);
  useEffect(() => {
    const tick = () => { clockRef.current = Date.now(); };
    tick();
    promptShownAtRef.current = clockRef.current;
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const speakInBrowser = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`]/g, " "));
    utterance.lang = "fr-FR"; utterance.rate = .94;
    const voices = window.speechSynthesis.getVoices();
    utterance.voice = voices.find(voice => voice.lang.toLowerCase().startsWith("fr") && /natural|neural|online|denise|vivienne/i.test(voice.name)) || voices.find(voice => voice.lang.toLowerCase().startsWith("fr")) || null;
    utterance.onstart = () => { setSpeaking(true); setState("parole"); };
    utterance.onboundary = () => { speechEnergy.current = .08 + Math.random() * .06; setSpeaking(true); window.setTimeout(() => { speechEnergy.current = .025; }, 110); };
    utterance.onend = () => { speechEnergy.current = 0; setSpeaking(false); setState("ecoute"); const next=speechFinishedRef.current; speechFinishedRef.current=null; next?.(); };
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

  const speak = useCallback(async (text: string) => {
    if (!voiceOn || !text.trim()) return;
    stopVoice(); setSpeaking(true); setState("parole");
    try {
      const response = await fetch("/api/voice/tts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, language: "fr" }), signal: AbortSignal.timeout(90000) });
      if (!response.ok) throw new Error("fallback");
      const url = URL.createObjectURL(await response.blob());
      const audio = new Audio(url); audioRef.current = audio;
      const context = new AudioContext(); audioContext.current = context;
      const analyser = context.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = .58;
      const source = context.createMediaElementSource(audio); source.connect(analyser); analyser.connect(context.destination);
      const bins = new Uint8Array(analyser.frequencyBinCount);
      const measure = () => { analyser.getByteFrequencyData(bins); let sum = 0; for (const value of bins) sum += value * value; speechEnergy.current = Math.sqrt(sum / bins.length) / 255; audioFrame.current = requestAnimationFrame(measure); };
      measure();
      audio.onended = () => { URL.revokeObjectURL(url); audioRef.current = null; if (audioFrame.current !== null) cancelAnimationFrame(audioFrame.current); audioFrame.current = null; speechEnergy.current = 0; void context.close(); audioContext.current = null; setSpeaking(false); setState("ecoute"); const next=speechFinishedRef.current; speechFinishedRef.current=null; next?.(); };
      audio.onerror = () => { URL.revokeObjectURL(url); setSpeaking(false); speakInBrowser(text); };
      await audio.play();
    } catch { setSpeaking(false); speakInBrowser(text); }
  }, [voiceOn, speakInBrowser, stopVoice]);

  const writeBoard = useCallback((text: string) => {
    if (boardTimerRef.current !== null) window.clearInterval(boardTimerRef.current);
    setBoard("");
    let cursor = 0;
    boardTimerRef.current = window.setInterval(() => {
      cursor = Math.min(text.length, cursor + 18);
      setBoard(text.slice(0, cursor));
      if (cursor >= text.length && boardTimerRef.current !== null) {
        window.clearInterval(boardTimerRef.current); boardTimerRef.current = null;
      }
    }, 24);
  }, []);

  async function ask(instruction: string, nextState: RobotState = "parole", onSpeechFinished?: () => void, learnerQuestion?: string) {
    stopVoice();
    if (boardTimerRef.current !== null) window.clearInterval(boardTimerRef.current);
    boardTimerRef.current = null; setBoard(""); setLoading(true); setState("reflexion");
    try {
      const response = await fetch("/api/teacher-model", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ instruction, learner_question: learnerQuestion, session_topic: `${lesson.subject} — ${lesson.chapter} — ${lesson.title}`, session_context: `${fullLessonContext}\n\nSECTION AFFICHÉE:\n${board}`.slice(0, 6000), context: learnerQuestion ? "" : board.slice(0, 4000), class_name: lesson.class_name, subject: lesson.subject, max_new_tokens: 240, allow_web_research: true }) });
      const result = await response.json() as TutorResult;
      if (!response.ok) throw new Error(result.detail || "Professeur indisponible");
      const answer = result.answer || "Le contexte disponible ne suffit pas pour répondre de manière fiable.";
      setSources(result.sources || []); setPipeline(result.pipeline || null); setState(nextState);
      writeBoard(answer);
      setCheckpoint(result.checkpoint || null); setSelectedChoice(null);
      const requiresLearnerAction = /EXERCICE À FAIRE|QUESTION À L[’']APPRENANT/i.test(answer);
      speechFinishedRef.current = requiresLearnerAction ? null : onSpeechFinished || null;
      if (result.answer) {
        if (voiceOn) void speak(result.answer);
        else if (onSpeechFinished && !requiresLearnerAction) window.setTimeout(onSpeechFinished, 1200);
      }
    } catch (error) { setBoard(error instanceof Error ? error.message : "Le professeur IA est momentanément indisponible."); setState("correction"); }
    finally { setLoading(false); }
  }

  function presentChapterLesson(index: number) { const title=chapterLessons[index]; if(!title) return; const next=index + 1 < chapterLessons.length ? index + 1 : null; setChapterStep(index); setPendingChapterStep(next); promptShownAtRef.current=clockRef.current; void ask(`Présente la partie « ${title} » du sommaire pour ${lesson.class_name}. Donne l’objectif, les idées essentielles, les formules et une démonstration courte au tableau. Si un exercice est indispensable avant de continuer, écris exactement « EXERCICE À FAIRE » puis pose-le. Sinon termine par « Partie comprise, passons à la suite ». Appuie-toi d'abord sur le RAG et cite les sources utilisées.`, "parole", next === null ? undefined : () => presentChapterLesson(next)); }
  function showPlanSection(index: number) {
    const section=pedagogicalPlan?.sections[index]; if(!section)return;
    setStarted(true); setActiveSection(index); setSelectedChoice(null);
    const text=`${section.title.toUpperCase()}\n\n${section.content}`;
    writeBoard(text); setState(section.kind === "rule" || section.kind === "example" ? "ecriture" : "parole");
    setSources(pedagogicalPlan.sources.map(source=>({title:source,source_id:source})));
    setPipeline({retrieval:"plan pédagogique de la leçon",web:"aucun",research_model:"none",reasoning_model:"contenu contrôlé"});
    setCheckpoint(section.choices ? {question:section.content,choices:section.choices,correct_index:section.correct_index}:null);
    if(voiceOn)void speak(text);
  }
  function startLesson() {
    // Persistance réelle : le tableau de bord doit refléter l'ouverture effective d'un cours,
    // pas seulement un état visuel local — comptée une seule fois par session.
    if (!started) recordAttempt({ scope: "lesson_started", subject: lesson.subject, statement: lesson.title, hintsUsed: 0, timeSpentSec: 1 });
    setStarted(true); promptShownAtRef.current=clockRef.current;
    if(mode === "chapter") { presentChapterLesson(0); return; }
    if (pedagogicalPlan) { showPlanSection(0); return; }
    setBoard("Cette leçon ne possède pas encore de plan pédagogique validé. Elle ne sera pas générée automatiquement afin d'éviter un cours faux ou hors programme.");
    setState("correction");
  }
  function demonstrate() {
    recordAttempt({ scope: "lesson_demonstration", subject: lesson.subject, statement: scope, hintsUsed: 0, timeSpentSec: elapsedSec() });
    promptShownAtRef.current=clockRef.current;
    void ask(`Réalise au tableau une démonstration strictement liée à ${scope}, en ${lesson.subject}, et au plan pédagogique fourni. Présente la situation, les données utiles, la notion ou propriété employée, les étapes sans saut, la vérification et la conclusion. N'introduis aucun autre chapitre. Si les données validées ne suffisent pas, dis-le clairement au lieu d'inventer.`, "ecriture");
  }
  function submitQuestion(event: FormEvent) {
    event.preventDefault(); if (!question.trim()) return; const value = question; setQuestion("");
    recordAttempt({ scope: "lesson_question", subject: lesson.subject, statement: value, hintsUsed: 0, timeSpentSec: elapsedSec() });
    promptShownAtRef.current=clockRef.current;
    void ask(`Réponds à la question exacte de l'apprenant dans le cadre exclusif du cours actuel « ${lesson.title} ». Commence par relier la réponse à la section affichée. Tu peux compléter avec une source fiable seulement si elle traite de la même notion. Si la question appartient à un autre cours, signale-le brièvement et ramène l'apprenant au cours actuel. Question : ${value}`, "parole", undefined, value);
  }
  function evaluateAnswer() {
    if (!question.trim()) return; const value = question; setQuestion(""); const next=pendingChapterStep;
    recordAttempt({ scope: "lesson_checkpoint_open", subject: lesson.subject, statement: checkpoint?.question || lesson.title, attempt: value, hintsUsed: 0, timeSpentSec: elapsedSec() });
    promptShownAtRef.current=clockRef.current;
    void ask(`Évalue cette réponse de l'apprenant à la question de vérification affichée au tableau. Réponse: ${value}. Commence par dire ce qui est juste, identifie précisément l'erreur éventuelle, donne un indice avant la correction et propose une question courte de remédiation.`, "correction", next === null ? undefined : () => presentChapterLesson(next));
  }
  function answerChoice(index: number) {
    if(!checkpoint) return; setSelectedChoice(index); const expected=checkpoint.correct_index; const correct=expected===index; const explanation=checkpoint.explanation || ""; const next=pendingChapterStep;
    recordAttempt({ scope: "lesson_checkpoint", subject: lesson.subject, statement: checkpoint.question, attempt: checkpoint.choices[index], correct, hintsUsed: 0, timeSpentSec: elapsedSec() });
    promptShownAtRef.current=clockRef.current;
    void ask(`L'apprenant a choisi « ${checkpoint.choices[index]} » pour « ${checkpoint.question} ». La réponse attendue est l'option ${expected === undefined ? "à déterminer" : expected + 1}: « ${expected === undefined ? "" : checkpoint.choices[expected]} ». Explique ${correct ? "pourquoi cette réponse est juste" : "précisément pourquoi ce choix est faux, puis donne la bonne méthode"}. Correction de référence: ${explanation}.`, "correction", next === null ? undefined : () => presentChapterLesson(next));
  }
  function browserVoiceFallback() {
    type RecognitionResult = { 0: { transcript: string } };
    type RecognitionEvent = { results: { 0: RecognitionResult } };
    type Recognition = { lang: string; interimResults: boolean; onresult: ((event: RecognitionEvent) => void) | null; onerror: (() => void) | null; start: () => void };
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => Recognition }).webkitSpeechRecognition;
    if (!SpeechRecognition) { setBoard("La transcription ElevenLabs n'est pas autorisée par la clé et ce navigateur ne propose pas de reconnaissance vocale de secours."); return; }
    const recognition = new SpeechRecognition(); recognition.lang = "fr-FR"; recognition.interimResults = false;
    recognition.onresult = event => { const text = event.results[0][0].transcript; setQuestion(text); if(voiceIntent === "answer" && checkpoint){const next=pendingChapterStep; void ask(`Réponse orale de l'apprenant à « ${checkpoint.question} »: ${text}. Évalue-la et explique la correction.`, "correction", next === null ? undefined : () => presentChapterLesson(next));} else void ask(`Réponds à cette question orale dans le cadre exclusif du cours actuel « ${lesson.title} ». N'introduis pas un autre chapitre. Si une source externe est nécessaire, elle doit traiter exactement de cette notion : ${text}`, "parole", undefined, text); };
    recognition.onerror = () => setBoard("Je n'ai pas compris la question. Réessaie en parlant un peu plus lentement.");
    recognition.start(); setBoard("ElevenLabs STT n'est pas encore autorisé. J'écoute avec la reconnaissance vocale du navigateur…");
  }
  async function toggleRecording() {
    if (recording) { recorderRef.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorderStreamRef.current = stream;
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        setRecording(false); setTranscribing(true); stream.getTracks().forEach(track => track.stop());
        try {
          const form = new FormData(); form.append("audio", new Blob(chunks, { type: recorder.mimeType || "audio/webm" }), "question.webm");
          const response = await fetch("/api/voice/stt", { method: "POST", body: form });
          const result = await response.json() as { text?: string; detail?: string };
          if (!response.ok || !result.text) throw new Error(result.detail || "Transcription impossible");
          setQuestion(result.text);
          if (voiceIntent === "answer" && checkpoint) {
            const next=pendingChapterStep;
            await ask(`Réponse orale de l'apprenant à « ${checkpoint.question} »: ${result.text}. Évalue-la, explique pourquoi elle est juste ou fausse et donne la correction pédagogique.`, "correction", next === null ? undefined : () => presentChapterLesson(next));
          } else await ask(`Réponds à cette question orale dans le cadre exclusif du cours actuel « ${lesson.title} ». N'introduis pas un autre chapitre. Une éventuelle recherche doit seulement confirmer cette notion : ${result.text}`, "parole", undefined, result.text);
        } catch { browserVoiceFallback(); }
        finally { setTranscribing(false); }
      };
      recorder.start(); setRecording(true); setState("ecoute");
    } catch { setBoard("Autorise le microphone dans le navigateur pour poser une question par la voix."); }
  }
  function toggleVoice() { if (voiceOn) stopVoice(); setVoiceOn(value => !value); }

  return <section className="mt-6 overflow-hidden rounded-[1.75rem] border border-[#174c3a]/15 bg-[#f5f1e7] shadow-[0_18px_50px_rgba(23,76,58,.09)]">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#174c3a]/10 bg-white px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#174c3a] text-white"><Bot className="h-5 w-5"/></span><div><h3 className="font-bold text-night-900">Professeur IA</h3><p className="text-xs text-night-800/45">Exposé vocal synchronisé · tableau · questions</p></div></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${loading ? "bg-amber-100 text-amber-800" : speaking ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"}`}>{loading ? "Préparation…" : speaking ? "En train de parler" : "À l’écoute"}</span></header>
    <div className="p-4 sm:p-5">
      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><ModeButton active onClick={() => setMode("lesson")} icon={<BookOpen className="h-4 w-4"/>} title="Leçon structurée" subtitle={`${lesson.title} · ${pedagogicalPlan?.sections.length || 0} séquences`}/><span className={`self-center rounded-full px-3 py-1.5 text-xs font-semibold ${pedagogicalPlan ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{pedagogicalPlan ? `Plan ${pedagogicalPlan.validation_status === "curated" ? "validé" : "à valider"}` : "Plan indisponible"}</span></div>
      {pedagogicalPlan && <div className="mb-4 rounded-2xl border border-[#174c3a]/12 bg-white p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#174c3a]">Sommaire du cours</p><p className="mt-1 text-sm text-night-800/55">Une séquence à la fois — pose une question avant de continuer si nécessaire.</p></div><span className="text-xs font-semibold text-night-800/45">{started ? `${activeSection+1}/${pedagogicalPlan.sections.length}` : `${pedagogicalPlan.sections.length} étapes`}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{pedagogicalPlan.sections.map((section,index)=><button key={section.id} onClick={()=>showPlanSection(index)} className={`rounded-xl border px-3 py-2.5 text-left text-sm transition ${started&&activeSection===index?"border-[#174c3a] bg-[#edf4ee] text-[#174c3a]":"border-night-900/10 bg-[#fbfaf6] text-night-800/70 hover:border-[#174c3a]/30"}`}><span className="mr-2 font-bold">{index+1}.</span>{section.title}</button>)}</div>{started&&<div className="mt-3 flex justify-end gap-2"><button onClick={()=>showPlanSection(activeSection-1)} disabled={activeSection===0} className="rounded-lg border border-night-900/10 px-3 py-2 text-xs font-semibold disabled:opacity-35">Étape précédente</button><button onClick={()=>showPlanSection(activeSection+1)} disabled={activeSection===pedagogicalPlan.sections.length-1} className="rounded-lg bg-[#174c3a] px-3 py-2 text-xs font-semibold text-white disabled:opacity-35">Étape suivante</button></div>}</div>}
      {mode === "chapter" && started && <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#edf4ee] px-4 py-2 text-sm text-[#174c3a]"><span className="font-bold">Progression automatique</span><span>{chapterStep + 1}/{chapterLessons.length} · {chapterLessons[chapterStep]}</span></div>}
      <div className="grid min-h-[500px] gap-3 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#e8dfcb,#f6f1e7_55%,#ded1b6)] p-3 sm:p-5 lg:grid-cols-[minmax(0,1fr)_230px]">
        <div className="overflow-hidden rounded-2xl border-[7px] border-[#7d5938] bg-[#173b31] shadow-[0_18px_35px_rgba(52,42,27,.22)]">
          <div className="flex h-[470px] flex-col p-5 text-[#f4f0df]"><div className="mb-3 flex items-center justify-between border-b border-white/10 pb-2"><span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-[#b8d7c4]"><Sparkles className="h-4 w-4"/>Tableau mathématique</span><button onClick={() => { if (boardTimerRef.current !== null) window.clearInterval(boardTimerRef.current); boardTimerRef.current = null; setBoard(""); }} className="rounded p-1 text-white/45 hover:bg-white/10 hover:text-white" aria-label="Effacer le tableau"><Eraser className="h-4 w-4"/></button></div><div className="min-h-0 flex-1 overflow-y-auto pr-2 text-sm">{loading ? <span className="flex items-center gap-2 text-[#b8d7c4]"><LoaderCircle className="h-4 w-4 animate-spin"/>Le professeur prépare l’essentiel…</span> : <MathBoardContent text={board}/>}</div>{sources && sources.length > 0 && <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-[11px] text-white/55">{sources.map((source,index) => source.url ? <a className="underline" target="_blank" rel="noreferrer" href={source.url} key={`${source.title}-${index}`}>{source.title || "Source web"}</a> : <span key={`${source.title}-${index}`}>{source.title || source.source_id}</span>)}</div>}</div>
        </div>
        <div className="relative flex items-end justify-center overflow-hidden"><RobotTeacher state={state} speaking={speaking} speechEnergy={speechEnergy} size={245}/><span className="absolute bottom-9 left-1/2 -z-10 h-4 w-36 -translate-x-1/2 rounded-[50%] bg-black/15 blur-md"/></div>
        <div className="absolute bottom-3 right-3 z-30 hidden rounded-full border border-white/60 bg-white/90 p-1 shadow-md backdrop-blur lg:flex"><button onClick={toggleVoice} className="grid h-9 w-9 place-items-center rounded-full text-[#174c3a] hover:bg-[#edf4ee]" aria-label={voiceOn ? "Couper la voix" : "Activer la voix"}>{voiceOn ? <Volume2 className="h-4 w-4"/> : <VolumeX className="h-4 w-4"/>}</button>{speaking && <button onClick={stopVoice} className="grid h-9 w-9 place-items-center rounded-full text-[#d97836] hover:bg-orange-50" aria-label="Arrêter la lecture"><Pause className="h-4 w-4"/></button>}</div>
      </div>
      {checkpoint && <div className="mt-4 rounded-2xl border border-[#174c3a]/15 bg-white p-4"><p className="text-xs font-bold uppercase tracking-[.14em] text-[#174c3a]">Question du professeur</p><p className="mt-2 font-semibold text-night-900">{checkpoint.question}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{checkpoint.choices.map((choice,index)=><button key={choice} onClick={()=>answerChoice(index)} disabled={loading} className={`rounded-xl border p-3 text-left text-sm transition ${selectedChoice===index ? "border-[#d97836] bg-orange-50" : "border-night-900/10 hover:border-[#174c3a]/30"}`}><span className="mr-2 font-bold">{String.fromCharCode(65+index)}.</span>{choice}</button>)}</div><p className="mt-3 text-xs text-night-800/50">Choisis une réponse ou utilise le microphone pour répondre librement.</p></div>}
      <div className="mt-4 flex flex-wrap gap-2"><button onClick={startLesson} disabled={loading} className="inline-flex items-center gap-2 rounded-xl bg-[#174c3a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{started ? <Play className="h-4 w-4"/> : <Presentation className="h-4 w-4"/>}{started ? "Reprendre l’exposé" : "Commencer l’exposé"}</button><button onClick={demonstrate} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-[#174c3a]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#174c3a] disabled:opacity-50"><Sparkles className="h-4 w-4"/>Démontrer</button><button onClick={() => void speak(board)} disabled={loading || !board.trim()} className="inline-flex items-center gap-2 rounded-xl border border-[#174c3a]/15 bg-white px-4 py-2.5 text-sm font-semibold text-[#174c3a] disabled:opacity-40"><Volume2 className="h-4 w-4"/>{speaking ? "Relire" : "Lire le tableau"}</button><button onClick={toggleVoice} className="inline-flex items-center gap-2 rounded-xl border border-[#174c3a]/15 bg-white px-3 py-2.5 text-sm font-semibold text-[#174c3a] lg:hidden">{voiceOn ? <Volume2 className="h-4 w-4"/> : <VolumeX className="h-4 w-4"/>}Voix</button></div>
      {pipeline && <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]"><span className="font-bold uppercase tracking-wide text-night-800/45">Moteurs utilisés</span><span className="rounded-full bg-[#edf4ee] px-2.5 py-1 text-[#174c3a]">RAG : {pipeline.retrieval || "aucun"}</span><span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">Web : {pipeline.web || "aucun"}</span>{pipeline.research_model && pipeline.research_model !== "none" && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">Recherche : {pipeline.research_model}</span>}<span className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">Raisonnement : {pipeline.reasoning_model || "secours local"}</span></div>}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs"><span className="font-semibold text-night-800/55">Le microphone sert à :</span><button type="button" onClick={() => setVoiceIntent("question")} className={`rounded-full px-3 py-1.5 font-semibold ${voiceIntent === "question" ? "bg-[#174c3a] text-white" : "bg-white text-[#174c3a]"}`}>Poser une question</button>{checkpoint && <button type="button" onClick={() => setVoiceIntent("answer")} className={`rounded-full px-3 py-1.5 font-semibold ${voiceIntent === "answer" ? "bg-[#d97836] text-white" : "bg-white text-[#174c3a]"}`}>Répondre au professeur</button>}</div>
      <form onSubmit={submitQuestion} className="mt-2 flex flex-wrap gap-2"><div className="relative min-w-[220px] flex-1"><MessageCircleQuestion className="absolute left-3 top-3 h-4 w-4 text-night-800/35"/><input value={question} onChange={event => setQuestion(event.target.value)} placeholder={transcribing ? "Transcription en cours…" : voiceIntent === "answer" ? "Ma réponse à l'évaluation…" : "Ma question au professeur…"} className="w-full rounded-xl border border-night-900/10 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#174c3a]/40"/></div><button type="button" onClick={() => void toggleRecording()} disabled={transcribing || loading} className={`grid w-11 place-items-center rounded-xl border ${recording ? "border-red-300 bg-red-50 text-red-600" : "border-[#174c3a]/15 bg-white text-[#174c3a]"}`} aria-label={recording ? "Arrêter l'enregistrement" : voiceIntent === "answer" ? "Répondre par la voix" : "Poser une question par la voix"}>{transcribing ? <LoaderCircle className="h-4 w-4 animate-spin"/> : recording ? <Square className="h-4 w-4 fill-current"/> : <Mic className="h-4 w-4"/>}</button>{started && <button type="button" onClick={evaluateAnswer} disabled={loading || !question.trim()} className="rounded-xl border border-[#174c3a]/20 bg-[#edf4ee] px-3 text-sm font-semibold text-[#174c3a] disabled:opacity-40">Évaluer ma réponse</button>}<button disabled={loading || !question.trim()} className="rounded-xl bg-[#d97836] px-4 text-sm font-semibold text-white disabled:opacity-40">Poser la question</button></form>
    </div>
  </section>;
}

function ModeButton({ active, onClick, icon, title, subtitle }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string }) { return <button onClick={onClick} className={`rounded-xl border p-3 text-left transition ${active ? "border-[#174c3a] bg-[#edf4ee]" : "border-night-900/10 bg-white hover:border-[#174c3a]/30"}`}><span className="flex items-center gap-2 text-sm font-bold text-night-900">{icon}{title}</span><span className="mt-1 block truncate text-xs text-night-800/45">{subtitle}</span></button>; }
