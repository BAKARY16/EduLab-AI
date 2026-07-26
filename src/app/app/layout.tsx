import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { ensureSeed } from "@/app/actions";
import { AppShell, STUDENT_NAV } from "@/components/AppShell";
import { TEACHER_NAV } from "@/lib/nav";
import { ADMIN_NAV } from "@/lib/nav";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  // Students must complete onboarding before entering the app
  if (user.role === "student" && user.profile && !user.profile.onboardingCompleted) {
    redirect("/onboarding");
  }

  // Keep catalog data available (idempotent)
  await ensureSeed();

  let nav = STUDENT_NAV;
  if (user.role === "teacher") nav = TEACHER_NAV;
  if (user.role === "admin") nav = ADMIN_NAV;

  return (
    <AppShell
      user={{ name: user.name, email: user.email, role: user.role }}
      nav={nav}
    >
      {children}
    </AppShell>
  );
}
