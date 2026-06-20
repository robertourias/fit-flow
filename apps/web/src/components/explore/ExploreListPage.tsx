"use client";

import { useState } from "react";
import { Compass, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTemplates } from "@/lib/api/hooks/use-templates";
import { useImportTemplate } from "@/lib/api/hooks/use-import-template";
import { useWorkoutsLimit } from "@/lib/api/hooks/use-workouts-limit";
import { ApiClientError } from "@/lib/api/client";
import type { StrategyTemplateDto } from "@fitflow/types";

interface TemplateCardProps {
  template: StrategyTemplateDto;
  isAtLimit: boolean;
  onImport: (id: string) => void;
  isPending: boolean;
  isImported: boolean;
  error: string | null;
}

function TemplateCard({
  template,
  isAtLimit,
  onImport,
  isPending,
  isImported,
  error,
}: TemplateCardProps) {
  const visibleWorkouts = template.workoutNames.slice(0, 4);
  const hiddenCount = template.workoutNames.length - visibleWorkouts.length;

  return (
    <article className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
      <div>
        <div className="flex items-start gap-2 flex-wrap">
          <h2 className="text-base font-semibold text-foreground leading-tight">
            {template.name}
          </h2>
          {template.type && (
            <Badge variant="secondary" className="text-xs">
              {template.type.replace("_", "/")}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            {template.workoutsCount} treinos
          </Badge>
        </div>
        {template.description && (
          <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
        )}
      </div>

      <ul className="text-sm text-foreground space-y-0.5">
        {visibleWorkouts.map((name) => (
          <li key={name} className="text-muted-foreground">
            • {name}
          </li>
        ))}
        {hiddenCount > 0 && (
          <li className="text-muted-foreground text-xs">e mais {hiddenCount}...</li>
        )}
      </ul>

      {template.muscleGroups.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {template.muscleGroups.map((mg) => (
            <span
              key={mg}
              className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
            >
              {mg}
            </span>
          ))}
        </div>
      )}

      {isImported ? (
        <p className="text-sm text-green-600 dark:text-green-400">
          Importado! Veja em{" "}
          <Link href="/library" className="underline font-medium">
            Biblioteca
          </Link>
          .
        </p>
      ) : (
        <Button
          size="sm"
          disabled={isAtLimit || isPending}
          onClick={() => onImport(template.id)}
          aria-label={`Importar ${template.name}`}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              Importando...
            </>
          ) : isAtLimit ? (
            "Limite atingido"
          ) : (
            "Importar"
          )}
        </Button>
      )}

      {error && !isImported && <p className="text-xs text-destructive">{error}</p>}
    </article>
  );
}

export function ExploreListPage() {
  const { data: templates, isLoading } = useTemplates();
  const { data: limitData } = useWorkoutsLimit();
  const importMutation = useImportTemplate();

  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);

  const count = limitData?.count ?? 0;
  const plan = limitData?.plan ?? "FREE";

  async function handleImport(id: string) {
    setPendingId(id);
    setCardErrors((prev) => ({ ...prev, [id]: "" }));
    try {
      await importMutation.mutateAsync(id);
      setImportedIds((prev) => new Set(prev).add(id));
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 403) {
        setShowUpgradeBanner(true);
      } else {
        setCardErrors((prev) => ({
          ...prev,
          [id]: "Erro ao importar. Tente novamente.",
        }));
      }
    } finally {
      setPendingId(null);
    }
  }

  function checkIsAtLimit(template: StrategyTemplateDto): boolean {
    return plan === "FREE" && count + template.workoutsCount > 6;
  }

  return (
    <main className="min-h-dvh bg-background px-5 py-6">
      {showUpgradeBanner && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200"
        >
          Limite de treinos atingido. Faça upgrade para PRO para importar mais programas.
        </div>
      )}

      <h1 className="text-lg font-semibold text-foreground mb-6">Programas de Treino</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-label="Carregando templates">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="h-5 w-40 rounded bg-muted animate-pulse" />
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-8 w-24 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(templates ?? []).map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isAtLimit={checkIsAtLimit(template)}
                onImport={handleImport}
                isPending={pendingId === template.id}
                isImported={importedIds.has(template.id)}
                error={cardErrors[template.id] ?? null}
              />
            ))}
          </div>

          {(templates ?? []).length === 0 && (
            <section className="flex flex-col items-center justify-center gap-4 pt-24 text-center">
              <Compass className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-base font-semibold text-foreground">
                Nenhum template disponível ainda.
              </h2>
            </section>
          )}
        </>
      )}
    </main>
  );
}
