"use client";

import { useState } from "react";
import { onboardingAction } from "@/app/actions";
import { ArrowRight, ArrowLeft, Check, Rocket } from "lucide-react";

const SUBJECTS = ["Mathématiques", "Physique-Chimie", "SVT"];
const LANGS = ["Français", "Dioula", "Baoulé", "Nouchi", "Anglais"];
const STYLES = [
  { id: "visuel", label: "Visuel", icon: "👁️", desc: "Schémas, couleurs, tableaux" },
  { id: "auditif", label: "Auditif", icon: "🔊", desc: "J'écoute, je répète à voix haute" },
  { id: "kinesthesique", label: "Kinesthésique", icon: "✋", desc: "Je manipule, je pratique" },
];

export default function OnboardingWizard({ userName }: { userName: string }) {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState("");
  const [grade, setGrade] = useState("");
  const total = 4;

  const collegeGrades = ["6e", "5e", "4e", "3e"];
  const lyceeGrades = ["2nde", "1ère", "Terminale A", "Terminale C", "Terminale D", "Terminale F"];
  const grades = level === "Collège" ? collegeGrades : lyceeGrades;

  const next = () => setStep((s) => Math.min(total, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="min-h-screen bg-gradient-to-b from-night-950 via-night-900 to-night-800 px-5 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Progress */}
        <div className="mb-8 flex items-center gap-3">
          {Array.from({ length: total + 1 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all ${
                i <= step ? "bg-turq" : "bg-white/15"
              }`}
            />
          ))}
        </div>

        <form action={onboardingAction} className="rounded-3xl border border-white/10 bg-white p-7 shadow-2xl sm:p-9">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-turq">
            Personnalisation • Étape {step + 1}/{total + 1}
          </p>

          {/* STEP 0 — niveau */}
          <div className={step === 0 ? "block" : "hidden"}>
            <h1 className="mt-2 text-2xl font-bold text-night-900">
              Bonjour {userName.split(" ")[0]} 👋
            </h1>
            <p className="mt-2 text-night-800/70">
              Personnalisons ton expérience. Tu pourras tout modifier plus tard. Commençons par ton niveau.
            </p>
            <input type="hidden" name="level" value={level} />
            <div className="mt-6 grid grid-cols-2 gap-4">
              {["Collège", "Lycée"].map((lv) => (
                <button
                  type="button"
                  key={lv}
                  onClick={() => setLevel(lv)}
                  className={`rounded-2xl border-2 p-6 text-left transition ${
                    level === lv
                      ? "border-sky-edu bg-sky-edu/5"
                      : "border-night-900/15 hover:border-sky-edu/40"
                  }`}
                >
                  <span className="text-3xl">{lv === "Collège" ? "🏫" : "🎓"}</span>
                  <p className="mt-2 text-lg font-bold text-night-900">{lv}</p>
                  <p className="text-sm text-night-800/60">
                    {lv === "Collège" ? "6e à 3e — BEPC" : "2nde à Terminale — BAC"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 1 — classe */}
          <div className={step === 1 ? "block" : "hidden"}>
            <h2 className="mt-2 text-2xl font-bold text-night-900">Quelle est ta classe ?</h2>
            <p className="mt-2 text-night-800/70">
              Niveau sélectionné : <strong>{level || "—"}</strong>
            </p>
            <input type="hidden" name="grade" value={grade} />
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {grades.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGrade(g)}
                  className={`rounded-xl border-2 px-4 py-3 font-semibold transition ${
                    grade === g
                      ? "border-turq bg-turq/5 text-turq"
                      : "border-night-900/15 text-night-900 hover:border-turq/40"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-amber-edu/10 p-4">
              <input id="examClass" type="checkbox" name="examClass" className="h-5 w-5 accent-amber-edu" />
              <label htmlFor="examClass" className="text-sm font-medium text-night-900">
                Je suis en classe d'examen ({level === "Lycée" ? "BAC" : "BEPC"}) — je veux une préparation dédiée.
              </label>
              <input type="hidden" name="cycle" value={level === "Lycée" ? "BAC" : "BEPC"} />
            </div>
          </div>

          {/* STEP 2 — matières difficiles + objectifs */}
          <div className={step === 2 ? "block" : "hidden"}>
            <h2 className="mt-2 text-2xl font-bold text-night-900">Tes difficultés & objectifs</h2>
            <p className="mt-2 text-night-800/70">
              Sélectionne les matières qui te posent problème et tes objectifs.
            </p>
            <p className="mt-5 text-sm font-semibold text-night-900">Matières difficiles</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <label key={s} className="cursor-pointer">
                  <input type="checkbox" name="difficultSubjects" value={s} className="peer sr-only" />
                  <span className="inline-block rounded-full border-2 border-night-900/15 px-4 py-2 text-sm font-medium text-night-800 transition peer-checked:border-amber-edu peer-checked:bg-amber-edu peer-checked:text-white">
                    {s}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-6 text-sm font-semibold text-night-900">Tes objectifs</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {["Réussir mon examen", "Améliorer mes notes", "Comprendre les bases", "Aller plus vite", "Réviser efficacement"].map((g) => (
                <label key={g} className="cursor-pointer">
                  <input type="checkbox" name="goals" value={g} className="peer sr-only" />
                  <span className="inline-block rounded-full border-2 border-night-900/15 px-4 py-2 text-sm font-medium text-night-800 transition peer-checked:border-leaf peer-checked:bg-leaf peer-checked:text-white">
                    {g}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* STEP 3 — langue + style */}
          <div className={step === 3 ? "block" : "hidden"}>
            <h2 className="mt-2 text-2xl font-bold text-night-900">Langue & style d'apprentissage</h2>
            <p className="mt-2 text-night-800/70">Pour adapter les explications et le professeur virtuel.</p>

            <p className="mt-5 text-sm font-semibold text-night-900">Langue préférée</p>
            <div className="relative mt-2">
              <select
                name="preferredLanguage"
                defaultValue="Français"
                className="w-full appearance-none rounded-xl border border-night-900/15 bg-white px-4 py-3 text-night-900 outline-none focus:border-sky-edu"
              >
                {LANGS.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>

            <p className="mt-6 text-sm font-semibold text-night-900">Style d'apprentissage</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {STYLES.map((s) => (
                <label key={s.id} className="cursor-pointer">
                  <input type="radio" name="learningStyle" value={s.id} defaultChecked={s.id === "visuel"} className="peer sr-only" />
                  <div className="rounded-2xl border-2 border-night-900/15 p-4 text-center transition peer-checked:border-violet-edu peer-checked:bg-violet-edu/5">
                    <span className="text-2xl">{s.icon}</span>
                    <p className="mt-1.5 text-sm font-semibold text-night-900">{s.label}</p>
                    <p className="text-xs text-night-800/60">{s.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* STEP 4 — confirmation */}
          <div className={step === 4 ? "block" : "hidden"}>
            <div className="flex flex-col items-center py-6 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-leaf/10 text-leaf">
                <Rocket className="h-8 w-8" />
              </div>
              <h2 className="mt-4 text-2xl font-bold text-night-900">Tout est prêt !</h2>
              <p className="mt-2 max-w-md text-night-800/70">
                Ton expérience est maintenant personnalisée. Le professeur virtuel t'attend dans ta salle de classe.
              </p>
              <ul className="mt-5 space-y-1.5 text-sm text-night-800">
                <li>✓ Niveau : {level || "—"} — {grade || "—"}</li>
                <li>✓ Préparation examen activée si coché</li>
                <li>✓ Recommandations adaptées à ton style</li>
              </ul>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={back}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-night-800 hover:bg-night-900/5"
              >
                <ArrowLeft className="h-4 w-4" /> Retour
              </button>
            ) : (
              <span />
            )}

            {step < total ? (
              <button
                type="button"
                onClick={next}
                disabled={step === 0 && !level}
                className="inline-flex items-center gap-2 rounded-xl bg-turq px-6 py-3 font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
              >
                Continuer <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-leaf to-turq px-6 py-3 font-semibold text-white shadow-lg transition hover:opacity-90"
              >
                <Check className="h-4 w-4" /> Entrer dans ma classe
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
