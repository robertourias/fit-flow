import { GetDashboardSummaryUseCase } from "../get-dashboard-summary.use-case";
import { WorkoutSession } from "../../../domain/workout-session.entity";
import { SessionExercise } from "../../../domain/session-exercise.entity";
import { ExecutedSet } from "../../../domain/executed-set.value-object";
import { WorkoutSessionStatus } from "../../../domain/workout-session-status.enum";
import { Exercise } from "../../../../catalog/domain/exercise.entity";
import { ExerciseCategory } from "../../../../catalog/domain/exercise-category.enum";
import type { IWorkoutSessionsRepository } from "../../../domain/repositories/workout-sessions.repository.interface";
import type { IWorkoutsRepository } from "../../../domain/repositories/workouts.repository.interface";
import type { IExercisesRepository } from "../../../../catalog/domain/repositories/exercises.repository.interface";

function makeExecutedSet(setNumber: number, kg?: number | null, reps?: number | null): ExecutedSet {
  return new ExecutedSet({
    id: `set-${setNumber}`,
    sessionExerciseId: "se-1",
    setNumber,
    kg: kg ?? null,
    reps: reps ?? null,
    completedAt: null,
  });
}

function makeSessionExercise(exerciseId: string, order: number, sets: ExecutedSet[]): SessionExercise {
  return new SessionExercise({
    id: `se-${exerciseId}-${order}`,
    sessionId: "session-1",
    exerciseId,
    order,
    notes: null,
    executedSets: sets,
  });
}

function makeSession(startedAt: Date, exercises: SessionExercise[]): WorkoutSession {
  return new WorkoutSession({
    id: "session-1",
    workoutId: "workout-1",
    workoutName: "Treino A",
    tenantId: "tenant-1",
    startedAt,
    endedAt: new Date(startedAt.getTime() + 3600000),
    status: WorkoutSessionStatus.FINISHED,
    comment: null,
    difficulty: null,
    createdAt: startedAt,
    exercises,
  });
}

function makeExercise(id: string, name: string, muscleGroups: Array<{ name: string; isPrimary: boolean }> = []): Exercise {
  return new Exercise({
    id,
    name,
    description: null,
    imageUrl: null,
    videoUrl: null,
    category: ExerciseCategory.STRENGTH,
    isArchived: false,
    tenantId: null,
    muscleGroups: muscleGroups.map((mg) => ({
      isPrimary: mg.isPrimary,
      muscleGroup: { id: `mg-${mg.name}`, name: mg.name, slug: mg.name.toLowerCase() },
    })),
    equipment: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function workoutSessionsRepo(): jest.Mocked<IWorkoutSessionsRepository> {
  return {
    findById: jest.fn(),
    findManyByTenant: jest.fn(),
    count: jest.fn(),
    countFinishedByStrategy: jest.fn(),
    findFinishedSince: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

function workoutsRepo(): jest.Mocked<IWorkoutsRepository> {
  return {
    findByStrategy: jest.fn(),
    findById: jest.fn(),
    countByTenant: jest.fn(),
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

describe("GetDashboardSummaryUseCase", () => {
  it("returns zeroed summary with no sessions", async () => {
    const sessions = workoutSessionsRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();

    sessions.findFinishedSince.mockResolvedValue([]);
    workouts.countByTenant.mockResolvedValue(3);

    const result = await new GetDashboardSummaryUseCase(sessions, workouts, exercises).execute("tenant-1");

    expect(result.diasEstaSemana).toBe(0);
    expect(result.treinosNoMes).toBe(0);
    expect(result.treinosNoMesDelta).toBe(0);
    expect(result.diasSequencia).toBe(0);
    expect(result.volumeSemanal).toBe(0);
    expect(result.volumeData).toHaveLength(7);
    expect(result.volumeData.every((v) => v.volume === 0)).toBe(true);
    expect(result.muscleGroups).toEqual([]);
    expect(result.trainDates).toEqual([]);
    expect(result.workoutsCount).toBe(3);
  });

  it("counts workout on same day", async () => {
    const sessions = workoutSessionsRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    const now = new Date();

    const today = makeSession(
      now,
      [makeSessionExercise("ex-1", 0, [makeExecutedSet(1, 60, 10)])],
    );

    sessions.findFinishedSince.mockResolvedValue([today]);
    workouts.countByTenant.mockResolvedValue(0);
    exercises.findById.mockResolvedValue(makeExercise("ex-1", "Supino", [{ name: "Peito", isPrimary: true }]));

    const result = await new GetDashboardSummaryUseCase(sessions, workouts, exercises).execute("tenant-1");

    expect(result.diasEstaSemana).toBe(1);
    expect(result.volumeSemanal).toBe(600); // 60 * 10
    expect(result.trainDates).toContain(now.getDate());
    expect(result.muscleGroups).toContainEqual({ nome: "Peito", percentual: 100 });
  });

  it("calculates streak of 3 consecutive days", async () => {
    const sessions = workoutSessionsRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    const now = new Date();

    const day0 = new Date(now);
    day0.setDate(day0.getDate() - 2);
    day0.setHours(0, 0, 0, 0);

    const day1 = new Date(day0);
    day1.setDate(day1.getDate() + 1);

    const day2 = new Date(day0);
    day2.setDate(day2.getDate() + 2);

    const s0 = makeSession(day0, []);
    const s1 = makeSession(day1, []);
    const s2 = makeSession(day2, []);

    sessions.findFinishedSince.mockResolvedValue([s0, s1, s2]);
    workouts.countByTenant.mockResolvedValue(0);

    const result = await new GetDashboardSummaryUseCase(sessions, workouts, exercises).execute("tenant-1");

    expect(result.diasSequencia).toBe(3);
  });

  it("breaks streak on gap of 1 day", async () => {
    const sessions = workoutSessionsRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    const now = new Date();

    const day0 = new Date(now);
    day0.setDate(day0.getDate() - 3);
    day0.setHours(0, 0, 0, 0);

    const day1 = new Date(day0);
    day1.setDate(day1.getDate() + 1);

    // gap of 1 day
    const day3 = new Date(day0);
    day3.setDate(day3.getDate() + 3);

    const s0 = makeSession(day0, []);
    const s1 = makeSession(day1, []);
    const s3 = makeSession(day3, []);

    sessions.findFinishedSince.mockResolvedValue([s0, s1, s3]);
    workouts.countByTenant.mockResolvedValue(0);

    const result = await new GetDashboardSummaryUseCase(sessions, workouts, exercises).execute("tenant-1");

    // streak should be 1 (only day3)
    expect(result.diasSequencia).toBe(1);
  });

  it("calculates treinosNoMesDelta with current and previous month sessions", async () => {
    const sessions = workoutSessionsRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();

    const now = new Date();
    const currentMonthDay = new Date(now.getFullYear(), now.getMonth(), 15);
    const prevMonthDay = new Date(now.getFullYear(), now.getMonth() - 1, 15);

    const s1 = makeSession(currentMonthDay, []);
    const s2 = makeSession(currentMonthDay, []);
    const s3 = makeSession(currentMonthDay, []);
    const s4 = makeSession(prevMonthDay, []);
    const s5 = makeSession(prevMonthDay, []);

    sessions.findFinishedSince.mockResolvedValue([s4, s5, s1, s2, s3]);
    workouts.countByTenant.mockResolvedValue(0);

    const result = await new GetDashboardSummaryUseCase(sessions, workouts, exercises).execute("tenant-1");

    expect(result.treinosNoMes).toBe(3);
    expect(result.treinosNoMesDelta).toBe(1); // 3 - 2
  });

  it("distributes volume across days of week", async () => {
    const sessions = workoutSessionsRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();

    // Monday (0 -> 1 after modulo shift)
    const monday = new Date();
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7)); // Set to start of week
    monday.setHours(0, 0, 0, 0);

    // Wednesday
    const wednesday = new Date(monday);
    wednesday.setDate(wednesday.getDate() + 2);

    const sMonday = makeSession(monday, [
      makeSessionExercise("ex-1", 0, [makeExecutedSet(1, 100, 10)]),
    ]);
    const sWednesday = makeSession(wednesday, [
      makeSessionExercise("ex-2", 0, [makeExecutedSet(1, 50, 5)]),
    ]);

    sessions.findFinishedSince.mockResolvedValue([sMonday, sWednesday]);
    workouts.countByTenant.mockResolvedValue(0);
    exercises.findById.mockResolvedValue(makeExercise("ex-1", "Ex1"));

    const result = await new GetDashboardSummaryUseCase(sessions, workouts, exercises).execute("tenant-1");

    const mondayVolume = result.volumeData[0].volume; // Seg
    const wednesdayVolume = result.volumeData[2].volume; // Qua
    expect(mondayVolume).toBe(1000); // 100 * 10
    expect(wednesdayVolume).toBe(250); // 50 * 5
  });

  it("handles exercises with multiple muscle groups (percentual > 100% sum)", async () => {
    const sessions = workoutSessionsRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();

    const now = new Date();
    const session = makeSession(
      now,
      [
        makeSessionExercise("ex-1", 0, [makeExecutedSet(1, 100, 5)]),
        makeSessionExercise("ex-2", 1, [makeExecutedSet(1, 80, 8)]),
      ],
    );

    sessions.findFinishedSince.mockResolvedValue([session]);
    workouts.countByTenant.mockResolvedValue(0);

    // ex-1 targets Chest and Shoulders (both primary)
    exercises.findById.mockImplementation((id) => {
      if (id === "ex-1") {
        return Promise.resolve(
          makeExercise("ex-1", "Supino", [
            { name: "Peito", isPrimary: true },
            { name: "Ombros", isPrimary: true },
          ]),
        );
      }
      // ex-2 targets Triceps only
      if (id === "ex-2") {
        return Promise.resolve(
          makeExercise("ex-2", "Tríceps", [{ name: "Tríceps", isPrimary: true }]),
        );
      }
      return Promise.resolve(null);
    });

    const result = await new GetDashboardSummaryUseCase(sessions, workouts, exercises).execute("tenant-1");

    expect(result.muscleGroups).toContainEqual({ nome: "Peito", percentual: 50 });
    expect(result.muscleGroups).toContainEqual({ nome: "Ombros", percentual: 50 });
    expect(result.muscleGroups).toContainEqual({ nome: "Tríceps", percentual: 50 });
    // sum = 150%, which is OK (distributed, not partitioned)
  });

  it("handles secondary muscle groups (filters out isPrimary: false)", async () => {
    const sessions = workoutSessionsRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();

    const now = new Date();
    const session = makeSession(
      now,
      [makeSessionExercise("ex-1", 0, [makeExecutedSet(1, 100, 5)])],
    );

    sessions.findFinishedSince.mockResolvedValue([session]);
    workouts.countByTenant.mockResolvedValue(0);

    exercises.findById.mockResolvedValue(
      makeExercise("ex-1", "Supino", [
        { name: "Peito", isPrimary: true },
        { name: "Tríceps", isPrimary: false },
      ]),
    );

    const result = await new GetDashboardSummaryUseCase(sessions, workouts, exercises).execute("tenant-1");

    expect(result.muscleGroups).toHaveLength(1);
    expect(result.muscleGroups[0]).toEqual({ nome: "Peito", percentual: 100 });
  });
});
