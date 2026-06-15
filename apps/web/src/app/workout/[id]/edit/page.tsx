"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useWorkout } from "@/lib/api/hooks/use-workout";
import { useExercisesByIds } from "@/lib/api/hooks/use-exercises-by-ids";
import { useUpdateWorkout } from "@/lib/api/hooks/use-update-workout";
import { WorkoutBuilder } from "@/components/workout/WorkoutBuilder";
import { toUpdateWorkoutDto, type WorkoutFormValues } from "@/lib/workout/workout-form.schema";
import { ApiClientError } from "@/lib/api/client";

export default function EditWorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: workout, isLoading, error } = useWorkout(id);
  const updateWorkout = useUpdateWorkout(id);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const sortedExercises = workout ? [...workout.exercises].sort((a, b) => a.order - b.order) : [];
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
      </div>
    );
  }

  const initialValues: WorkoutFormValues = {
    name: workout.name,
    description: workout.description ?? "",
    exercises: sortedExercises.map((ex, i) => ({
      exerciseId: ex.exerciseId,
      restSeconds: ex.restSeconds,
      notes: ex.notes ?? "",
      plannedSets: [...ex.plannedSets]
        .sort((a, b) => a.setNumber - b.setNumber)
        .map((set) => ({ targetReps: set.targetReps, targetKg: set.targetKg ?? undefined })),
      _exercise: exerciseQueries[i].data!,
    })),
  };

  const handleSubmit = async (values: WorkoutFormValues) => {
    setSubmitError(undefined);
    try {
      const dto = toUpdateWorkoutDto(values);
      await updateWorkout.mutateAsync(dto);
      router.push(`/program/${workout.strategyId}`);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 422) {
        setSubmitError("Limite de 6 treinos atingido");
      } else {
        setSubmitError("Não foi possível salvar. Tente novamente.");
      }
    }
  };

  return (
    <div className="flex flex-col">
      <header className="flex items-center gap-3 px-5 py-4 bg-card border-b border-border">
        <Link
          href={`/program/${workout.strategyId}`}
          className="h-9 w-9 rounded-m bg-muted flex items-center justify-center shrink-0 hover:bg-muted/80 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-[18px] w-[18px] text-foreground" />
        </Link>
        <h1 className="flex-1 font-bold text-lg leading-tight text-foreground">Editar treino</h1>
      </header>

      <div className="p-5">
        <WorkoutBuilder
          mode="edit"
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isLoading={updateWorkout.isPending}
          submitError={submitError}
        />
      </div>
    </div>
  );
}
