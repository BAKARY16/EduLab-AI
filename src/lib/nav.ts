import type { ComponentType } from "react";
import { Presentation, User, ShieldCheck, Users, Bot } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export const TEACHER_NAV: NavItem[] = [
  { href: "/app/professeur", label: "Espace enseignant", icon: Presentation },
  { href: "/app/ia", label: "Professeur IA", icon: Bot },
  { href: "/app/professeur/apprenants", label: "Mes apprenants", icon: Users },
  { href: "/app/profil", label: "Profil", icon: User },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/app/admin", label: "Administration", icon: ShieldCheck },
  { href: "/app/admin/utilisateurs", label: "Utilisateurs & journaux", icon: Users },
  { href: "/app/profil", label: "Profil", icon: User },
];
