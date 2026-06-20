"use client";

import { useParams, notFound } from "next/navigation";
import { useWorkoutSession } from "@/lib/api/hooks/use-workout-session";
import { useExercisesByIds } from "@/lib/api/hooks/use-exercises-by-ids";
import { ApiClientError } from "@/lib/api/client";
import { SessionDetailPage } from "@/components/history/SessionDetailPage";

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading, error } = useWorkoutSession(id);

  const exerciseIds = session
    ? [...session.exercises].sort((a, b) => a.order - b.order).map((e) => e.exerciseId)
    : [];
  const exerciseQueries = useExercisesByIds(exerciseIds);

  if (error instanceof ApiClientError && error.status === 404) {
    notFound();
  }

  const exercisesLoaded =
    exerciseQueries.length === exerciseIds.length && exerciseQueries.every((q) => q.data);

  if (isLoading || !session || (exerciseIds.length > 0 && !exercisesLoaded)) {
    return (
      <div className="flex flex-col gap-3 p-5">
        <div className="h-8 w-48 rounded-l bg-muted animate-pulse" />
        <div className="h-16 rounded-l bg-muted animate-pulse" />
        <div className="h-32 rounded-l bg-muted animate-pulse" />
      </div>
    );
  }

  const exercises = exerciseQueries.map((q) => q.data!);

  return <SessionDetailPage session={session} exercises={exercises} />;
}
