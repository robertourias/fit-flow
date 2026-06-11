import { GetActiveWorkoutUseCase } from "../get-active-workout.use-case";
import { Strategy } from "../../../domain/strategy.entity";
import { Workout } from "../../../domain/workout.entity";
import { WorkoutExercise } from "../../../domain/workout-exercise.entity";
import { Exercise } from "../../../../catalog/domain/exercise.entity";
import { ExerciseCategory } from "../../../../catalog/domain/exercise-category.enum";
import type { IStrategiesRepository } from "../../../domain/repositories/strategies.repository.interface";
import type { IWorkoutSessionsRepository } from "../../../domain/repositories/workout-sessions.repository.interface";
import type { IExercisesRepository } from "../../../../catalog/domain/repositories/exercises.repository.interface";

function makeWorkoutExercise(exerciseId: string, order: number): WorkoutExercise {
  return new WorkoutExercise({
    id: `we-${exerciseId}-${order}`,
    workoutId: "workout",
    exerciseId,
    order,
    restSeconds: 90,
    notes: null,
    plannedSets: [],
  });
}

function makeWorkout(id: string, order: number, exerciseIds: string[]): Workout {
  return new Workout({
    id,
    strategyId: "strategy-1",
    tenantId: "tenant-1",
    name: `Treino ${id}`,
    description: null,
    order,
    exercises: exerciseIds.map((exId, i) => makeWorkoutExercise(exId, i)),
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

function makeStrategy(workouts: Workout[]): Strategy {
  return new Strategy({
    id: "strategy-1",
    tenantId: "tenant-1",
    name: "ABC",
    type: "ABC",
    description: null,
    isActive: true,
    workouts,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

function makeExercise(id: string, name: string): Exercise {
  return new Exercise({
    id,
    name,
    description: null,
    imageUrl: null,
    videoUrl: null,
    category: ExerciseCategory.STRENGTH,
    isArchived: false,
    tenantId: null,
    muscleGroups: [],
    equipment: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

function strategiesRepo(): jest.Mocked<IStrategiesRepository> {
  return {
    findByTenant: jest.fn(),
    findById: jest.fn(),
    findActiveByTenant: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

function workoutSessionsRepo(): jest.Mocked<IWorkoutSessionsRepository> {
  return {
    findById: jest.fn(),
    findManyByTenant: jest.fn(),
    count: jest.fn(),
    countFinishedByStrategy: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

function exercisesRepo(): jest.Mocked<IExercisesRepository> {
  return {
    findMany: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
  };
}

describe("GetActiveWorkoutUseCase", () => {
  it("returns null when there is no active strategy", async () => {
    const strategies = strategiesRepo();
    const sessions = workoutSessionsRepo();
    const exercises = exercisesRepo();
    strategies.findActiveByTenant.mockResolvedValue(null);

    const result = await new GetActiveWorkoutUseCase(strategies, sessions, exercises).execute(
      "tenant-1",
    );

    expect(result).toBeNull();
  });

  it("returns null when the active strategy has no workouts", async () => {
    const strategies = strategiesRepo();
    const sessions = workoutSessionsRepo();
    const exercises = exercisesRepo();
    strategies.findActiveByTenant.mockResolvedValue(makeStrategy([]));

    const result = await new GetActiveWorkoutUseCase(strategies, sessions, exercises).execute(
      "tenant-1",
    );

    expect(result).toBeNull();
  });

  it("picks workout 0 when there are no finished sessions yet", async () => {
    const strategies = strategiesRepo();
    const sessions = workoutSessionsRepo();
    const exercises = exercisesRepo();
    const workouts = [
      makeWorkout("w0", 0, ["ex-1"]),
      makeWorkout("w1", 1, ["ex-2"]),
      makeWorkout("w2", 2, []),
    ];
    strategies.findActiveByTenant.mockResolvedValue(makeStrategy(workouts));
    sessions.countFinishedByStrategy.mockResolvedValue(0);
    exercises.findById.mockResolvedValue(makeExercise("ex-1", "Supino"));

    const result = await new GetActiveWorkoutUseCase(strategies, sessions, exercises).execute(
      "tenant-1",
    );

    expect(result!.workout).toEqual({ id: "w0", nome: "Treino w0", exercicios: ["Supino"], order: 0 });
    expect(result!.proximos).toEqual([
      { id: "w1", nome: "Treino w1", numExercicios: 1, order: 1 },
      { id: "w2", nome: "Treino w2", numExercicios: 0, order: 2 },
    ]);
    expect(result!.estrategiaNome).toBe("ABC");
  });

  it("rotates to workout 1 after one finished session", async () => {
    const strategies = strategiesRepo();
    const sessions = workoutSessionsRepo();
    const exercises = exercisesRepo();
    const workouts = [makeWorkout("w0", 0, []), makeWorkout("w1", 1, []), makeWorkout("w2", 2, [])];
    strategies.findActiveByTenant.mockResolvedValue(makeStrategy(workouts));
    sessions.countFinishedByStrategy.mockResolvedValue(1);

    const result = await new GetActiveWorkoutUseCase(strategies, sessions, exercises).execute(
      "tenant-1",
    );

    expect(result!.workout.id).toBe("w1");
    expect(result!.proximos.map((p) => p.id)).toEqual(["w2", "w0"]);
  });

  it("wraps around when total finished sessions exceeds workouts length", async () => {
    const strategies = strategiesRepo();
    const sessions = workoutSessionsRepo();
    const exercises = exercisesRepo();
    const workouts = [makeWorkout("w0", 0, []), makeWorkout("w1", 1, []), makeWorkout("w2", 2, [])];
    strategies.findActiveByTenant.mockResolvedValue(makeStrategy(workouts));
    sessions.countFinishedByStrategy.mockResolvedValue(4); // 4 % 3 === 1

    const result = await new GetActiveWorkoutUseCase(strategies, sessions, exercises).execute(
      "tenant-1",
    );

    expect(result!.workout.id).toBe("w1");
  });

  it("returns empty proximos when the strategy has a single workout", async () => {
    const strategies = strategiesRepo();
    const sessions = workoutSessionsRepo();
    const exercises = exercisesRepo();
    strategies.findActiveByTenant.mockResolvedValue(makeStrategy([makeWorkout("w0", 0, [])]));
    sessions.countFinishedByStrategy.mockResolvedValue(0);

    const result = await new GetActiveWorkoutUseCase(strategies, sessions, exercises).execute(
      "tenant-1",
    );

    expect(result!.workout.id).toBe("w0");
    expect(result!.proximos).toEqual([]);
  });

  it("falls back to a placeholder name when an exercise can't be resolved", async () => {
    const strategies = strategiesRepo();
    const sessions = workoutSessionsRepo();
    const exercises = exercisesRepo();
    strategies.findActiveByTenant.mockResolvedValue(makeStrategy([makeWorkout("w0", 0, ["ghost"])]));
    sessions.countFinishedByStrategy.mockResolvedValue(0);
    exercises.findById.mockResolvedValue(null);

    const result = await new GetActiveWorkoutUseCase(strategies, sessions, exercises).execute(
      "tenant-1",
    );

    expect(result!.workout.exercicios).toEqual(["Exercício"]);
  });
});
