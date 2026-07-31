"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Clock, CheckCircle2, XCircle, Trophy, RefreshCw,
  FileText, AlertTriangle, Lightbulb, Timer,
} from "lucide-react";
import { EXAMS, type ExamQuestion } from "@/lib/content";
import { SectionTitle, Card, Badge, Button, ProgressBar } from "@/components/ui";
import { recordAttempt, logActivity } from "@/app/actions";

type Mode = "entrainement" | "examen";

export default function ExamRunner({ examKey }: { examKey: string }) {
  const exam = EXAMS.find((e) => e.key === examKey);
  const [mode, setMode] = useState<Mode | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [finished, setFinished] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (mode !== "examen" || finished) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [mode, finished]);

  if (!exam) {
    return (
      <Card className="p-8 text-center">
        <p className="text-night-800">Sujet introuvable.</p>
        <Link href="/app/examens" className="mt-3 inline-block font-semibold text-sky-edu">← Retour</Link>
      </Card>
    );
  }

  const questions = exam.questions as ExamQuestion[];

  function start(m: Mode) {
    setMode(m);
    setAnswers(new Array(questions.length).fill(null));
    setCurrent(0);
    setFinished(false);
    setSeconds(0);
  }

  function answer(i: number) {
    if (mode === "examen" && answers[current] !== null) return;
    const next = [...answers];
    next[current] = i;
    setAnswers(next);
  }

  function next() {
    if (current < questions.length - 1) setCurrent((c) => c + 1);
    else finish();
  }

  function finish() {
    if (!exam) return;
    setFinished(true);
    const correctCount = answers.filter((a, i) => a === questions[i].answer).length;
    questions.forEach((q, i) => {
      recordAttempt({
        scope: "exam",
        subject: exam.subject,
        statement: q.q,
        hintsUsed: 0,
        correct: answers[i] === q.answer,
        timeSpentSec: Math.round(seconds / questions.length),
      });
    });
    logActivity({ activityType: "exam_completed", subject: exam.subject, mastery: correctCount / questions.length, meta: { exam: exam.exam, year: exam.year } });
  }

  // RESULTS
  if (finished) {
    const correctCount = answers.filter((a, i) => a === questions[i].answer).length;
    const score = Math.round((correctCount / questions.length) * 100);
    const wrongNotions = questions
      .filter((q, i) => answers[i] !== q.answer)
      .map((q) => q.notion);
    const freqNotions = Array.from(new Set(questions.map((q) => q.notion)));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <SectionTitle eyebrow="Résultats" title={exam.title} />
          <Button variant="outline" size="sm" onClick={() => start(mode!)}>
            <RefreshCw className="h-4 w-4" /> Recommencer
          </Button>
        </div>

        <Card className="p-6 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-turq text-white">
            <Trophy className="h-8 w-8" />
          </div>
          <p className="mt-3 text-4xl font-bold text-night-900">{score}%</p>
          <p className="text-night-800/70">{correctCount} / {questions.length} bonnes réponses {mode === "examen" && `en ${Math.floor(seconds / 60)}'${String(seconds % 60).padStart(2, "0")}"`}</p>
          <ProgressBar value={score / 100} color={score >= 50 ? "leaf" : "amber"} className="mx-auto mt-4 max-w-xs" />
        </Card>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Error analysis */}
          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-bold text-night-900"><AlertTriangle className="h-5 w-5 text-amber-edu" /> Analyse des erreurs</h3>
            {wrongNotions.length === 0 ? (
              <p className="mt-2 text-sm text-leaf">Aucune erreur. Excellent travail ! 🎉</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {questions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    {answers[i] === q.answer ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    )}
                    <div>
                      <p className="text-night-800">{q.q}</p>
                      {answers[i] !== q.answer && (
                        <p className="text-xs text-night-800/60">Notion : {q.notion} — bonne réponse : {q.choices[q.answer]}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Revision sheet */}
          <Card className="p-5">
            <h3 className="flex items-center gap-2 font-bold text-night-900"><FileText className="h-5 w-5 text-violet-edu" /> Fiche de révision générée</h3>
            <p className="mt-2 text-sm text-night-800/70">Priorités de révision, adaptées à tes erreurs :</p>
            <ul className="mt-3 space-y-2">
              {(wrongNotions.length ? wrongNotions : freqNotions).map((n, i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg bg-violet-edu/5 px-3 py-2 text-sm text-night-800">
                  <Lightbulb className="h-4 w-4 text-violet-edu" /> {n}
                </li>
              ))}
            </ul>
            <Link href="/app/cours" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-sky-edu">
              Réviser ces notions <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // MODE SELECT
  if (!mode) {
    return (
      <div className="space-y-6">
        <Link href="/app/examens" className="inline-flex items-center gap-1.5 text-sm font-semibold text-night-800/70 hover:text-sky-edu">
          <ArrowLeft className="h-4 w-4" /> Examens
        </Link>
        <SectionTitle eyebrow={`${exam.exam} • ${exam.year}`} title={exam.title} subtitle={`${exam.subject} • ${questions.length} questions • ${exam.source}`} />
        <div className="grid gap-4 sm:grid-cols-2">
          <button onClick={() => start("entrainement")} className="rounded-2xl border-2 border-night-900/10 bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-turq">
            <Lightbulb className="h-8 w-8 text-turq" />
            <h3 className="mt-3 text-lg font-bold text-night-900">Mode entraînement</h3>
            <p className="mt-1 text-sm text-night-800/70">Réponse immédiate et correction expliquée à chaque question.</p>
          </button>
          <button onClick={() => start("examen")} className="rounded-2xl border-2 border-night-900/10 bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-amber-edu">
            <Timer className="h-8 w-8 text-amber-edu" />
            <h3 className="mt-3 text-lg font-bold text-night-900">Mode examen chronométré</h3>
            <p className="mt-1 text-sm text-night-800/70">Chronométrage continu, réponses masquées pendant l’épreuve et bilan à la fin.</p>
          </button>
        </div>
      </div>
    );
  }

  // QUIZ
  const q = questions[current];
  const selected = answers[current];
  const showFeedback = mode === "entrainement" && selected !== null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Badge color="violet">{mode === "examen" ? "Examen chronométré" : "Entraînement"}</Badge>
        {mode === "examen" && (
          <Badge color="amber"><Clock className="mr-1 h-3 w-3" />{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</Badge>
        )}
      </div>

      <ProgressBar value={(current + 1) / questions.length} color="violet" />

      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-edu">Question {current + 1} / {questions.length} • {q.chapter}</p>
        <h2 className="mt-2 text-xl font-bold text-night-900">{q.q}</h2>
        <div className="mt-5 space-y-2.5">
          {q.choices.map((choice, i) => {
            const isCorrect = i === q.answer;
            return (
              <button
                key={i}
                onClick={() => answer(i)}
                disabled={showFeedback}
                className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left text-sm transition ${
                  showFeedback && isCorrect ? "border-leaf bg-leaf/5" : showFeedback && selected === i ? "border-red-400 bg-red-50" : selected === i ? "border-sky-edu bg-sky-edu/5" : "border-night-900/15 hover:border-sky-edu"
                }`}
              >
                {choice}
                {showFeedback && isCorrect && <CheckCircle2 className="h-5 w-5 text-leaf" />}
                {showFeedback && selected === i && !isCorrect && <XCircle className="h-5 w-5 text-red-500" />}
              </button>
            );
          })}
        </div>

        {showFeedback && (
          <div className={`mt-4 rounded-xl p-4 text-sm ${selected === q.answer ? "bg-leaf/10 text-night-800" : "bg-amber-edu/10 text-night-800"}`}>
            {selected === q.answer ? "✓ Correct ! " : "✗ Pas tout à fait. "}
            Notion : <strong>{q.notion}</strong>.
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>Précédent</Button>
          <Button variant="primary" size="sm" onClick={next} disabled={selected === null && mode === "entrainement"}>
            {current < questions.length - 1 ? "Suivant" : "Terminer"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
