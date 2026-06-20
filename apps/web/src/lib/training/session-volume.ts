import type { SessionExerciseDto } from "@fitflow/types";

export function computeSessionVolume(exercises: SessionExerciseDto[]): number {
  return exercises.reduce((total, exercise) => {
    const exerciseVolume = exercise.executedSets.reduce((sum, set) => {
      return sum + (set.kg ?? 0) * (set.reps ?? 0);
    }, 0);

    return total + exerciseVolume;
  }, 0);
}
