import Link from "next/link";
import { Atom, ArrowRight } from "lucide-react";
import { loginAction } from "@/app/actions";
import { ActionForm } from "@/components/ActionForm";

export default function LoginPage() {
  return (
    <div className="animate-float-up">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 lg:hidden">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-turq text-white">
          <Atom className="h-4 w-4" />
        </span>
        <span className="font-bold text-night-900">EduLab<span className="text-turq"> AI</span></span>
      </Link>

      <h1 className="text-2xl font-bold text-night-900">Bon retour 👋</h1>
      <p className="mt-1.5 text-night-800/70">Connecte-toi pour reprendre ton parcours.</p>

      <ActionForm
        action={loginAction}
        initialState={{}}
        submitLabel="Se connecter"
        submitIcon={<ArrowRight className="h-4 w-4" />}
        className="mt-7 space-y-4"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-night-900">Adresse e-mail</label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
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
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-night-900/15 bg-white px-4 py-3 text-night-900 outline-none transition focus:border-sky-edu focus:ring-2 focus:ring-sky-edu/20"
          />
        </div>
      </ActionForm>

      <div className="mt-6 rounded-xl border border-turq/20 bg-turq/5 p-3.5 text-sm text-night-800">
        <p className="font-semibold text-turq">Astuce démo</p>
        <p className="mt-0.5 text-night-800/80">
          Pas encore de compte ? Crées-en un gratuitement, c'est immédiat.
        </p>
      </div>

      <p className="mt-6 text-center text-sm text-night-800/70">
        Nouveau ici ?{" "}
        <Link href="/auth/signup" className="font-semibold text-sky-edu hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
