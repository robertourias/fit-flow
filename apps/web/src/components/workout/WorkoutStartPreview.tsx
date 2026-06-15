"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Ellipsis } from "lucide-react";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useWorkoutSessionStore } from "@/lib/stores/workout-session.store";
import { ExerciseImage } from "@/components/exercises/ExerciseImage";
import type { ExerciseDto, WorkoutDetailDto, WorkoutExerciseDto, WorkoutSessionDetailDto } from "@fitflow/types";

function estimateDuration(workout: WorkoutDetailDto): string {
  let totalSeconds = 0;
  for (const ex of workout.exercises) {
    totalSeconds += ex.plannedSets.length * (ex.restSeconds + 45);
  }
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `~${h}h ${m}m`;
  return `~${m}m`;
}

function exerciseSubtitle(workoutEx: WorkoutExerciseDto): string {
  const sorted = [...workoutEx.plannedSets].sort((a, b) => a.setNumber - b.setNumber);
  const first = sorted[0];
  if (!first) return `${sorted.length} Séries`;
  let label = `${sorted.length} Séries · ${first.targetReps} reps`;
  if (first.targetKg) label += ` · ${first.targetKg}kg`;
  return label;
}

interface WorkoutStartPreviewProps {
  workout: WorkoutDetailDto;
  exercises: ExerciseDto[];
  lastSession: WorkoutSessionDetailDto | null;
}

export function WorkoutStartPreview({ workout, exercises, lastSession }: WorkoutStartPreviewProps) {
  const router = useRouter();
  const startSession = useWorkoutSessionStore((s) => s.startSession);

  const sortedExercises = [...workout.exercises].sort((a, b) => a.order - b.order);
  const exercisesById = new Map(exercises.map((e) => [e.id, e]));

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.plannedSets.length, 0);
  const durationLabel = estimateDuration(workout);
  const lastDate = lastSession ? parseISO(lastSession.startedAt) : null;

  function handleStart() {
    const exerciseIds = [...workout.exercises]
      .sort((a, b) => a.order - b.order)
      .map((e) => e.exerciseId);
    startSession(workout.id, exerciseIds);
    router.push(`/workout/${workout.id}/session`);
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-14 pb-5">
        <Link
          href={`/workout/${workout.id}`}
          className="text-foreground hover:text-muted-foreground transition-colors"
          aria-label="Voltar para o treino"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <button
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Mais opções"
        >
          <Ellipsis className="h-5 w-5" />
        </button>
      </div>

      {/* Title + last session */}
      <div className="px-5 pb-6">
        <h1 className="text-[26px] font-bold leading-tight">{workout.name}</h1>
        {lastDate ? (
          <div className="mt-2 space-y-0.5">
            <p className="text-[13px] text-muted-foreground">
              Última execução:{" "}
              {formatDistanceToNow(lastDate, { locale: ptBR, addSuffix: true })}
            </p>
            <p className="text-[12px] text-muted-foreground/60">
              {format(lastDate, "d 'de' MMMM 'de' yyyy 'às' HH'h'mm", { locale: ptBR })}
            </p>
          </div>
        ) : (
          <p className="text-[13px] text-muted-foreground mt-2">Primeira execução</p>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-5 pb-6">
        <div className="flex-1 bg-card rounded-xl p-4 border border-border flex flex-col gap-1">
          <span className="text-[28px] font-bold leading-none tabular-nums">{totalSets}</span>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Total Séries
          </span>
        </div>
        <div className="flex-1 bg-card rounded-xl p-4 border border-border flex flex-col gap-1">
          <span className="text-[22px] font-bold leading-none">{durationLabel}</span>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Duração est.
          </span>
        </div>
        <div className="flex-1 bg-card rounded-xl p-4 border border-border flex flex-col gap-1">
          <Dumbbell className="h-7 w-7 text-primary" />
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">
            Musculação
          </span>
        </div>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto pb-32">
        {sortedExercises.map((workoutEx) => {
          const exercise = exercisesById.get(workoutEx.exerciseId);
          return (
            <div
              key={workoutEx.id}
              className="flex items-center gap-3 px-5 py-3.5 border-b border-border/50"
            >
              <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 bg-muted">
                <ExerciseImage
                  src={exercise?.imageUrl ?? null}
                  alt={exercise?.name ?? "Exercício"}
                  sizes="48px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold leading-tight truncate">
                  {exercise?.name ?? "Exercício"}
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {exerciseSubtitle(workoutEx)}
                </p>
              </div>
              <button
                className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                aria-label="Opções"
              >
                <Ellipsis className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Fixed CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-10 pt-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
        <button
          onClick={handleStart}
          className="pointer-events-auto w-full bg-primary text-primary-foreground rounded-pill h-14 text-[16px] font-bold hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg"
        >
          Iniciar Treino
        </button>
      </div>
    </div>
  );
}
