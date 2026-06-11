import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CreateWorkoutSessionUseCase } from "../create-workout-session.use-case";
import { ListWorkoutSessionsUseCase } from "../list-workout-sessions.use-case";
import { GetWorkoutSessionUseCase } from "../get-workout-session.use-case";
import { UpdateWorkoutSessionUseCase } from "../update-workout-session.use-case";
import { DeleteWorkoutSessionUseCase } from "../delete-workout-session.use-case";
import { WorkoutSession } from "../../../domain/workout-session.entity";
import { WorkoutSessionStatus } from "../../../domain/workout-session-status.enum";
import { Workout } from "../../../domain/workout.entity";
import { User } from "../../../../identity/domain/user.entity";
import { Plan } from "../../../../identity/domain/plan.enum";
import { Exercise } from "../../../../catalog/domain/exercise.entity";
import { ExerciseCategory } from "../../../../catalog/domain/exercise-category.enum";
import type { IWorkoutsRepository } from "../../../domain/repositories/workouts.repository.interface";
import type { IWorkoutSessionsRepository } from "../../../domain/repositories/workout-sessions.repository.interface";
import type { IUsersRepository } from "../../../../identity/domain/repositories/users.repository.interface";
import type { IExercisesRepository } from "../../../../catalog/domain/repositories/exercises.repository.interface";
import type { CreateWorkoutSessionDto } from "../../dto/workout-session.dto";

function makeSession(
  overrides: Partial<ConstructorParameters<typeof WorkoutSession>[0]> = {},
): WorkoutSession {
  return new WorkoutSession({
    id: "session-1",
    workoutId: "workout-1",
    tenantId: "tenant-1",
    startedAt: new Date("2026-06-01"),
    endedAt: null,
    comment: null,
    difficulty: null,
    status: WorkoutSessionStatus.ACTIVE,
    exercises: [],
    createdAt: new Date("2026-06-01"),
    ...overrides,
  });
}

function makeWorkout(): Workout {
  return new Workout({
    id: "workout-1",
    strategyId: "strategy-1",
    tenantId: "tenant-1",
    name: "A",
    description: null,
    order: 1,
    exercises: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeGlobalExercise(): Exercise {
  return new Exercise({
    id: "ex-1",
    name: "Supino",
    description: null,
    imageUrl: null,
    videoUrl: null,
    category: ExerciseCategory.STRENGTH,
    isArchived: false,
    tenantId: null,
    muscleGroups: [],
    equipment: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeUser(plan: Plan): User {
  return new User({
    id: "tenant-1",
    email: "u@test.com",
    name: "U",
    avatarUrl: null,
    bio: null,
    age: 30,
    goals: [],
    isTrainer: false,
    plan,
    hasOnboarded: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function sessionsRepo(): jest.Mocked<IWorkoutSessionsRepository> {
  return {
    findById: jest.fn(),
    findManyByTenant: jest.fn(),
    count: jest.fn(),
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

function usersRepo(): jest.Mocked<IUsersRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findManyDeletedBefore: jest.fn(),
    countWorkouts: jest.fn(),
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

const baseDto: CreateWorkoutSessionDto = {
  workoutId: "workout-1",
  startedAt: "2026-06-01T10:00:00.000Z",
  exercises: [
    {
      exerciseId: "ex-1",
      order: 1,
      executedSets: [{ setNumber: 1, kg: 60, reps: 10, completedAt: "2026-06-01T10:05:00.000Z" }],
    },
  ],
};

describe("CreateWorkoutSessionUseCase", () => {
  it("throws NotFound when workout belongs to another tenant", async () => {
    const sessions = sessionsRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    workouts.findById.mockResolvedValue(null);

    await expect(
      new CreateWorkoutSessionUseCase(sessions, workouts, exercises).execute("tenant-1", baseDto),
    ).rejects.toThrow(NotFoundException);
  });

  it("rejects invalid exerciseId with 400", async () => {
    const sessions = sessionsRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    workouts.findById.mockResolvedValue(makeWorkout());
    exercises.findById.mockResolvedValue(null);

    await expect(
      new CreateWorkoutSessionUseCase(sessions, workouts, exercises).execute("tenant-1", baseDto),
    ).rejects.toThrow(BadRequestException);
    expect(sessions.create).not.toHaveBeenCalled();
  });

  it("defaults status to ACTIVE when endedAt absent", async () => {
    const sessions = sessionsRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    workouts.findById.mockResolvedValue(makeWorkout());
    exercises.findById.mockResolvedValue(makeGlobalExercise());
    sessions.create.mockResolvedValue(makeSession());

    await new CreateWorkoutSessionUseCase(sessions, workouts, exercises).execute("tenant-1", baseDto);

    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: WorkoutSessionStatus.ACTIVE, endedAt: null }),
    );
  });

  it("defaults status to FINISHED when endedAt present", async () => {
    const sessions = sessionsRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    workouts.findById.mockResolvedValue(makeWorkout());
    exercises.findById.mockResolvedValue(makeGlobalExercise());
    sessions.create.mockResolvedValue(makeSession());

    await new CreateWorkoutSessionUseCase(sessions, workouts, exercises).execute("tenant-1", {
      ...baseDto,
      endedAt: "2026-06-01T11:00:00.000Z",
    });

    expect(sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: WorkoutSessionStatus.FINISHED }),
    );
  });
});

describe("ListWorkoutSessionsUseCase", () => {
  it("applies 60-day retention filter for FREE plan", async () => {
    const sessions = sessionsRepo();
    const users = usersRepo();
    users.findById.mockResolvedValue(makeUser(Plan.FREE));
    sessions.findManyByTenant.mockResolvedValue([]);
    sessions.count.mockResolvedValue(0);

    await new ListWorkoutSessionsUseCase(sessions, users).execute("tenant-1", { limit: 20 });

    const arg = sessions.findManyByTenant.mock.calls[0]![0];
    expect(arg.startedAfter).toBeInstanceOf(Date);
    // ~60 dias atrás
    const daysAgo = (Date.now() - arg.startedAfter!.getTime()) / (24 * 60 * 60 * 1000);
    expect(Math.round(daysAgo)).toBe(60);
  });

  it("does not filter for PRO plan", async () => {
    const sessions = sessionsRepo();
    const users = usersRepo();
    users.findById.mockResolvedValue(makeUser(Plan.PRO));
    sessions.findManyByTenant.mockResolvedValue([]);
    sessions.count.mockResolvedValue(0);

    await new ListWorkoutSessionsUseCase(sessions, users).execute("tenant-1", { limit: 20 });

    expect(sessions.findManyByTenant.mock.calls[0]![0].startedAfter).toBeUndefined();
  });
});

describe("GetWorkoutSessionUseCase", () => {
  it("throws NotFound for another tenant", async () => {
    const sessions = sessionsRepo();
    sessions.findById.mockResolvedValue(null);

    await expect(
      new GetWorkoutSessionUseCase(sessions).execute("session-1", "tenant-1"),
    ).rejects.toThrow(NotFoundException);
  });
});

describe("UpdateWorkoutSessionUseCase", () => {
  it("throws NotFound when repo returns null", async () => {
    const sessions = sessionsRepo();
    const exercises = exercisesRepo();
    sessions.update.mockResolvedValue(null);

    await expect(
      new UpdateWorkoutSessionUseCase(sessions, exercises).execute("session-1", "tenant-1", {
        comment: "x",
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("validates exerciseIds before update when exercises provided", async () => {
    const sessions = sessionsRepo();
    const exercises = exercisesRepo();
    exercises.findById.mockResolvedValue(null);

    await expect(
      new UpdateWorkoutSessionUseCase(sessions, exercises).execute("session-1", "tenant-1", {
        exercises: baseDto.exercises,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(sessions.update).not.toHaveBeenCalled();
  });
});

describe("DeleteWorkoutSessionUseCase", () => {
  it("throws NotFound for another tenant without deleting", async () => {
    const sessions = sessionsRepo();
    sessions.findById.mockResolvedValue(null);

    await expect(
      new DeleteWorkoutSessionUseCase(sessions).execute("session-1", "tenant-1"),
    ).rejects.toThrow(NotFoundException);
    expect(sessions.delete).not.toHaveBeenCalled();
  });

  it("deletes the tenant's session", async () => {
    const sessions = sessionsRepo();
    sessions.findById.mockResolvedValue(makeSession());

    await new DeleteWorkoutSessionUseCase(sessions).execute("session-1", "tenant-1");

    expect(sessions.delete).toHaveBeenCalledWith("session-1", "tenant-1");
  });
});
