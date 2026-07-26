import { db } from "@/db";
import { courses, progress, exerciseAttempts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getProgressWithCourses(userId: string) {
  return db
    .select({
      course: courses,
      progress: progress,
    })
    .from(progress)
    .innerJoin(courses, eq(progress.courseId, courses.id))
    .where(eq(progress.userId, userId))
    .orderBy(desc(progress.lastAccessedAt));
}

export async function getRecentAttempts(userId: string, limit = 5) {
  return db
    .select()
    .from(exerciseAttempts)
    .where(eq(exerciseAttempts.userId, userId))
    .orderBy(desc(exerciseAttempts.createdAt))
    .limit(limit);
}

export async function getCourseBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(courses)
    .where(eq(courses.key, slug))
    .limit(1);
  return row;
}
