import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Ancienne page de cours autonome (CoursePlayer) — remplacée par l'explorateur unique
 * (/app/cours + AIProfessorClassroom). Cette route redirige plutôt que de renvoyer un 404,
 * pour ne pas casser d'anciens liens/favoris.
 */
export default async function LegacyCoursePage() {
  redirect("/app/cours");
}
