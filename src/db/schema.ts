import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  real,
} from "drizzle-orm/pg-core";

/* ============================================================
   EduLab AI — Schéma de base de données
   PostgreSQL + Drizzle ORM
   ============================================================ */

export const userRoleEnum = pgEnum("user_role", [
  "student",
  "teacher",
  "parent",
  "admin",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("student").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  // Onboarding
  level: text("level"), // Collège / Lycée
  grade: text("grade"), // 3e, Terminale D, etc.
  cycle: text("cycle"), // BEPC / BAC / ---
  difficultSubjects: text("difficult_subjects"), // csv
  goals: text("goals"), // csv
  preferredLanguage: text("preferred_language").default("Français"),
  learningStyle: text("learning_style"), // visuel, auditif, kinesthésique
  examClass: boolean("exam_class").default(false),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const courses = pgTable("courses", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  level: text("level").notNull(),
  subject: text("subject").notNull(),
  chapter: text("chapter").notNull(),
  lesson: text("lesson").notNull(),
  skill: text("skill"),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: jsonb("content").notNull(), // structured lesson steps
  source: text("source").notNull(), // provenance
  validated: boolean("validated").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const progress = pgTable("progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  courseId: uuid("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  status: text("status").default("not_started").notNull(), // not_started, in_progress, completed
  mastery: real("mastery").default(0).notNull(), // 0..1
  score: integer("score"),
  lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
});

export const experiments = pgTable("experiments", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(), // ohm, circuit, force, function, stats, ph, dilution, respiration, genetics
  subject: text("subject").notNull(),
  lesson: text("lesson").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  icon: text("icon"),
});

export const exerciseAttempts = pgTable("exercise_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  scope: text("scope").notNull(), // homework / practice / exam
  subject: text("subject"),
  statement: text("statement").notNull(),
  attempt: text("attempt"),
  hintsUsed: integer("hints_used").default(0).notNull(),
  correct: boolean("correct"),
  timeSpentSec: integer("time_spent_sec").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const examPapers = pgTable("exam_papers", {
  id: uuid("id").defaultRandom().primaryKey(),
  key: text("key").notNull().unique(),
  exam: text("exam").notNull(), // BEPC / BAC
  year: text("year").notNull(),
  subject: text("subject").notNull(),
  chapter: text("chapter"),
  difficulty: text("difficulty").default("moyen").notNull(),
  title: text("title").notNull(),
  questions: jsonb("questions").notNull(),
  source: text("source").notNull(),
});

// Journal d'activité anonymisé (séparation données réelles / synthétiques)
export const activities = pgTable("activities", {
  id: uuid("id").defaultRandom().primaryKey(),
  userHash: text("user_hash").notNull(), // hash anonyme, jamais l'identité
  origin: text("origin").notNull().default("synthetic"), // synthetic | real
  activityType: text("activity_type").notNull(),
  subject: text("subject"),
  mastery: real("mastery"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Experiment = typeof experiments.$inferSelect;
export type ExamPaper = typeof examPapers.$inferSelect;
export type ProgressRow = typeof progress.$inferSelect;
