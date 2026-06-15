"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useStrategy } from "@/lib/api/hooks/use-strategy";
import { useCreateWorkout } from "@/lib/api/hooks/use-create-workout";
import { useWorkoutsLimit } from "@/lib/api/hooks/use-workouts-limit";
import { WorkoutBuilder } from "@/components/workout/WorkoutBuilder";
import { toCreateWorkoutDto, type WorkoutFormValues } from "@/lib/workout/workout-form.schema";
import { ApiClientError } from "@/lib/api/client";

export default function NewWorkoutPage() {
  const { id: strategyId } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: strategy, isLoading, error } = useStrategy(strategyId);
  const { data: limitInfo, isLoading: limitLoading } = useWorkoutsLimit();
  const createWorkout = useCreateWorkout();
  const [submitError, setSubmitError] = useState<string | undefined>();

  if (error instanceof ApiClientError && error.status === 404) {
    notFound();
  }

  if (isLoading || !strategy || limitLoading) {
    return (
      <div className="flex flex-col gap-3 p-5">
        <div className="h-16 rounded-l bg-muted animate-pulse" />
        <div className="h-16 rounded-l bg-muted animate-pulse" />
      </div>
    );
  }

  const atLimit = !!limitInfo && limitInfo.limit !== null && limitInfo.count >= limitInfo.limit;
  const order = strategy.workouts.length;

  const handleSubmit = async (values: WorkoutFormValues) => {
    setSubmitError(undefined);
    try {
      const dto = toCreateWorkoutDto(values, strategyId, order);
      await createWorkout.mutateAsync(dto);
      router.push(`/program/${strategyId}`);
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
          href={`/program/${strategyId}`}
          className="h-9 w-9 rounded-m bg-muted flex items-center justify-center shrink-0 hover:bg-muted/80 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-[18px] w-[18px] text-foreground" />
        </Link>
        <h1 className="flex-1 font-bold text-lg leading-tight text-foreground">Novo treino</h1>
      </header>

      {atLimit ? (
        <div className="flex flex-col items-start gap-3 p-5">
          <p className="text-sm text-muted-foreground">
            Limite de {limitInfo?.limit} treinos do plano gratuito atingido.
          </p>
          <Link href={`/program/${strategyId}`} className="text-sm font-medium text-primary hover:underline">
            Voltar
          </Link>
        </div>
      ) : (
        <div className="p-5">
          <WorkoutBuilder
            mode="create"
            onSubmit={handleSubmit}
            isLoading={createWorkout.isPending}
            submitError={submitError}
          />
        </div>
      )}
    </div>
  );
}
