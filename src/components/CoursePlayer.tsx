"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Hand,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  RotateCcw,
  Lightbulb,
  Plus,
  X,
  Send,
  Sparkles,
  Mic,
  Gauge,
  FlaskConical,
  CheckCircle2,
  XCircle,
  BookOpen,
  Loader2,
  Cpu,
} from "lucide-react";
import { RobotTeacher, type RobotState } from "@/components/RobotTeacher";
import { Button, Badge, ProgressBar } from "@/components/ui";
import { recordProgress, recordAttempt, logActivity } from "@/app/actions";
import type { CourseDef, CourseStep, LessonContent } from "@/lib/content";

const STATE_BY_KIND: Record<CourseStep["kind"], RobotState> = {
  intro: "salutation",
  explain: "parole",
  formula: "ecriture",
  example: "parole",
  question: "correction",
  encouragement: "encouragement",
};

type CitedSource = { title: string; official_status: string; validation_status: string };

const OFFICIAL_LABELS: Record<string, string> = {
  official: "officiel",
  community: "communautaire",
  ai_generated: "généré par l'IA",
};

const VALIDATION_LABELS: Record<string, string> = {
  validated: "validé",
  pending: "en attente de validation",
  ai_generated: "généré par l'IA",
  rejected: "rejeté",
};

const AUTO_ADVANCE_DELAY_MS = 2000;

function sourceLabel(s: CitedSource): string {
  const official = OFFICIAL_LABELS[s.official_status] || s.official_status;
  const validation = VALIDATION_LABELS[s.validation_status] || s.validation_status;
  return `${s.title} (${official}, ${validation})`;
}

const REFORMULATIONS: Record<string, string> = {
  pythagore: "Plus simplement : si tu connais deux côtés d'un triangle rectangle, le 3ᵉ se calcule en faisant la somme des carrés, puis la racine carrée.",
  fonctions: "Plus simplement : une fonction affine, c'est une droite. 'a' dit si elle monte ou descend, 'b' dit où elle coupe l'axe vertical.",
  ohm: "Plus simplement : la résistance freine le courant. Si tu augmentes la résistance, moins de courant passe pour la même tension.",
  ph: "Plus simplement : le pH est une note de 0 à 14. En dessous de 7 c'est acide (comme le citron), au-dessus c'est basique (comme le savon).",
  respiration: "Plus simplement : quand tu inspires, tu prends de l'oxygène. Quand tu expires, tu rejettes du gaz carbonique, déchet de ton corps.",
  genetique: "Plus simplement : les enfants héritent d'un allèle de chaque parent. L'allèle dominant s'exprime même en un seul exemplaire.",
};

export function CoursePlayer({ course }: { course: CourseDef }) {
  const content = course.content as LessonContent;
  const steps = content.steps;
  const [idx, setIdx] = useState(0);
  const [robot, setRobot] = useState<RobotState>("arrivee");
  const [voiceOn, setVoiceOn] = useState(false);
  const [rate, setRate] = useState(1);
  const [paused, setPaused] = useState(false);
  const [hand, setHand] = useState(false);
  const [handQuestion, setHandQuestion] = useState("");
  const [handReply, setHandReply] = useState<string | null>(null);
  const [handLive, setHandLive] = useState(false);
  const [handLoading, setHandLoading] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showExtra, setShowExtra] = useState<string | null>(null);
  const [extraText, setExtraText] = useState<string | null>(null);
  const [extraLive, setExtraLive] = useState(false);
  const [extraLoading, setExtraLoading] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [sttLoading, setSttLoading] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [handSources, setHandSources] = useState<CitedSource[]>([]);
  const [extraSources, setExtraSources] = useState<CitedSource[]>([]);
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(0);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const stepStartRef = useRef<number>(Date.now());
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chosenVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const speechStoppedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const ttsAbortRef = useRef<AbortController | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const micStreamRef = useRef<MediaStream | null>(null);

  const step = steps[idx];
  const classLabel = course.level === "Lycée" ? "Terminale D" : "Troisième";

  useEffect(() => {
    setVoiceSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  // Sélection d'une voix française naturelle (les voix "neurales/en ligne" du
  // navigateur sonnent bien plus humaines que la voix SAPI par défaut de Windows).
  useEffect(() => {
    if (!voiceSupported) return;
    function selectBestVoice() {
      const voices = window.speechSynthesis.getVoices();
      const french = voices.filter((v) => v.lang?.toLowerCase().startsWith("fr"));
      const pool = french.length ? french : voices;
      const preferred =
        pool.find((v) => /natural|neural|online|denise|vivienne|multilingual/i.test(v.name)) ||
        pool.find((v) => /google/i.test(v.name)) ||
        pool[0] ||
        null;
      chosenVoiceRef.current = preferred;
    }
    selectBestVoice();
    window.speechSynthesis.addEventListener("voiceschanged", selectBestVoice);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", selectBestVoice);
  }, [voiceSupported]);

  // Robot state + voice on step change
  useEffect(() => {
    setSelected(null);
    setAnswered(false);
    setShowExtra(null);
    setExtraText(null);
    setExtraLive(false);
    setRobot(STATE_BY_KIND[step.kind]);
    stepStartRef.current = Date.now();
  }, [idx, step.kind]);

  // Dès l'ouverture réelle du cours, on l'inscrit "en cours" — le tableau de bord doit
  // refléter l'activité au moment où elle se produit, pas seulement à la fin.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    recordProgress(course.key, 0.05, 5);
    logActivity({ activityType: "course_started", subject: course.subject, meta: { key: course.key } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function queryTeacherModel(
    instruction: string,
    context: string,
  ): Promise<{ answer: string; live: boolean; sources: CitedSource[] }> {
    try {
      const res = await fetch("/api/teacher-model", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          instruction,
          context,
          class_name: classLabel,
          subject: course.subject,
          max_new_tokens: 96,
        }),
      });
      const data = await res.json();
      if (res.ok && typeof data.answer === "string" && data.answer.trim()) {
        return { answer: data.answer as string, live: true, sources: Array.isArray(data.sources) ? data.sources : [] };
      }
      return { answer: "", live: false, sources: [] };
    } catch {
      return { answer: "", live: false, sources: [] };
    }
  }

  // Coupe tout ce qui est en train d'être prononcé (audio ElevenLabs en vol ou voix navigateur).
  const stopSpeaking = useCallback(() => {
    speechStoppedRef.current = true;
    ttsAbortRef.current?.abort();
    ttsAbortRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    window.speechSynthesis?.cancel();
  }, []);

  // Repli navigateur (SAPI) utilisé si le service ElevenLabs échoue ou n'est pas configuré.
  // onEnd n'est appelé qu'en fin de lecture naturelle (jamais après une coupure volontaire).
  const speakBrowser = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!voiceSupported) {
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();
      // Découpage en phrases : une voix qui respire à la ponctuation sonne
      // nettement plus humaine qu'un unique bloc monotone.
      const sentences = text.split(/(?<=[.!?…])\s+/).filter((s) => s.trim().length > 0);
      const queue = sentences.length ? sentences : [text];
      let i = 0;
      const speakNext = () => {
        if (speechStoppedRef.current) return;
        if (i >= queue.length) {
          onEnd?.();
          return;
        }
        const u = new SpeechSynthesisUtterance(queue[i]);
        u.lang = "fr-FR";
        u.rate = rate;
        u.pitch = 1.02;
        if (chosenVoiceRef.current) u.voice = chosenVoiceRef.current;
        u.onend = () => {
          i += 1;
          speakNext();
        };
        utterRef.current = u;
        window.speechSynthesis.speak(u);
      };
      speakNext();
    },
    [voiceSupported, rate],
  );

  // onEnd signale la fin réelle de la lecture (audio terminé) — sert à déclencher le passage
  // automatique à l'étape suivante. Jamais appelé si la lecture a été coupée volontairement.
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!voiceOn || paused || !text.trim()) return;
      stopSpeaking();
      speechStoppedRef.current = false;
      const clean = text.replace(/[#*>_]/g, "");
      const controller = new AbortController();
      ttsAbortRef.current = controller;

      fetch("/api/voice/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: clean }),
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error("tts-unavailable");
          return res.blob();
        })
        .then((blob) => {
          if (speechStoppedRef.current) return;
          const url = URL.createObjectURL(blob);
          audioUrlRef.current = url;
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.playbackRate = rate;
          audio.onended = () => {
            URL.revokeObjectURL(url);
            if (audioUrlRef.current === url) audioUrlRef.current = null;
            if (!speechStoppedRef.current) onEnd?.();
          };
          return audio.play().catch(() => speakBrowser(clean, onEnd));
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          speakBrowser(clean, onEnd);
        });
    },
    [voiceOn, paused, rate, speakBrowser, stopSpeaking],
  );

  const go = useCallback(
    (n: number) => {
      const next = Math.max(0, Math.min(steps.length - 1, n));
      setIdx(next);
    },
    [steps.length],
  );

  function cancelAutoAdvance() {
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }
  }

  useEffect(() => {
    if (hand) {
      cancelAutoAdvance();
      stopSpeaking();
      setRobot("ecoute");
      return;
    }
    cancelAutoAdvance();
    const stepIndexAtSpeechStart = idx;
    speak(stepBody(step), () => {
      if (!autoAdvanceEnabled || stepIndexAtSpeechStart >= steps.length - 1) return;
      autoAdvanceTimerRef.current = setTimeout(() => {
        go(stepIndexAtSpeechStart + 1);
      }, AUTO_ADVANCE_DELAY_MS);
    });
  }, [idx, voiceOn, paused, hand, rate, speak, step, stopSpeaking, autoAdvanceEnabled, go, steps.length]);

  useEffect(() => {
    return () => {
      cancelAutoAdvance();
      stopSpeaking();
    };
  }, [stopSpeaking]);

  async function startRecording() {
    setMicError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicError("Micro non disponible sur ce navigateur.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setSttLoading(true);
        try {
          const form = new FormData();
          form.append("audio", blob, "question.webm");
          const res = await fetch("/api/voice/stt", { method: "POST", body: form });
          const data = await res.json();
          if (res.ok && typeof data.text === "string" && data.text.trim()) {
            setHandQuestion(data.text);
            submitHand(data.text);
          } else {
            setMicError(data.detail || "Transcription indisponible.");
          }
        } catch {
          setMicError("Transcription indisponible.");
        } finally {
          setSttLoading(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRobot("ecoute");
    } catch {
      setMicError("Micro indisponible ou accès refusé.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function stepBody(s: CourseStep): string {
    if ("body" in s) return s.body;
    if ("q" in s) return s.q;
    return "";
  }


  function togglePause() {
    setPaused((p) => {
      if (!p) stopSpeaking();
      return !p;
    });
  }

  function raiseHand() {
    setHand(true);
    setHandReply(null);
    setHandSources([]);
    setMicError(null);
  }

  async function submitHand(text?: string) {
    setRobot("reflexion");
    setHandLoading(true);
    const isSimple = text === "simple";
    const isExample = text === "example";
    const instruction = isSimple
      ? `Reformule et simplifie l'explication de l'étape en cours ("${course.lesson}") pour un élève de ${classLabel}, avec un exemple concret court.`
      : isExample
        ? `Donne un autre exemple concret et résolu, différent de celui du cours, sur la notion "${course.lesson}" pour un élève de ${classLabel}.`
        : `Un élève de ${classLabel} pose cette question pendant le cours sur "${course.lesson}" : "${text}". Réponds simplement et progressivement, sans donner toute la solution d'un coup, puis pose une courte question de contrôle.`;
    const { answer, live, sources } = await queryTeacherModel(instruction, stepBody(step));
    const fallback =
      REFORMULATIONS[course.key] ||
      "Bonne question ! Reformulons : concentre-toi sur l'idée principale de cette étape et relie-la à l'objectif du cours.";
    const reply = answer || fallback;
    setHandReply(reply);
    setHandLive(live && Boolean(answer));
    setHandSources(answer ? sources : []);
    setHandLoading(false);
    setRobot("parole");
    speak(reply);
  }

  async function runExtra(kind: "simple" | "example") {
    setShowExtra(kind);
    setExtraText(null);
    setExtraLive(false);
    setExtraSources([]);
    setExtraLoading(true);
    const instruction =
      kind === "simple"
        ? `Reformule et simplifie l'explication de cette étape pour un élève de ${classLabel}, avec un exemple concret court et une question de contrôle.`
        : `Donne un autre exemple concret et résolu, différent de celui déjà donné, sur la même notion pour un élève de ${classLabel}.`;
    const { answer, live, sources } = await queryTeacherModel(instruction, stepBody(step));
    setExtraText(answer || null);
    setExtraLive(live && Boolean(answer));
    setExtraSources(answer ? sources : []);
    setExtraLoading(false);
  }

  function answer(i: number) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    const correct = i === (step.kind === "question" ? step.answer : 0);
    setRobot(correct ? "felicitation" : "correction");
    if (correct) speak("Bravo, c'est exact !");

    // Persistance réelle : chaque question répondue devient une vraie tentative en base,
    // pas seulement un état visuel local — c'est ça qui fait "bouger" le tableau de bord.
    const timeSpentSec = Math.max(1, Math.round((Date.now() - stepStartRef.current) / 1000));
    const statement = step.kind === "question" ? step.q : stepBody(step);
    recordAttempt({
      scope: "lesson_question", subject: course.subject, statement,
      attempt: step.kind === "question" ? step.choices[i] : undefined,
      hintsUsed: 0, correct, timeSpentSec,
    });
    logActivity({ activityType: "exercise_answered", subject: course.subject, mastery: correct ? 1 : 0, meta: { course: course.key, correct } });

    setAnsweredQuestions((n) => n + 1);
    setCorrectAnswers((n) => {
      const total = answeredQuestions + 1;
      const correctTotal = n + (correct ? 1 : 0);
      // Progression vivante pendant la leçon, plafonnée sous le seuil "terminé" (0.8)
      // tant qu'on n'a pas atteint la toute dernière étape.
      recordProgress(course.key, Math.min(0.75, correctTotal / total), Math.round((correctTotal / total) * 100));
      return correctTotal;
    });
  }

  function finishOrNext() {
    if (idx < steps.length - 1) {
      go(idx + 1);
    } else {
      // Dernière étape : la maîtrise reflète les vraies réponses données pendant la leçon
      // (et non plus une estimation fixe), avec un plancher raisonnable si aucune question.
      const mastery = answeredQuestions > 0 ? correctAnswers / answeredQuestions : answered ? 0.85 : 0.7;
      setRobot("felicitation");
      recordProgress(course.key, mastery, Math.round(mastery * 100));
      logActivity({ activityType: "course_completed", subject: course.subject, mastery, meta: { course: course.key } });
    }
  }

  const progress = ((idx + 1) / steps.length) * 100;
  const isLast = idx === steps.length - 1;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-night-800/70">
        <Link href="/app/cours" className="hover:text-sky-edu">Mes cours</Link>
        <span>/</span>
        <span className="text-night-900">{course.subject}</span>
        <span>/</span>
        <span className="font-medium text-night-900">{course.title}</span>
      </div>

      {/* Progress */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-semibold text-night-900">Étape {idx + 1} / {steps.length}</span>
          <Badge color="amber">{course.source}</Badge>
        </div>
        <ProgressBar value={progress / 100} color="turq" />
      </div>

      {/* Classroom */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Robot + controls */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl bg-gradient-to-b from-night-950 to-night-800 p-6 text-center text-white">
            <div className="mb-1 flex items-center justify-center gap-2 text-xs text-slate-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-leaf-light" />
              Professeur virtuel — {stateLabel(robot)}
            </div>
            <div className="flex justify-center">
              <div className={robot === "salutation" || robot === "felicitation" ? "animate-bob" : ""}>
                <RobotTeacher state={robot} size={190} />
              </div>
            </div>

            {/* voice controls */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => { setVoiceOn((v) => !v); }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  voiceOn ? "bg-turq text-white" : "bg-white/10 text-slate-200 hover:bg-white/20"
                }`}
              >
                {voiceOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                Voix {voiceOn ? "ON" : "OFF"}
              </button>
              <button
                onClick={togglePause}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/20"
              >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {paused ? "Reprendre" : "Pause"}
              </button>
              <button
                onClick={() => setAutoAdvanceEnabled((v) => !v)}
                title="Le professeur passe seul à l'étape suivante une fois son explication terminée, sauf si tu l'interromps."
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  autoAdvanceEnabled ? "bg-turq text-white" : "bg-white/10 text-slate-200 hover:bg-white/20"
                }`}
              >
                <SkipForward className="h-4 w-4" />
                Suite auto {autoAdvanceEnabled ? "ON" : "OFF"}
              </button>
            </div>
            {voiceOn && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-300">
                <Gauge className="h-4 w-4" /> Vitesse
                <input type="range" min={0.6} max={1.6} step={0.1} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-28" />
                <span className="w-7">{rate.toFixed(1)}x</span>
              </div>
            )}

            {/* Hand raise */}
            <button
              onClick={raiseHand}
              disabled={hand}
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                hand
                  ? "bg-amber-edu text-white"
                  : "bg-amber-edu/90 text-white hover:bg-amber-edu"
              }`}
            >
              <Hand className={`h-5 w-5 ${hand ? "animate-wave" : ""}`} />
              {hand ? "Main levée ✓" : "Lever la main"}
            </button>
            <p className="mt-1.5 text-[11px] text-slate-400">Interromps le prof pour poser une question (comme sur Meet).</p>
          </div>
        </div>

        {/* Board */}
        <div className="lg:col-span-3">
          <div className="rounded-3xl border border-night-900/10 bg-white p-6 shadow-lg">
            {/* Objective */}
            {idx === 0 && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-sky-edu/5 p-3 text-sm text-night-800">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sky-edu" />
                <span><strong>Objectif :</strong> {content.objective}</span>
              </div>
            )}

            <BoardContent step={step} />

            {/* Question handling */}
            {step.kind === "question" && (
              <div className="mt-5 space-y-3">
                <p className="font-semibold text-night-900">Question de contrôle :</p>
                <div className="grid gap-2">
                  {step.choices.map((choice, i) => {
                    const isCorrect = i === step.answer;
                    const show = answered;
                    return (
                      <button
                        key={i}
                        onClick={() => answer(i)}
                        disabled={answered}
                        className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm transition ${
                          show && isCorrect
                            ? "border-leaf bg-leaf/5 text-night-900"
                            : show && selected === i
                              ? "border-red-400 bg-red-50 text-night-900"
                              : "border-night-900/15 hover:border-sky-edu"
                        }`}
                      >
                        <span>{choice}</span>
                        {show && isCorrect && <CheckCircle2 className="h-5 w-5 text-leaf" />}
                        {show && selected === i && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
                      </button>
                    );
                  })}
                </div>
                {answered && selected !== step.answer && (
                  <div className="rounded-xl bg-amber-edu/10 p-3 text-sm text-night-800">
                    Pas tout à fait. {REFORMULATIONS[course.key] || "Revois l'idée clé de cette étape, puis réessaie."}
                  </div>
                )}
              </div>
            )}

            {/* Reformulation / extra */}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => runExtra("simple")}
                disabled={extraLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-edu/10 px-3 py-2 text-xs font-semibold text-violet-edu hover:bg-violet-edu/20 disabled:opacity-60"
              >
                {extraLoading && showExtra === "simple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />} Explique plus simplement
              </button>
              <button
                onClick={() => runExtra("example")}
                disabled={extraLoading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-edu/10 px-3 py-2 text-xs font-semibold text-sky-edu hover:bg-sky-edu/20 disabled:opacity-60"
              >
                {extraLoading && showExtra === "example" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Un autre exemple
              </button>
              {course.experimentKey && (
                <Link
                  href={`/app/labo/${course.experimentKey}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-edu/10 px-3 py-2 text-xs font-semibold text-amber-edu hover:bg-amber-edu/20"
                >
                  <FlaskConical className="h-4 w-4" /> Ouvrir la simulation
                </Link>
              )}
            </div>

            {showExtra === "simple" && (
              <div className="mt-3 animate-float-up rounded-xl border border-violet-edu/20 bg-violet-edu/5 p-4 text-sm text-night-800">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-violet-edu">💡 Reformulation</p>
                  <ModelBadge loading={extraLoading} live={extraLive} />
                </div>
                <p className="mt-1 whitespace-pre-wrap">{extraLoading ? "Génération en cours…" : extraText || REFORMULATIONS[course.key] || "Concentre-toi sur l'idée principale et relie-la à l'objectif du cours."}</p>
                {!extraLoading && extraSources.length > 0 && (
                  <p className="mt-2 text-[11px] text-night-800/50">
                    Source : {extraSources.map(sourceLabel).join(" · ")}
                  </p>
                )}
              </div>
            )}
            {showExtra === "example" && (
              <div className="mt-3 animate-float-up rounded-xl border border-sky-edu/20 bg-sky-edu/5 p-4 text-sm text-night-800">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sky-edu">➕ Autre exemple</p>
                  <ModelBadge loading={extraLoading} live={extraLive} />
                </div>
                <p className="mt-1 whitespace-pre-wrap">{extraLoading ? "Génération en cours…" : extraText || extraExample(course.key)}</p>
                {!extraLoading && extraSources.length > 0 && (
                  <p className="mt-2 text-[11px] text-night-800/50">
                    Source : {extraSources.map(sourceLabel).join(" · ")}
                  </p>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between border-t border-night-900/10 pt-4">
              <Button variant="ghost" size="sm" onClick={() => go(idx - 1)} disabled={idx === 0}>
                <SkipBack className="h-4 w-4" /> Précédent
              </Button>
              <div className="flex gap-1.5">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => go(i)}
                    className={`h-2 rounded-full transition-all ${i === idx ? "w-6 bg-turq" : "w-2 bg-night-900/15"}`}
                  />
                ))}
              </div>
              <Button variant="primary" size="sm" onClick={finishOrNext}>
                {isLast ? "Terminer" : "Suivant"} <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Key formulas + sources */}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-night-900/10 bg-white p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-night-900"><BookOpen className="h-4 w-4 text-turq" /> Formules clés</p>
              <ul className="mt-2 space-y-1">
                {content.keyFormulas.map((f) => (
                  <li key={f} className="formula rounded-lg bg-night-950/5 px-3 py-1.5 text-sm text-night-900">{f}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-night-900/10 bg-white p-4">
              <p className="text-sm font-bold text-night-900">Sources & provenance</p>
              <ul className="mt-2 space-y-1 text-xs text-night-800/70">
                <li>• {course.source}</li>
                {content.sources.map((s) => (<li key={s}>• {s}</li>))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Hand-raise modal */}
      {hand && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-night-950/60 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg animate-float-up rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-bold text-night-900">
                <Hand className="h-5 w-5 text-amber-edu" /> Tu as levé la main
              </h3>
              <button
                onClick={() => { setHand(false); setHandReply(null); setHandSources([]); setRobot(STATE_BY_KIND[step.kind]); speak(stepBody(step)); }}
                className="grid h-8 w-8 place-items-center rounded-lg text-night-800/60 hover:bg-night-900/5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-night-800/70">
              Le professeur est en écoute. Pose ta question par écrit, ou choisis une action rapide.
            </p>

            {handLoading ? (
              <div className="mt-6 flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-night-900/5 p-8 text-center">
                <span className="flex items-center gap-2 text-sm font-medium text-night-800/70">
                  <Loader2 className="h-4 w-4 animate-spin" /> Le professeur réfléchit…
                </span>
                <span className="text-xs text-night-800/45">Génération locale sur CPU — jusqu&apos;à 2-3 minutes.</span>
              </div>
            ) : !handReply ? (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => submitHand("simple")} className="inline-flex items-center gap-1.5 rounded-lg bg-violet-edu/10 px-3 py-2 text-xs font-semibold text-violet-edu hover:bg-violet-edu/20">
                    <Lightbulb className="h-4 w-4" /> Explique plus simplement
                  </button>
                  <button onClick={() => submitHand("example")} className="inline-flex items-center gap-1.5 rounded-lg bg-sky-edu/10 px-3 py-2 text-xs font-semibold text-sky-edu hover:bg-sky-edu/20">
                    <Plus className="h-4 w-4" /> Un autre exemple
                  </button>
                </div>
                <form
                  onSubmit={(e) => { e.preventDefault(); if (handQuestion.trim()) submitHand(handQuestion); }}
                  className="mt-4 flex gap-2"
                >
                  <input
                    value={handQuestion}
                    onChange={(e) => setHandQuestion(e.target.value)}
                    placeholder="Écris ta question…"
                    className="flex-1 rounded-xl border border-night-900/15 px-4 py-2.5 text-sm outline-none focus:border-sky-edu"
                  />
                  <Button type="submit" size="sm"><Send className="h-4 w-4" /></Button>
                </form>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={recording ? stopRecording : startRecording}
                    disabled={sttLoading}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
                      recording
                        ? "animate-pulse bg-red-500 text-white"
                        : "bg-night-900/5 text-night-800/70 hover:bg-night-900/10"
                    }`}
                  >
                    {sttLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
                    {recording ? "Arrêter et envoyer" : sttLoading ? "Transcription…" : "Parler au professeur"}
                  </button>
                  {micError && <span className="text-[11px] text-red-500">{micError}</span>}
                </div>
              </>
            ) : (
              <div className="mt-4 animate-float-up rounded-2xl bg-sky-edu/5 p-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-bold text-sky-edu">
                    <Sparkles className="h-4 w-4" /> Le professeur répond
                  </p>
                  <ModelBadge loading={false} live={handLive} />
                </div>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-night-800">{handReply}</p>
                {handSources.length > 0 && (
                  <p className="mt-2 text-[11px] text-night-800/50">
                    Source : {handSources.map(sourceLabel).join(" · ")}
                  </p>
                )}
                <button
                  onClick={() => { setHand(false); setHandReply(null); setHandSources([]); setRobot(STATE_BY_KIND[step.kind]); }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-turq px-4 py-2 text-sm font-semibold text-white"
                >
                  <CheckCircle2 className="h-4 w-4" /> J&apos;ai compris, on continue
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BoardContent({ step }: { step: CourseStep }) {
  if (step.kind === "formula") {
    return (
      <div className="my-2">
        <div className="rounded-2xl border-4 border-night-900/10 bg-night-950 p-8 text-center">
          <p className="formula text-2xl font-bold text-turq-light sm:text-3xl">{step.body}</p>
        </div>
      </div>
    );
  }
  if (step.kind === "intro") {
    return (
      <div>
        <h2 className="text-2xl font-bold text-night-900">{step.title}</h2>
        <p className="mt-2 leading-relaxed text-night-800">{step.body}</p>
      </div>
    );
  }
  if (step.kind === "question") {
    return (
      <div>
        <Badge color="amber">Contrôle de compréhension</Badge>
        <h2 className="mt-3 text-xl font-bold text-night-900">{step.q}</h2>
      </div>
    );
  }
  return (
    <div>
      <Badge color={step.kind === "encouragement" ? "leaf" : step.kind === "example" ? "sky" : "turq"}>
        {step.kind === "encouragement" ? "Encouragement" : step.kind === "example" ? "Exemple" : "Explication"}
      </Badge>
      <p className="mt-3 leading-relaxed text-night-800">{step.body}</p>
    </div>
  );
}

function ModelBadge({ loading, live }: { loading: boolean; live: boolean }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-night-900/5 px-2 py-0.5 text-[11px] font-medium text-night-800/60">
        <Loader2 className="h-3 w-3 animate-spin" /> génération…
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        live ? "bg-turq/10 text-turq" : "bg-night-900/5 text-night-800/50"
      }`}
    >
      <Cpu className="h-3 w-3" /> {live ? "Modèle EduLab" : "Contenu hors-ligne"}
    </span>
  );
}

function stateLabel(s: RobotState): string {
  const map: Record<RobotState, string> = {
    arrivee: "Arrivée",
    salutation: "Salutation",
    ecoute: "Écoute",
    reflexion: "Réflexion",
    parole: "Parole",
    ecriture: "Écriture au tableau",
    encouragement: "Encouragement",
    correction: "Correction",
    felicitation: "Félicitation",
  };
  return map[s];
}

function extraExample(key: string): string {
  const ex: Record<string, string> = {
    pythagore: "Autre exemple : AB = 8 et AC = 15. BC² = 64 + 225 = 289, donc BC = 17 cm.",
    fonctions: "Autre exemple : g(x) = -2x + 4. En x=0, g=4. En x=2, g=0. La droite descend.",
    ohm: "Autre exemple : R = 20 Ω et I = 0,2 A → U = 20 × 0,2 = 4 V.",
    ph: "Autre exemple : un jus de tomate a un pH ≈ 4 (légèrement acide).",
    respiration: "Autre exemple : pendant un effort, tu respires plus vite pour apporter plus d'O₂ à tes muscles.",
    genetique: "Autre exemple : croisement AA × aa → 100% d'Aa (tous au phénotype dominant).",
  };
  return ex[key] || "Applique la même méthode en changeant les valeurs, étape par étape.";
}
