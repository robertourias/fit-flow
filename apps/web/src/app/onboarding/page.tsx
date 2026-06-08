import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-l border border-border bg-card p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-pill bg-[var(--color-info-bg)]">
          <Sparkles className="h-6 w-6 text-[var(--color-info-text)]" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-bold text-card-foreground">Complete seu perfil</h1>
          <p className="text-sm text-muted-foreground">
            Em breve você poderá configurar seus objetivos e preferências de treino aqui.
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/dashboard">Ir para o dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
