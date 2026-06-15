import type { CreateWorkoutSessionDto, WorkoutDetailDto } from "@fitflow/types";
import type { ExecutedExercise } from "@/lib/stores/workout-session.store";

/**
 * Converts the active workout session state (Zustand store) into the
 * CreateWorkoutSessionDto payload expected by `POST /workout-sessions`.
 *
 * `workout.exercises[i]` is paired by index with `session.exercises[i]`:
 * `startSession` seeds `session.exercises` in the same order as
 * `workout.exercises` (sorted by `order`), so a defensive sort-by-`order`
 * copy of `workout.exercises` is used to guarantee the pairing is correct
 * even if the API ever returns exercises out of order.
 *
 * - Sets without `completedAt` (not yet performed/skipped) are excluded
 *   from `executedSets`. An exercise with zero completed sets yields
 *   `executedSets: []` (valid per the relaxed `CreateSessionExerciseDto` DTO).
 * - Empty `notes`/`comment` and `difficulty <= 0` are omitted (`undefined`).
 * - `status` is intentionally not set — the backend defaults it based on
 *   `endedAt`, which is always provided by this flow (→ `FINISHED`).
 */
export function toCreateWorkoutSessionDto(
  workout: WorkoutDetailDto,
  session: { startedAt: string; exercises: ExecutedExercise[] },
  extras: { endedAt: string; comment?: string; difficulty?: number }
): CreateWorkoutSessionDto {
  const sortedExercises = [...workout.exercises].sort((a, b) => a.order - b.order);

  return {
    workoutId: workout.id,
    startedAt: session.startedAt,
    endedAt: extras.endedAt,
    comment: extras.comment || undefined,
    difficulty: extras.difficulty && extras.difficulty > 0 ? extras.difficulty : undefined,
    exercises: sortedExercises.map((workoutExercise, i) => {
      const sessionExercise = session.exercises[i];

      return {
        exerciseId: workoutExercise.exerciseId,
        order: workoutExercise.order,
        notes: sessionExercise.notes || undefined,
        executedSets: sessionExercise.sets
          .filter((set) => set.completedAt)
          .map((set) => ({
            setNumber: set.setNumber,
            kg: set.kg,
            reps: set.reps,
            completedAt: set.completedAt,
          })),
      };
    }),
  };
}
