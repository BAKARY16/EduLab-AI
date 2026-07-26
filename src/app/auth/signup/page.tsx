import Link from "next/link";
import { Atom, ArrowRight, GraduationCap, Presentation } from "lucide-react";
import { signupAction } from "@/app/actions";
import { ActionForm } from "@/components/ActionForm";

export default function SignupPage() {
  return (
    <div className="animate-float-up">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 lg:hidden">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-turq text-white">
          <Atom className="h-4 w-4" />
        </span>
        <span className="font-bold text-night-900">EduLab<span className="text-turq"> AI</span></span>
      </Link>

      <h1 className="text-2xl font-bold text-night-900">Créer mon compte</h1>
      <p className="mt-1.5 text-night-800/70">Quelques informations essentielles suffisent.</p>

      <ActionForm
        action={signupAction}
        initialState={{}}
        submitLabel="Créer mon compte"
        submitIcon={<ArrowRight className="h-4 w-4" />}
        className="mt-7 space-y-4"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-night-900">Nom complet</label>
          <input
            name="name"
            required
            placeholder="ex: Aya Konan"
            className="w-full rounded-xl border border-night-900/15 bg-white px-4 py-3 text-night-900 outline-none transition focus:border-sky-edu focus:ring-2 focus:ring-sky-edu/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-night-900">Adresse e-mail</label>
          <input
            name="email"
            type="email"
            required
            placeholder="ex: konan@edulab.ci"
            className="w-full rounded-xl border border-night-900/15 bg-white px-4 py-3 text-night-900 outline-none transition focus:border-sky-edu focus:ring-2 focus:ring-sky-edu/20"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-night-900">Mot de passe</label>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).{8,}"
            title="8 caractères minimum, avec une majuscule, une minuscule et un chiffre"
            autoComplete="new-password"
            placeholder="8 caractères, majuscule et chiffre"
            className="w-full rounded-xl border border-night-900/15 bg-white px-4 py-3 text-night-900 outline-none transition focus:border-sky-edu focus:ring-2 focus:ring-sky-edu/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-night-900">Je suis…</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="cursor-pointer">
              <input type="radio" name="role" value="student" defaultChecked className="peer sr-only" />
              <div className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-night-900/15 bg-white p-4 text-center transition peer-checked:border-sky-edu peer-checked:bg-sky-edu/5">
                <GraduationCap className="h-6 w-6 text-sky-edu" />
                <span className="text-sm font-semibold text-night-900">Élève</span>
              </div>
            </label>
            <label className="cursor-pointer">
              <input type="radio" name="role" value="teacher" className="peer sr-only" />
              <div className="flex flex-col items-center gap-1.5 rounded-xl border-2 border-night-900/15 bg-white p-4 text-center transition peer-checked:border-violet-edu peer-checked:bg-violet-edu/5">
                <Presentation className="h-6 w-6 text-violet-edu" />
                <span className="text-sm font-semibold text-night-900">Enseignant</span>
              </div>
            </label>
          </div>
        </div>
      </ActionForm>

      <p className="mt-6 text-center text-xs text-night-800/60">
        En créant un compte, tu acceptes que tes données d'apprentissage soient
        enregistrées de manière anonymisée pour améliorer la plateforme.
      </p>

      <p className="mt-4 text-center text-sm text-night-800/70">
        Déjà inscrit ?{" "}
        <Link href="/auth/login" className="font-semibold text-sky-edu hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
