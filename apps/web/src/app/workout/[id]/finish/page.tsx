"use client";

import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import { useWorkout } from "@/lib/api/hooks/use-workout";
import { WorkoutFinishForm } from "@/components/workout/WorkoutFinishForm";
import { ApiClientError } from "@/lib/api/client";

export default function WorkoutFinishPage() {
  const { id } = useParams<{ id: string }>();
  const { data: workout, isLoading, error } = useWorkout(id);

  if (error instanceof ApiClientError && error.status === 404) {
    notFound();
  }

  if (isLoading || !workout) {
    return (
      <div className="flex flex-col gap-3 p-5">
        <div className="h-16 rounded-l bg-muted animate-pulse" />
        <div className="h-16 rounded-l bg-muted animate-pulse" />
      </div>
    );
  }

  return <WorkoutFinishForm workout={workout} />;
}
