"use client";

import { useParams, notFound } from "next/navigation";
import { useWorkout } from "@/lib/api/hooks/use-workout";
import { useExercisesByIds } from "@/lib/api/hooks/use-exercises-by-ids";
import { useLastFinishedSession } from "@/lib/api/hooks/use-last-finished-session";
import { WorkoutActiveSession } from "@/components/workout/WorkoutActiveSession";
import { ApiClientError } from "@/lib/api/client";

export default function WorkoutSessionPage() {
  const { id } = useParams<{ id: string }>();
  const { data: workout, isLoading, error } = useWorkout(id);

  const sortedExercises = workout ? [...workout.exercises].sort((a, b) => a.order - b.order) : [];
  const exerciseIds = sortedExercises.map((ex) => ex.exerciseId);
  const exerciseQueries = useExercisesByIds(exerciseIds);
  const { data: lastSession } = useLastFinishedSession(id);

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

  return (
    <WorkoutActiveSession
      workout={workout}
      exercises={exerciseQueries.map((q) => q.data!)}
      lastSession={lastSession ?? null}
    />
  );
}
