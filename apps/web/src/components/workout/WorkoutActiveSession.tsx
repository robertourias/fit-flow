"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Ellipsis,
  Plus,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkoutSessionStore } from "@/lib/stores/workout-session.store";
import { ExerciseImage } from "@/components/exercises/ExerciseImage";
import type { ExerciseDto, WorkoutDetailDto, WorkoutSessionDetailDto } from "@fitflow/types";

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useElapsedSeconds(startedAt: string | null): number {
  const [elapsed, setElapsed] = useState(() =>
    startedAt ? Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000) : 0
  );
  useEffect(() => {
    if (!startedAt) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  return elapsed;
}

function useRestCountdown(restEndsAt: string | null): number {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!restEndsAt) { setRemaining(0); return; }
    const update = () => {
      setRemaining(Math.max(0, Math.floor((new Date(restEndsAt).getTime() - Date.now()) / 1000)));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [restEndsAt]);
  return remaining;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimer(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatRest(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}min ${s < 10 ? `0${s}` : s}s`;
}

// ─── WorkoutActiveSession ─────────────────────────────────────────────────────

interface Props {
  workout: WorkoutDetailDto;
  exercises: ExerciseDto[];
  lastSession: WorkoutSessionDetailDto | null;
}

export function WorkoutActiveSession({ workout, exercises, lastSession }: Props) {
  const router = useRouter();
  const isNavigating = useRef(false);

  const sortedExercises = [...workout.exercises].sort((a, b) => a.order - b.order);
  const exercisesById = new Map(exercises.map((e) => [e.id, e]));

  const {
    status,
    workoutId,
    startedAt,
    currentExerciseIndex,
    exercises: storeExercises,
    restEndsAt,
    completeSet,
    setRestTimer,
    clearRest,
    setCurrentExercise,
    updateNote,
    beginFinishing,
  } = useWorkoutSessionStore();

  const elapsedSeconds = useElapsedSeconds(startedAt);
  const restRemaining = useRestCountdown(restEndsAt);

  // Redirect if no active session for this workout
  useEffect(() => {
    if (isNavigating.current) return;
    if (status !== "active" || workoutId !== workout.id) {
      router.replace(`/workout/${workout.id}/start`);
    }
  }, [status, workoutId, workout.id, router]);

  // All exercises done → auto-finalize
  useEffect(() => {
    if (status === "active" && currentExerciseIndex >= sortedExercises.length) {
      isNavigating.current = true;
      beginFinishing();
      router.push(`/workout/${workout.id}/finish`);
    }
  }, [currentExerciseIndex, sortedExercises.length, status, beginFinishing, router, workout.id]);

  // Local set inputs (kg/reps before completing)
  const [inputs, setInputs] = useState<Record<number, { kg: string; reps: string }>>({});
  // Extra sets added beyond planned
  const [extraSets, setExtraSets] = useState(0);

  // Reset local state when exercise changes
  useEffect(() => {
    setInputs({});
    setExtraSets(0);
  }, [currentExerciseIndex]);

  const workoutEx = sortedExercises[currentExerciseIndex];
  const storeEx = storeExercises[currentExerciseIndex];

  if (!workoutEx || !storeEx || status !== "active") {
    return <div className="min-h-dvh bg-background" />;
  }

  const exercise = exercisesById.get(workoutEx.exerciseId);

  const totalSets = sortedExercises.reduce((sum, ex) => sum + ex.plannedSets.length, 0);
  const completedSets = storeExercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completedAt).length,
    0
  );

  const prevExData = lastSession?.exercises.find((e) => e.exerciseId === workoutEx.exerciseId);

  function getPrevLabel(setNum: number): string {
    const s = prevExData?.executedSets.find((s) => s.setNumber === setNum);
    if (!s?.reps) return "—";
    return s.kg ? `${s.kg}kg × ${s.reps}` : `${s.reps} reps`;
  }

  function isCompleted(setNum: number): boolean {
    return !!storeEx.sets.find((s) => s.setNumber === setNum && s.completedAt);
  }

  function getCompleted(setNum: number) {
    return storeEx.sets.find((s) => s.setNumber === setNum);
  }

  function getInput(setNum: number) {
    return inputs[setNum] ?? { kg: "", reps: "" };
  }

  function updateInput(setNum: number, updates: { kg?: string; reps?: string }) {
    setInputs((prev) => ({ ...prev, [setNum]: { ...getInput(setNum), ...updates } }));
  }

  function handleComplete(setNum: number) {
    const { kg, reps } = getInput(setNum);
    completeSet(
      currentExerciseIndex,
      setNum,
      kg ? parseFloat(kg) : undefined,
      reps ? parseInt(reps, 10) : undefined
    );
    const endsAt = new Date(Date.now() + workoutEx.restSeconds * 1000).toISOString();
    setRestTimer(endsAt);
  }

  function handleNextExercise() {
    clearRest();
    setCurrentExercise(currentExerciseIndex + 1);
  }

  function handleFinalize() {
    isNavigating.current = true;
    beginFinishing();
    router.push(`/workout/${workout.id}/finish`);
  }

  const sortedPlannedSets = [...workoutEx.plannedSets].sort((a, b) => a.setNumber - b.setNumber);
  const totalSetCount = sortedPlannedSets.length + extraSets;
  const allSetNums = Array.from({ length: totalSetCount }, (_, i) => i + 1);
  const progressPct = totalSets > 0 ? Math.min(100, (completedSets / totalSets) * 100) : 0;

  const primaryMuscle = exercise?.muscleGroups.find((m) => m.isPrimary) ?? exercise?.muscleGroups[0];

  const nextWorkoutEx = sortedExercises[currentExerciseIndex + 1];
  const nextExercise = nextWorkoutEx ? exercisesById.get(nextWorkoutEx.exerciseId) : undefined;
  const nextSortedSets = nextWorkoutEx
    ? [...nextWorkoutEx.plannedSets].sort((a, b) => a.setNumber - b.setNumber)
    : [];

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-14 pb-3 gap-2">
        <button
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Recolher"
        >
          <ChevronDown className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-1.5 bg-muted rounded-pill px-3 py-1.5">
          <Timer className="h-4 w-4 text-primary" />
          <span className="text-[15px] font-bold tabular-nums">{formatTimer(elapsedSeconds)}</span>
        </div>

        <button
          onClick={handleFinalize}
          className="shrink-0 bg-primary text-primary-foreground rounded-pill px-4 py-1.5 text-[14px] font-semibold hover:bg-primary/90 transition-colors"
        >
          Finalizar
        </button>
      </div>

      {/* Progress bar */}
      <div className="mx-4 mb-3 h-[3px] bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Rest countdown */}
      {restRemaining > 0 && (
        <div className="mx-4 mb-3 flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-[14px] font-medium text-primary">Descanso</span>
          </div>
          <span className="text-[20px] font-bold tabular-nums text-primary">
            {formatTimer(restRemaining)}
          </span>
          <button
            onClick={clearRest}
            className="text-[12px] font-medium text-primary/70 hover:text-primary transition-colors"
          >
            Pular
          </button>
        </div>
      )}

      {/* Exercise block */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: nextWorkoutEx ? 92 : 32 }}>
        <div className="bg-card border-b border-border">
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-4 pb-2">
            <div className="flex-1 min-w-0 pr-3">
              <h2 className="text-[17px] font-bold leading-tight">{exercise?.name ?? "Exercício"}</h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">{primaryMuscle?.name}</p>
            </div>
            <button
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Opções"
            >
              <Ellipsis className="h-5 w-5" />
            </button>
          </div>

          {/* Note */}
          <div className="px-5 pb-2">
            <input
              type="text"
              value={storeEx.notes}
              onChange={(e) => updateNote(currentExerciseIndex, e.target.value)}
              placeholder="Notas..."
              className="w-full bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
          </div>

          {/* Rest label */}
          <div className="flex items-center gap-1.5 px-5 pb-4">
            <Timer className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[12px] text-muted-foreground">
              Descanso: {formatRest(workoutEx.restSeconds)}
            </span>
          </div>

          {/* Sets table */}
          <table className="w-full">
            <thead>
              <tr className="border-y border-border bg-muted/30">
                <th className="py-2 pl-5 pr-1 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-12">
                  Série
                </th>
                <th className="py-2 px-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Anterior
                </th>
                <th className="py-2 px-1.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-16">
                  Kg
                </th>
                <th className="py-2 px-1.5 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-16">
                  Reps
                </th>
                <th className="py-2 pl-2 pr-5 w-10" />
              </tr>
            </thead>
            <tbody>
              {allSetNums.map((setNum) => {
                const done = isCompleted(setNum);
                const comp = getCompleted(setNum);
                const input = getInput(setNum);

                return (
                  <tr
                    key={setNum}
                    className={cn(
                      "border-b border-border/40 last:border-0",
                      done && "bg-primary/5"
                    )}
                  >
                    <td className="py-2.5 pl-5 pr-1">
                      <span
                        className={cn(
                          "inline-flex items-center justify-center h-6 w-6 rounded-full text-[11px] font-bold",
                          done
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {setNum}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center text-[12px] text-muted-foreground">
                      {getPrevLabel(setNum)}
                    </td>
                    <td className="py-2.5 px-1.5">
                      {done ? (
                        <span className="block text-center text-[13px] font-medium">
                          {comp?.kg ?? "—"}
                        </span>
                      ) : (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={input.kg}
                          onChange={(e) => updateInput(setNum, { kg: e.target.value })}
                          placeholder="—"
                          aria-label="Kg"
                          className="w-full bg-muted/50 rounded-s py-1 px-1 text-center text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}
                    </td>
                    <td className="py-2.5 px-1.5">
                      {done ? (
                        <span className="block text-center text-[13px] font-medium">
                          {comp?.reps ?? "—"}
                        </span>
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={input.reps}
                          onChange={(e) => updateInput(setNum, { reps: e.target.value })}
                          placeholder="—"
                          aria-label="Reps"
                          className="w-full bg-muted/50 rounded-s py-1 px-1 text-center text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}
                    </td>
                    <td className="py-2.5 pl-2 pr-5 text-center">
                      <button
                        onClick={() => !done && handleComplete(setNum)}
                        disabled={done}
                        aria-label={done ? "Série concluída" : "Marcar como concluída"}
                        className={cn(
                          "transition-colors",
                          done
                            ? "text-primary cursor-default"
                            : "text-muted-foreground/40 hover:text-primary"
                        )}
                      >
                        {done ? (
                          <CheckCircle2 className="h-5 w-5" fill="currentColor" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Add set */}
          <button
            onClick={() => setExtraSets((n) => n + 1)}
            className="flex items-center gap-1.5 w-full justify-center py-3 text-[13px] font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar série
          </button>
        </div>
      </div>

      {/* Next exercise footer */}
      {nextWorkoutEx && (
        <button
          onClick={handleNextExercise}
          className="fixed bottom-0 left-0 right-0 flex items-center gap-3 px-5 py-3.5 bg-card border-t border-border hover:bg-accent/30 transition-colors"
        >
          <div className="flex flex-col flex-1 min-w-0 text-left">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium">
              A seguir
            </span>
            <span className="text-[14px] font-semibold truncate mt-0.5">{nextExercise?.name}</span>
            <span className="text-[12px] text-muted-foreground">
              {nextSortedSets.length} séries × {nextSortedSets[0]?.targetReps} reps
            </span>
          </div>
          <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 bg-muted">
            <ExerciseImage
              src={nextExercise?.imageUrl ?? null}
              alt={nextExercise?.name ?? "Exercício"}
              sizes="48px"
            />
          </div>
        </button>
      )}
    </div>
  );
}
