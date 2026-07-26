"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  users,
  profiles,
  courses,
  experiments,
  examPapers,
  progress,
  exerciseAttempts,
  activities,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  hashPassword,
  verifyPassword,
  setSession,
  clearSession,
  getCurrentUser,
} from "@/lib/auth";
import { COURSES, EXPERIMENTS, EXAMS } from "@/lib/content";
import { createHash } from "crypto";
import type { ActionState } from "@/components/ActionForm";
import { getSupabaseAdmin, getSupabaseAuth, isSupabaseAuthEnabled } from "@/lib/supabase";

/* ---------- AUTH ---------- */

export async function signupAction(
  prev: ActionState,
  formData: FormData,
) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const role = (String(formData.get("role") || "student") as
    | "student"
    | "teacher") || "student";

  if (!name || !email || !password) {
    return { error: "Tous les champs sont obligatoires." };
  }
  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return { error: "Utilise au moins une minuscule, une majuscule et un chiffre." };
  }

  if (isSupabaseAuthEnabled()) {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });
    if (error) return { error: authErrorMessage(error.message) };
    if (!data.user) return { error: "Inscription impossible pour le moment." };

    try {
      await ensureAppUser({ id: data.user.id, email, name, role });
    } catch (dbError) {
      await supabase.auth.admin.deleteUser(data.user.id).catch(() => undefined);
      console.error("Échec de création du profil EduLab", dbError);
      return { error: "Le compte n'a pas pu être finalisé. Réessaie dans quelques instants." };
    }
    await setSession(data.user.id, role);
    redirect(role === "teacher" ? "/app/professeur" : "/onboarding");
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    return { error: "Un compte existe déjà avec cet e-mail." };
  }

  const [u] = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: hashPassword(password),
      role,
    })
    .returning();

  await db.insert(profiles).values({ userId: u.id, onboardingCompleted: false });
  await setSession(u.id, u.role);

  redirect(role === "teacher" ? "/app/professeur" : "/onboarding");
}

export async function loginAction(
  prev: ActionState,
  formData: FormData,
) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (isSupabaseAuthEnabled()) {
    const supabase = getSupabaseAuth();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { error: "E-mail ou mot de passe incorrect." };

    const metadataRole = data.user.user_metadata?.role;
    const safeRole = metadataRole === "teacher" ? "teacher" : "student";
    const localUser = await ensureAppUser({
      id: data.user.id,
      email: data.user.email || email,
      name: String(data.user.user_metadata?.name || email.split("@")[0]),
      role: safeRole,
    });
    await setSession(localUser.id, localUser.role);
    if (localUser.role === "teacher") redirect("/app/professeur");
    if (localUser.role === "admin") redirect("/app/admin");
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, localUser.id)).limit(1);
    redirect(profile?.onboardingCompleted ? "/app" : "/onboarding");
  }

  const [u] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!u || !verifyPassword(password, u.passwordHash)) {
    return { error: "E-mail ou mot de passe incorrect." };
  }

  await setSession(u.id, u.role);

  if (u.role === "teacher") redirect("/app/professeur");
  if (u.role === "admin") redirect("/app/admin");

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, u.id))
    .limit(1);
  if (!profile?.onboardingCompleted) redirect("/onboarding");
  redirect("/app");
}

function authErrorMessage(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("already") || normalized.includes("registered")) {
    return "Un compte existe déjà avec cet e-mail.";
  }
  if (normalized.includes("password")) return "Le mot de passe ne respecte pas les règles de sécurité.";
  if (normalized.includes("email")) return "Cette adresse e-mail n'est pas valide ou ne peut pas être utilisée.";
  return "L'inscription a échoué. Vérifie les informations et réessaie.";
}

async function ensureAppUser(input: {
  id: string;
  email: string;
  name: string;
  role: "student" | "teacher";
}) {
  const [byId] = await db.select().from(users).where(eq(users.id, input.id)).limit(1);
  if (byId) {
    await db.insert(profiles).values({ userId: byId.id, onboardingCompleted: false }).onConflictDoNothing();
    return byId;
  }
  const [byEmail] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
  if (byEmail) throw new Error("Un autre profil EduLab utilise déjà cet e-mail.");

  const [created] = await db.insert(users).values({ ...input, passwordHash: "supabase-managed" }).returning();
  await db.insert(profiles).values({ userId: created.id, onboardingCompleted: false }).onConflictDoNothing();
  return created;
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

/* ---------- ONBOARDING ---------- */

export async function onboardingAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const data = {
    level: String(formData.get("level") || ""),
    grade: String(formData.get("grade") || ""),
    cycle: String(formData.get("cycle") || ""),
    difficultSubjects: String(formData.get("difficultSubjects") || ""),
    goals: String(formData.get("goals") || ""),
    preferredLanguage: String(formData.get("preferredLanguage") || "Français"),
    learningStyle: String(formData.get("learningStyle") || "visuel"),
    examClass: formData.get("examClass") === "on",
    onboardingCompleted: true,
  };

  await db
    .update(profiles)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(profiles.userId, user.id));

  revalidatePath("/app");
  redirect("/app");
}

/* ---------- PROGRESSION & ACTIVITÉ ---------- */

export async function recordProgress(courseKey: string, mastery: number, score?: number) {
  const user = await getCurrentUser();
  if (!user) return;

  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.key, courseKey))
    .limit(1);
  if (!course) return;

  const status = mastery >= 0.8 ? "completed" : "in_progress";
  const [existing] = await db
    .select()
    .from(progress)
    .where(
      and(eq(progress.userId, user.id), eq(progress.courseId, course.id)),
    )
    .limit(1);

  if (existing) {
    await db
      .update(progress)
      .set({
        status,
        mastery: Math.max(existing.mastery ?? 0, mastery),
        score: score ?? existing.score,
        lastAccessedAt: new Date(),
      })
      .where(eq(progress.id, existing.id));
  } else {
    await db.insert(progress).values({
      userId: user.id,
      courseId: course.id,
      status,
      mastery,
      score,
      lastAccessedAt: new Date(),
    });
  }
  revalidatePath("/app");
  revalidatePath("/app/cours");
}

export async function recordAttempt(input: {
  scope: string;
  subject?: string;
  statement: string;
  attempt?: string;
  hintsUsed: number;
  correct?: boolean;
  timeSpentSec: number;
}) {
  const user = await getCurrentUser();
  if (!user) return;
  await db.insert(exerciseAttempts).values({
    userId: user.id,
    ...input,
  });
}

/** Journal anonymisé — l'identité réelle n'est jamais stockée. */
export async function logActivity(input: {
  activityType: string;
  subject?: string;
  mastery?: number;
  meta?: unknown;
}) {
  const user = await getCurrentUser();
  // Empreinte anonyme pour les événements sans utilisateur authentifié.
  const userHash = user
    ? createHash("sha256").update(user.id).digest("hex").slice(0, 16)
    : "anonymous-session";
  await db.insert(activities).values({
    userHash,
    origin: user ? "real" : "synthetic",
    activityType: input.activityType,
    subject: input.subject,
    mastery: input.mastery,
    meta: input.meta as Record<string, unknown>,
  });
}

/* ---------- SEED ---------- */
export async function ensureSeed() {
  const [c] = await db.select({ n: sql<number>`count(*)` }).from(courses);
  if (Number(c?.n ?? 0) === 0) {
    await db.insert(courses).values(
      COURSES.map((co) => ({
        key: co.key,
        level: co.level,
        subject: co.subject,
        chapter: co.chapter,
        lesson: co.lesson,
        skill: co.skill,
        title: co.title,
        summary: co.summary,
        content: co.content,
        source: co.source,
        validated: true,
      })) as (typeof courses.$inferInsert)[],
    );
  }
  const [e] = await db.select({ n: sql<number>`count(*)` }).from(experiments);
  if (Number(e?.n ?? 0) === 0) {
    await db.insert(experiments).values(
      EXPERIMENTS.map((ex) => ({
        key: ex.key,
        subject: ex.subject,
        lesson: ex.lesson,
        title: ex.title,
        summary: ex.summary,
        icon: ex.icon,
      })),
    );
  }
  const [x] = await db.select({ n: sql<number>`count(*)` }).from(examPapers);
  if (Number(x?.n ?? 0) === 0) {
    await db.insert(examPapers).values(
      EXAMS.map((ex) => ({
        key: ex.key,
        exam: ex.exam,
        year: ex.year,
        subject: ex.subject,
        chapter: ex.chapter,
        difficulty: ex.difficulty,
        title: ex.title,
        questions: ex.questions,
        source: ex.source,
      })),
    );
  }
}
