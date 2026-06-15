"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Play, Timer } from "lucide-react";
import { useWorkout } from "@/lib/api/hooks/use-workout";
import { useExercisesByIds } from "@/lib/api/hooks/use-exercises-by-ids";
import { ApiClientError } from "@/lib/api/client";
import { ExerciseImage } from "@/components/exercises/ExerciseImage";
import type { ExerciseDto } from "@fitflow/types";

function formatRest(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min === 0) return `${sec}s`;
  if (sec === 0) return `${min}min`;
  return `${min}min ${sec < 10 ? `0${sec}` : sec}s`;
}

export function WorkoutDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { data: workout, isLoading, error } = useWorkout(id);

  const sortedExercises = workout
    ? [...workout.exercises].sort((a, b) => a.order - b.order)
    : [];
  const exerciseIds = sortedExercises.map((ex) => ex.exerciseId);
  const exerciseQueries = useExercisesByIds(exerciseIds);

  if (error instanceof ApiClientError && error.status === 404) {
    notFound();
  }

  const exercisesLoaded =
    exerciseQueries.length === exerciseIds.length && exerciseQueries.every((q) => q.data);

  if (isLoading || !workout || !exercisesLoaded) {
    return (
      <div className="flex flex-col gap-3 p-5">
        <div className="h-16 rounded-l bg-muted animate-pulse" />
        <div className="h-16 rounded-l bg-muted animate-pulse" />
        <div className="h-16 rounded-l bg-muted animate-pulse" />
      </div>
    );
  }

  const exercisesById = new Map<string, ExerciseDto>(
    exerciseQueries.map((q) => [q.data!.id, q.data!])
  );

  return (
    <div className="flex flex-col">
      {/* Sticky header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-20">
        <Link
          href={`/program/${workout.strategyId}`}
          className="flex h-11 w-11 items-center justify-center shrink-0 rounded-m text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Voltar para o programa"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <h1 className="text-[15px] font-bold flex-1 truncate min-w-0">{workout.name}</h1>

        <Link
          href={`/workout/${workout.id}/edit`}
          className="flex items-center gap-1.5 shrink-0 text-[13px] font-medium text-muted-foreground border border-border rounded-pill px-3 py-2 min-h-[44px] hover:text-foreground hover:border-foreground/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">Editar</span>
        </Link>

        <button
          onClick={() => router.push(`/workout/${workout.id}/start`)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-pill px-4 py-2 min-h-[44px] text-[13px] font-semibold hover:bg-primary/90 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Play className="h-3.5 w-3.5" fill="currentColor" />
          Iniciar Treino
        </button>
      </header>

      {/* Exercise list */}
      <main className="flex-1">
        <ul>
          {sortedExercises.map((workoutExercise) => {
            const exercise = exercisesById.get(workoutExercise.exerciseId);
            const sortedSets = [...workoutExercise.plannedSets].sort(
              (a, b) => a.setNumber - b.setNumber
            );
            const firstSet = sortedSets[0];
            const setsLabel = firstSet
              ? `${sortedSets.length} séries · ${firstSet.targetReps} reps${
                  firstSet.targetKg ? ` · ${firstSet.targetKg}kg` : ""
                }`
              : `${sortedSets.length} séries`;

            const primaryMuscle =
              exercise?.muscleGroups.find((m) => m.isPrimary) ?? exercise?.muscleGroups[0];

            return (
              <li
                key={workoutExercise.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card"
              >
                <div className="relative h-11 w-11 rounded-m overflow-hidden shrink-0">
                  <ExerciseImage
                    src={exercise?.imageUrl ?? null}
                    alt={exercise?.name ?? "Exercício"}
                    sizes="44px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold leading-tight truncate">
                    {exercise?.name ?? "Exercício"}
                  </p>
                  {primaryMuscle && (
                    <p className="text-[12px] text-muted-foreground mt-0.5 truncate">
                      {primaryMuscle.name}
                    </p>
                  )}
                  <p className="text-[12px] text-muted-foreground mt-0.5">{setsLabel}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-[12px] text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" />
                  {formatRest(workoutExercise.restSeconds)}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="pb-24 md:pb-8" />
      </main>
    </div>
  );
}
