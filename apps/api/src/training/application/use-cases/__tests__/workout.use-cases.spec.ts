import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { CreateWorkoutUseCase } from "../create-workout.use-case";
import { GetWorkoutUseCase } from "../get-workout.use-case";
import { UpdateWorkoutUseCase } from "../update-workout.use-case";
import { DeleteWorkoutUseCase } from "../delete-workout.use-case";
import { Workout } from "../../../domain/workout.entity";
import { Strategy } from "../../../domain/strategy.entity";
import { Exercise } from "../../../../catalog/domain/exercise.entity";
import { ExerciseCategory } from "../../../../catalog/domain/exercise-category.enum";
import type { IStrategiesRepository } from "../../../domain/repositories/strategies.repository.interface";
import type { IWorkoutsRepository } from "../../../domain/repositories/workouts.repository.interface";
import type { IExercisesRepository } from "../../../../catalog/domain/repositories/exercises.repository.interface";
import type { CreateWorkoutDto } from "../../dto/workout.dto";

function makeWorkout(): Workout {
  return new Workout({
    id: "workout-1",
    strategyId: "strategy-1",
    tenantId: "tenant-1",
    name: "Treino A",
    description: null,
    order: 1,
    exercises: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

function makeStrategy(): Strategy {
  return new Strategy({
    id: "strategy-1",
    tenantId: "tenant-1",
    name: "ABC",
    type: null,
    description: null,
    isActive: true,
    workouts: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

function makeExercise(tenantId: string | null): Exercise {
  return new Exercise({
    id: "ex-1",
    name: "Supino",
    description: null,
    imageUrl: null,
    videoUrl: null,
    category: ExerciseCategory.STRENGTH,
    isArchived: false,
    tenantId,
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

const validDto: CreateWorkoutDto = {
  strategyId: "strategy-1",
  name: "Treino A",
  order: 1,
  exercises: [
    {
      exerciseId: "ex-1",
      order: 1,
      restSeconds: 90,
      plannedSets: [{ setNumber: 1, targetReps: "8-12", targetKg: "60" }],
    },
  ],
};

describe("CreateWorkoutUseCase", () => {
  it("throws NotFound when strategy belongs to another tenant", async () => {
    const strategies = strategiesRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    strategies.findById.mockResolvedValue(null);

    await expect(
      new CreateWorkoutUseCase(strategies, workouts, exercises).execute("tenant-1", validDto),
    ).rejects.toThrow(NotFoundException);
  });

  it("throws 422 PLAN_LIMIT_EXCEEDED at the 7th workout", async () => {
    const strategies = strategiesRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    strategies.findById.mockResolvedValue(makeStrategy());
    workouts.countByTenant.mockResolvedValue(6);

    await expect(
      new CreateWorkoutUseCase(strategies, workouts, exercises).execute("tenant-1", validDto),
    ).rejects.toThrow(UnprocessableEntityException);
    expect(workouts.create).not.toHaveBeenCalled();
  });

  it("throws 400 when an exerciseId is invalid", async () => {
    const strategies = strategiesRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    strategies.findById.mockResolvedValue(makeStrategy());
    workouts.countByTenant.mockResolvedValue(0);
    exercises.findById.mockResolvedValue(null);

    await expect(
      new CreateWorkoutUseCase(strategies, workouts, exercises).execute("tenant-1", validDto),
    ).rejects.toThrow(BadRequestException);
    expect(workouts.create).not.toHaveBeenCalled();
  });

  it("rejects an exercise owned by another tenant", async () => {
    const strategies = strategiesRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    strategies.findById.mockResolvedValue(makeStrategy());
    workouts.countByTenant.mockResolvedValue(0);
    exercises.findById.mockResolvedValue(makeExercise("other-tenant"));

    await expect(
      new CreateWorkoutUseCase(strategies, workouts, exercises).execute("tenant-1", validDto),
    ).rejects.toThrow(BadRequestException);
  });

  it("creates the workout with a valid global exercise", async () => {
    const strategies = strategiesRepo();
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    strategies.findById.mockResolvedValue(makeStrategy());
    workouts.countByTenant.mockResolvedValue(0);
    exercises.findById.mockResolvedValue(makeExercise(null));
    workouts.create.mockResolvedValue(makeWorkout());

    await new CreateWorkoutUseCase(strategies, workouts, exercises).execute("tenant-1", validDto);

    expect(workouts.create).toHaveBeenCalledWith(
      expect.objectContaining({ strategyId: "strategy-1", tenantId: "tenant-1" }),
    );
  });
});

describe("GetWorkoutUseCase", () => {
  it("throws NotFound for another tenant's workout", async () => {
    const workouts = workoutsRepo();
    workouts.findById.mockResolvedValue(null);

    await expect(new GetWorkoutUseCase(workouts).execute("workout-1", "tenant-1")).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe("UpdateWorkoutUseCase", () => {
  it("validates exerciseIds before updating", async () => {
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    exercises.findById.mockResolvedValue(null);

    await expect(
      new UpdateWorkoutUseCase(workouts, exercises).execute("workout-1", "tenant-1", {
        exercises: validDto.exercises,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(workouts.update).not.toHaveBeenCalled();
  });

  it("throws NotFound when repo returns null", async () => {
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    workouts.update.mockResolvedValue(null);

    await expect(
      new UpdateWorkoutUseCase(workouts, exercises).execute("workout-1", "tenant-1", {
        name: "Novo",
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it("updates name without touching exercises validation", async () => {
    const workouts = workoutsRepo();
    const exercises = exercisesRepo();
    workouts.update.mockResolvedValue(makeWorkout());

    await new UpdateWorkoutUseCase(workouts, exercises).execute("workout-1", "tenant-1", {
      name: "Novo",
    });

    expect(exercises.findById).not.toHaveBeenCalled();
    expect(workouts.update).toHaveBeenCalledWith("workout-1", "tenant-1", { name: "Novo" });
  });
});

describe("DeleteWorkoutUseCase", () => {
  it("throws NotFound for another tenant's workout", async () => {
    const workouts = workoutsRepo();
    workouts.findById.mockResolvedValue(null);

    await expect(
      new DeleteWorkoutUseCase(workouts).execute("workout-1", "tenant-1"),
    ).rejects.toThrow(NotFoundException);
    expect(workouts.delete).not.toHaveBeenCalled();
  });

  it("deletes the tenant's workout", async () => {
    const workouts = workoutsRepo();
    workouts.findById.mockResolvedValue(makeWorkout());

    await new DeleteWorkoutUseCase(workouts).execute("workout-1", "tenant-1");

    expect(workouts.delete).toHaveBeenCalledWith("workout-1", "tenant-1");
  });
});
