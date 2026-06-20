import { NotFoundException } from "@nestjs/common";
import { CreateStudentWorkoutUseCase } from "../create-student-workout.use-case";
import { CreateWorkoutUseCase } from "../../../../training/application/use-cases/create-workout.use-case";
import { Workout } from "../../../../training/domain/workout.entity";
import type { ITrainerStudentRelationshipRepository } from "../../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import type { CreateWorkoutDto } from "../../../../training/application/dto/workout.dto";

function makeWorkout(overrides: Partial<{ id: string; tenantId: string | null }> = {}): Workout {
  return new Workout({
    id: "workout-1",
    strategyId: "strategy-1",
    tenantId: "student-1",
    name: "Treino A",
    description: null,
    order: 0,
    exercises: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  });
}

function makeRelationshipRepo(): jest.Mocked<ITrainerStudentRelationshipRepository> {
  return {
    findById: jest.fn(),
    findByTrainerAndStudent: jest.fn(),
    findByStudent: jest.fn(),
    findByTrainer: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    trainerHasAccessToStudent: jest.fn(),
  };
}

function makeCreateWorkoutUseCase(): jest.Mocked<CreateWorkoutUseCase> {
  return {
    execute: jest.fn(),
  } as unknown as jest.Mocked<CreateWorkoutUseCase>;
}

describe("CreateStudentWorkoutUseCase", () => {
  const dto: CreateWorkoutDto = {
    strategyId: "strategy-1",
    name: "Treino A",
    order: 0,
    exercises: [],
  };

  it("throws NotFound when trainer has no active relationship with student (FR-008)", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const createWorkout = makeCreateWorkoutUseCase();
    relationshipRepo.trainerHasAccessToStudent.mockResolvedValue(false);

    const useCase = new CreateStudentWorkoutUseCase(relationshipRepo, createWorkout);

    await expect(useCase.execute("trainer-1", "student-1", dto)).rejects.toThrow(
      NotFoundException,
    );
    expect(createWorkout.execute).not.toHaveBeenCalled();
  });

  it("delegates to CreateWorkoutUseCase using studentId as tenantId when access is granted (FR-009)", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const createWorkout = makeCreateWorkoutUseCase();
    relationshipRepo.trainerHasAccessToStudent.mockResolvedValue(true);
    createWorkout.execute.mockResolvedValue(makeWorkout());

    const useCase = new CreateStudentWorkoutUseCase(relationshipRepo, createWorkout);
    const result = await useCase.execute("trainer-1", "student-1", dto);

    expect(relationshipRepo.trainerHasAccessToStudent).toHaveBeenCalledWith(
      "trainer-1",
      "student-1",
    );
    expect(createWorkout.execute).toHaveBeenCalledWith("student-1", dto);
    expect(result.tenantId).toBe("student-1");
  });

  it("propagates plan limit exception from CreateWorkoutUseCase (FREE plan limit applies to student)", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const createWorkout = makeCreateWorkoutUseCase();
    relationshipRepo.trainerHasAccessToStudent.mockResolvedValue(true);
    const planLimitError = new Error("plan limit exceeded");
    createWorkout.execute.mockRejectedValue(planLimitError);

    const useCase = new CreateStudentWorkoutUseCase(relationshipRepo, createWorkout);

    await expect(useCase.execute("trainer-1", "student-1", dto)).rejects.toThrow(
      planLimitError,
    );
  });
});
