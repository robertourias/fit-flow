import { toCreateWorkoutSessionDto } from "../workout-session.mapper";
import type { WorkoutDetailDto, WorkoutExerciseDto } from "@fitflow/types";
import type { ExecutedExercise } from "@/lib/stores/workout-session.store";

/**
 * Helper to build a minimal WorkoutExerciseDto for testing.
 */
function createWorkoutExercise(overrides: Partial<WorkoutExerciseDto> = {}): WorkoutExerciseDto {
  return {
    id: "we-1",
    exerciseId: "ex-1",
    order: 0,
    restSeconds: 90,
    notes: null,
    plannedSets: [],
    ...overrides,
  };
}

/**
 * Helper to build a minimal WorkoutDetailDto for testing.
 */
function createWorkout(exercises: WorkoutExerciseDto[]): WorkoutDetailDto {
  return {
    id: "workout-1",
    strategyId: "strategy-1",
    name: "Treino A",
    description: null,
    order: 0,
    exercises,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  };
}

/**
 * Helper to build a minimal ExecutedExercise for testing.
 */
function createExecutedExercise(overrides: Partial<ExecutedExercise> = {}): ExecutedExercise {
  return {
    exerciseId: "ex-1",
    notes: "",
    sets: [],
    ...overrides,
  };
}

describe("toCreateWorkoutSessionDto", () => {
  it("passes through workoutId/startedAt/endedAt correctly", () => {
    const workout = createWorkout([createWorkoutExercise()]);
    const session = {
      startedAt: "2026-06-15T10:00:00.000Z",
      exercises: [createExecutedExercise()],
    };
    const extras = { endedAt: "2026-06-15T11:00:00.000Z" };

    const dto = toCreateWorkoutSessionDto(workout, session, extras);

    expect(dto.workoutId).toBe("workout-1");
    expect(dto.startedAt).toBe("2026-06-15T10:00:00.000Z");
    expect(dto.endedAt).toBe("2026-06-15T11:00:00.000Z");
    expect(dto.status).toBeUndefined();
  });

  it("excludes sets without completedAt from executedSets", () => {
    const workout = createWorkout([createWorkoutExercise()]);
    const session = {
      startedAt: "2026-06-15T10:00:00.000Z",
      exercises: [
        createExecutedExercise({
          sets: [
            { setNumber: 1, kg: 100, reps: 10, completedAt: "2026-06-15T10:05:00.000Z" },
            { setNumber: 2, kg: 100, reps: 8 }, // not completed
          ],
        }),
      ],
    };
    const extras = { endedAt: "2026-06-15T11:00:00.000Z" };

    const dto = toCreateWorkoutSessionDto(workout, session, extras);

    expect(dto.exercises[0].executedSets).toEqual([
      { setNumber: 1, kg: 100, reps: 10, completedAt: "2026-06-15T10:05:00.000Z" },
    ]);
  });

  it("returns executedSets: [] for an exercise with zero completed sets (all skipped)", () => {
    const workout = createWorkout([createWorkoutExercise()]);
    const session = {
      startedAt: "2026-06-15T10:00:00.000Z",
      exercises: [
        createExecutedExercise({
          sets: [
            { setNumber: 1, kg: 100, reps: 10 },
            { setNumber: 2, kg: 100, reps: 8 },
          ],
        }),
      ],
    };
    const extras = { endedAt: "2026-06-15T11:00:00.000Z" };

    const dto = toCreateWorkoutSessionDto(workout, session, extras);

    expect(dto.exercises[0].executedSets).toEqual([]);
  });

  it("omits empty notes, comment, and difficulty: 0 from the resulting DTO", () => {
    const workout = createWorkout([createWorkoutExercise()]);
    const session = {
      startedAt: "2026-06-15T10:00:00.000Z",
      exercises: [createExecutedExercise({ notes: "" })],
    };
    const extras = { endedAt: "2026-06-15T11:00:00.000Z", comment: "", difficulty: 0 };

    const dto = toCreateWorkoutSessionDto(workout, session, extras);

    expect(dto.exercises[0].notes).toBeUndefined();
    expect(dto.comment).toBeUndefined();
    expect(dto.difficulty).toBeUndefined();
  });

  it("includes non-empty notes, comment, and a positive difficulty", () => {
    const workout = createWorkout([createWorkoutExercise()]);
    const session = {
      startedAt: "2026-06-15T10:00:00.000Z",
      exercises: [createExecutedExercise({ notes: "Felt strong" })],
    };
    const extras = { endedAt: "2026-06-15T11:00:00.000Z", comment: "Great session", difficulty: 4 };

    const dto = toCreateWorkoutSessionDto(workout, session, extras);

    expect(dto.exercises[0].notes).toBe("Felt strong");
    expect(dto.comment).toBe("Great session");
    expect(dto.difficulty).toBe(4);
  });

  it("maps order/exerciseId from workout.exercises[i] by index, sorting defensively when out of order", () => {
    const workout = createWorkout([
      createWorkoutExercise({ id: "we-2", exerciseId: "ex-2", order: 1 }),
      createWorkoutExercise({ id: "we-1", exerciseId: "ex-1", order: 0 }),
    ]);
    const session = {
      startedAt: "2026-06-15T10:00:00.000Z",
      exercises: [
        createExecutedExercise({ exerciseId: "ex-1", notes: "first exercise notes" }),
        createExecutedExercise({ exerciseId: "ex-2", notes: "second exercise notes" }),
      ],
    };
    const extras = { endedAt: "2026-06-15T11:00:00.000Z" };

    const dto = toCreateWorkoutSessionDto(workout, session, extras);

    // After sorting workout.exercises by `order` ascending: ex-1 (order 0) comes first,
    // ex-2 (order 1) comes second — paired by index with session.exercises[0] and [1].
    expect(dto.exercises).toHaveLength(2);
    expect(dto.exercises[0]).toMatchObject({
      exerciseId: "ex-1",
      order: 0,
      notes: "first exercise notes",
    });
    expect(dto.exercises[1]).toMatchObject({
      exerciseId: "ex-2",
      order: 1,
      notes: "second exercise notes",
    });
  });

  it("does not mutate the original workout.exercises array", () => {
    const exercises = [
      createWorkoutExercise({ id: "we-2", exerciseId: "ex-2", order: 1 }),
      createWorkoutExercise({ id: "we-1", exerciseId: "ex-1", order: 0 }),
    ];
    const workout = createWorkout(exercises);
    const session = {
      startedAt: "2026-06-15T10:00:00.000Z",
      exercises: [createExecutedExercise({ exerciseId: "ex-2" }), createExecutedExercise({ exerciseId: "ex-1" })],
    };
    const extras = { endedAt: "2026-06-15T11:00:00.000Z" };

    toCreateWorkoutSessionDto(workout, session, extras);

    expect(workout.exercises[0].exerciseId).toBe("ex-2");
    expect(workout.exercises[1].exerciseId).toBe("ex-1");
  });

  it("includes kg/reps/setNumber/completedAt for completed sets", () => {
    const workout = createWorkout([createWorkoutExercise()]);
    const session = {
      startedAt: "2026-06-15T10:00:00.000Z",
      exercises: [
        createExecutedExercise({
          sets: [{ setNumber: 1, kg: 60, reps: 12, completedAt: "2026-06-15T10:02:00.000Z" }],
        }),
      ],
    };
    const extras = { endedAt: "2026-06-15T11:00:00.000Z" };

    const dto = toCreateWorkoutSessionDto(workout, session, extras);

    expect(dto.exercises[0].executedSets).toEqual([
      { setNumber: 1, kg: 60, reps: 12, completedAt: "2026-06-15T10:02:00.000Z" },
    ]);
  });
});
