import { auth } from "@/lib/auth";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function OnboardingPage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border/70 bg-card shadow-sm p-6">
        <OnboardingWizard userName={session?.user?.name} />
      </div>
    </main>
  );
}
