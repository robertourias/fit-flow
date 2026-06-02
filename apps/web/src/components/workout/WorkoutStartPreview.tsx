"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Ellipsis } from "lucide-react";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useWorkoutSessionStore } from "@/lib/stores/workout-session.store";
import type { WorkoutDetail, WorkoutExercise, WorkoutSession } from "@/lib/mock/workout";

function estimateDuration(workout: WorkoutDetail): string {
  let totalSeconds = 0;
  for (const ex of workout.exercises) {
    totalSeconds += ex.sets.length * (ex.restSeconds + 45);
  }
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `~${h}h ${m}m`;
  return `~${m}m`;
}

function exerciseSubtitle(ex: WorkoutExercise): string {
  const first = ex.sets[0];
  if (!first) return `${ex.sets.length} Séries`;
  const kg = first.targetKg;
  let label = `${ex.sets.length} Séries · ${first.targetReps} reps`;
  if (kg !== undefined && kg !== "") label += ` · ${kg}kg`;
  return label;
}

interface WorkoutStartPreviewProps {
  workout: WorkoutDetail;
  lastSession?: WorkoutSession;
}

export function WorkoutStartPreview({ workout, lastSession }: WorkoutStartPreviewProps) {
  const router = useRouter();
  const startSession = useWorkoutSessionStore((s) => s.startSession);

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const durationLabel = estimateDuration(workout);
  const lastDate = lastSession ? parseISO(lastSession.startedAt) : null;

  function handleStart() {
    startSession(workout.id, workout.exercises);
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
        {workout.exercises.map((ex) => (
          <div
            key={ex.id}
            className="flex items-center gap-3 px-5 py-3.5 border-b border-border/50"
          >
            <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 bg-muted">
              <Image
                src={ex.image}
                alt={ex.name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold leading-tight truncate">{ex.name}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5">{exerciseSubtitle(ex)}</p>
            </div>
            <button
              className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              aria-label="Opções"
            >
              <Ellipsis className="h-4 w-4" />
            </button>
          </div>
        ))}
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
