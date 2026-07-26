import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { EXAMS } from "@/lib/content";
import ExamRunner from "@/components/ExamRunner";

export const dynamic = "force-dynamic";

export default async function ExamPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  await getCurrentUser();

  const exam = EXAMS.find((e) => e.key === key);
  if (!exam) notFound();

  return <ExamRunner examKey={key} />;
}
