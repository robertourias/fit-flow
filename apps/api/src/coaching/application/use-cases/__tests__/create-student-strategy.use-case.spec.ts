import { NotFoundException } from "@nestjs/common";
import { CreateStudentStrategyUseCase } from "../create-student-strategy.use-case";
import { CreateStrategyUseCase } from "../../../../training/application/use-cases/create-strategy.use-case";
import { Strategy } from "../../../../training/domain/strategy.entity";
import type { ITrainerStudentRelationshipRepository } from "../../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import type { CreateStrategyDto } from "../../../../training/application/dto/strategy.dto";

function makeStrategy(overrides: Partial<{ id: string; tenantId: string | null }> = {}): Strategy {
  return new Strategy({
    id: "strategy-1",
    tenantId: "student-1",
    name: "Hipertrofia",
    type: null,
    description: null,
    isActive: true,
    workouts: [],
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

function makeCreateStrategyUseCase(): jest.Mocked<CreateStrategyUseCase> {
  return {
    execute: jest.fn(),
  } as unknown as jest.Mocked<CreateStrategyUseCase>;
}

describe("CreateStudentStrategyUseCase", () => {
  const dto: CreateStrategyDto = { name: "Hipertrofia" };

  it("throws NotFound when trainer has no active relationship with student (FR-008)", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const createStrategy = makeCreateStrategyUseCase();
    relationshipRepo.trainerHasAccessToStudent.mockResolvedValue(false);

    const useCase = new CreateStudentStrategyUseCase(relationshipRepo, createStrategy);

    await expect(useCase.execute("trainer-1", "student-1", dto)).rejects.toThrow(
      NotFoundException,
    );
    expect(createStrategy.execute).not.toHaveBeenCalled();
  });

  it("delegates to CreateStrategyUseCase using studentId as tenantId when access is granted (FR-009)", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const createStrategy = makeCreateStrategyUseCase();
    relationshipRepo.trainerHasAccessToStudent.mockResolvedValue(true);
    createStrategy.execute.mockResolvedValue(makeStrategy());

    const useCase = new CreateStudentStrategyUseCase(relationshipRepo, createStrategy);
    const result = await useCase.execute("trainer-1", "student-1", dto);

    expect(relationshipRepo.trainerHasAccessToStudent).toHaveBeenCalledWith(
      "trainer-1",
      "student-1",
    );
    expect(createStrategy.execute).toHaveBeenCalledWith("student-1", dto);
    expect(result.tenantId).toBe("student-1");
  });
});
