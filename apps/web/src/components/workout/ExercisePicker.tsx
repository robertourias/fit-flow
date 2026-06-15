"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ExerciseImage } from "@/components/exercises/ExerciseImage";
import { useExercises } from "@/lib/api/hooks/use-exercises";
import { useMuscleGroups } from "@/lib/api/hooks/use-muscle-groups";
import { cn } from "@/lib/utils";
import type { ExerciseDto } from "@fitflow/types";

interface ExercisePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  excludeIds?: string[];
  onSelect: (exercise: ExerciseDto) => void;
}

function PillChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium transition-colors shrink-0",
        active
          ? "bg-primary text-white"
          : "bg-muted text-muted-foreground border border-border hover:bg-accent"
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export function ExercisePicker({ open, onOpenChange, excludeIds = [], onSelect }: ExercisePickerProps) {
  const [search, setSearch] = useState("");
  const [muscleGroupSlug, setMuscleGroupSlug] = useState<string | undefined>(undefined);

  // Defer search so each keystroke doesn't synchronously trigger a refetch
  const deferredSearch = useDeferredValue(search);

  const { data: muscleGroups = [] } = useMuscleGroups();

  const {
    data,
    isLoading,
    isError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useExercises({
    search: deferredSearch || undefined,
    muscleGroupSlug,
  });

  const exercises = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const visibleExercises = useMemo(
    () => exercises.filter((exercise) => !excludeIds.includes(exercise.id)),
    [exercises, excludeIds]
  );

  const handleSelect = (exercise: ExerciseDto) => {
    onSelect(exercise);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-4">
        <SheetHeader>
          <SheetTitle>Adicionar exercício</SheetTitle>
        </SheetHeader>

        {/* Search */}
        <div className="flex items-center gap-2 bg-background rounded-m border border-border px-3 py-2 shrink-0">
          <Search className="h-[15px] w-[15px] text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Buscar exercício..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            aria-label="Buscar exercício"
          />
        </div>

        {/* Muscle group filter */}
        <div className="flex gap-1.5 flex-wrap shrink-0">
          <PillChip
            label="Todos"
            active={!muscleGroupSlug}
            onClick={() => setMuscleGroupSlug(undefined)}
          />
          {muscleGroups.map((mg) => (
            <PillChip
              key={mg.id}
              label={mg.name}
              active={muscleGroupSlug === mg.slug}
              onClick={() => setMuscleGroupSlug(mg.slug)}
            />
          ))}
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-1 -mx-2 px-2">
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-l bg-muted animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 py-12 text-center px-4">
              <p className="font-semibold text-foreground">Erro ao carregar exercícios</p>
              <p className="text-sm text-muted-foreground">Tente novamente em alguns instantes.</p>
            </div>
          ) : visibleExercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 py-12 text-center px-4">
              <p className="font-semibold text-foreground">Nenhum exercício encontrado</p>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros ou a busca.
              </p>
            </div>
          ) : (
            <>
              {visibleExercises.map((exercise) => {
                const primaryMuscle =
                  exercise.muscleGroups.find((m) => m.isPrimary) ?? exercise.muscleGroups[0];
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => handleSelect(exercise)}
                    className="flex items-center gap-3 rounded-l border border-border p-2 text-left transition-colors hover:bg-accent"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-m">
                      <ExerciseImage
                        src={exercise.imageUrl}
                        alt={exercise.name}
                        sizes="48px"
                      />
                    </div>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="text-sm font-semibold text-foreground line-clamp-1">
                        {exercise.name}
                      </span>
                      {primaryMuscle && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {primaryMuscle.name}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {hasNextPage && (
                <div className="flex justify-center py-3">
                  <Button
                    variant="secondary"
                    onClick={() => fetchNextPage()}
                    isLoading={isFetchingNextPage}
                  >
                    Carregar mais
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
