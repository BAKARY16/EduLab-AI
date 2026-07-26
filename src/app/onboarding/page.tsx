import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import OnboardingWizard from "@/components/OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  // Already onboarded students go straight to the app
  if (user.role === "student" && user.profile?.onboardingCompleted) {
    redirect("/app");
  }

  return <OnboardingWizard userName={user.name} />;
}
