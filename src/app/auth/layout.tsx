import type { ReactNode } from "react";
import Link from "next/link";
import { Atom } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-night-950 via-night-900 to-night-800 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -left-10 top-20 h-72 w-72 rounded-full bg-turq/20 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-72 w-72 rounded-full bg-violet-edu/20 blur-3xl" />
        </div>
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-turq">
            <Atom className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold">EduLab<span className="text-turq"> AI</span></span>
        </Link>
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">
            Ta salle de classe <span className="text-gradient">numérique</span> ivoirienne.
          </h2>
          <p className="mt-4 max-w-md text-slate-300">
            Cours interactifs, professeur virtuel, laboratoire scientifique réaliste
            et préparation au BEPC/BAC — entièrement personnalisée.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-slate-200">
            <li>✓ Suivi personnalisé par IA</li>
            <li>✓ Contenus sourcés (DPFC, Mon École à la Maison)</li>
            <li>✓ Accessible sur mobile, tablette et ordinateur</li>
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">
          Cours sourcés · professeur IA · laboratoire interactif
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-[var(--bg)] px-5 py-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
