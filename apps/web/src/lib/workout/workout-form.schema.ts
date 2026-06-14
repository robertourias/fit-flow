import { z } from "zod";
import type { ExerciseDto, CreateWorkoutDto, UpdateWorkoutDto } from "@fitflow/types";

/**
 * Schema for a single planned set in the workout form.
 * Note: setNumber is NOT included here — it's derived from the array index.
 */
const plannedSetSchema = z.object({
  targetReps: z.string().min(1, "Informe as repetições"),
  targetKg: z.string().optional(),
});

/**
 * Schema for a workout exercise in the form.
 * Includes _exercise as a display-only field (not sent to API).
 */
const workoutExerciseSchema = z.object({
  exerciseId: z.string().min(1, "Selecione um exercício"),
  restSeconds: z.number().min(0).default(90),
  notes: z.string().optional(),
  plannedSets: z.array(plannedSetSchema).min(1, "Adicione ao menos uma série"),
  _exercise: z.custom<ExerciseDto>(),
});

/**
 * Main workout form schema exported for use with react-hook-form + zodResolver.
 */
export const workoutFormSchema = z.object({
  name: z.string().min(1, "Informe o nome do treino"),
  description: z.string().optional(),
  exercises: z.array(workoutExerciseSchema).min(1, "Adicione ao menos um exercício"),
});

/**
 * Inferred type for workout form values.
 * This is what useForm will use as its generic type.
 */
export type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

/**
 * Converts form values to CreateWorkoutDto for the API.
 * - Derives order from array index (exercises[i].order = i)
 * - Derives setNumber from array index (plannedSets[j].setNumber = j + 1, 1-based)
 * - Strips the _exercise field (display-only, not sent to API)
 * - Includes strategyId and order from function arguments
 */
export function toCreateWorkoutDto(
  values: WorkoutFormValues,
  strategyId: string,
  order: number,
): CreateWorkoutDto {
  return {
    strategyId,
    name: values.name,
    description: values.description,
    order,
    exercises: values.exercises.map((exercise, exerciseIndex) => ({
      exerciseId: exercise.exerciseId,
      order: exerciseIndex,
      restSeconds: exercise.restSeconds,
      notes: exercise.notes,
      plannedSets: exercise.plannedSets.map((set, setIndex) => ({
        targetReps: set.targetReps,
        targetKg: set.targetKg,
        setNumber: setIndex + 1, // 1-based indexing
      })),
    })),
  };
}

/**
 * Converts form values to UpdateWorkoutDto for the API.
 * Similar to toCreateWorkoutDto but without strategyId and order at the top level.
 * - Derives order from array index (exercises[i].order = i)
 * - Derives setNumber from array index (plannedSets[j].setNumber = j + 1, 1-based)
 * - Strips the _exercise field
 */
export function toUpdateWorkoutDto(values: WorkoutFormValues): UpdateWorkoutDto {
  return {
    name: values.name,
    description: values.description,
    exercises: values.exercises.map((exercise, exerciseIndex) => ({
      exerciseId: exercise.exerciseId,
      order: exerciseIndex,
      restSeconds: exercise.restSeconds,
      notes: exercise.notes,
      plannedSets: exercise.plannedSets.map((set, setIndex) => ({
        targetReps: set.targetReps,
        targetKg: set.targetKg,
        setNumber: setIndex + 1, // 1-based indexing
      })),
    })),
  };
}
