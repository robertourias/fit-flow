import { ListMyTrainersUseCase } from "../list-my-trainers.use-case";
import { TrainerStudentRelationship } from "../../../../identity/domain/trainer-student-relationship.entity";
import { RelationshipStatus } from "../../../../identity/domain/relationship-status.enum";
import { RelationshipInitiator } from "../../../../identity/domain/relationship-initiator.enum";
import { User } from "../../../../identity/domain/user.entity";
import { Plan } from "../../../../identity/domain/plan.enum";
import type { ITrainerStudentRelationshipRepository } from "../../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import type { IUsersRepository } from "../../../../identity/domain/repositories/users.repository.interface";

function makeRelationship(
  overrides: Partial<ConstructorParameters<typeof TrainerStudentRelationship>[0]> = {},
): TrainerStudentRelationship {
  return new TrainerStudentRelationship({
    id: "rel-1",
    trainerId: "trainer-1",
    studentId: "student-1",
    status: RelationshipStatus.ACTIVE,
    initiatedBy: RelationshipInitiator.TRAINER,
    startedAt: new Date("2026-01-01"),
    endedAt: null,
    ...overrides,
  });
}

function makeUser(overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User {
  return new User({
    id: "user-1",
    email: "user@test.com",
    name: "User",
    avatarUrl: null,
    bio: null,
    age: 30,
    goals: [],
    isTrainer: false,
    plan: Plan.FREE,
    hasOnboarded: true,
    deletedAt: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  });
}

function makeUsersRepo(): jest.Mocked<IUsersRepository> {
  return {
    findById: jest.fn().mockResolvedValue(makeUser()),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findManyDeletedBefore: jest.fn(),
    countWorkouts: jest.fn(),
  };
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

describe("ListMyTrainersUseCase", () => {
  it("lists relationships where current user is the student", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const usersRepo = makeUsersRepo();
    relationshipRepo.findByStudent.mockResolvedValue([makeRelationship()]);

    const useCase = new ListMyTrainersUseCase(relationshipRepo, usersRepo);
    const result = await useCase.execute("student-1");

    expect(relationshipRepo.findByStudent).toHaveBeenCalledWith("student-1", undefined);
    expect(result).toHaveLength(1);
  });

  it("passes the status filter through to the repository", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const usersRepo = makeUsersRepo();
    relationshipRepo.findByStudent.mockResolvedValue([
      makeRelationship({ status: RelationshipStatus.PENDING }),
    ]);

    const useCase = new ListMyTrainersUseCase(relationshipRepo, usersRepo);
    await useCase.execute("student-1", RelationshipStatus.PENDING);

    expect(relationshipRepo.findByStudent).toHaveBeenCalledWith(
      "student-1",
      RelationshipStatus.PENDING,
    );
  });

  // FR-011: sem filtro, retorna todos exceto REVOKED
  it("filters out REVOKED relationships when no status filter is provided", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const usersRepo = makeUsersRepo();
    relationshipRepo.findByStudent.mockResolvedValue([
      makeRelationship({ id: "rel-1", status: RelationshipStatus.ACTIVE }),
      makeRelationship({ id: "rel-2", status: RelationshipStatus.PENDING }),
      makeRelationship({ id: "rel-3", status: RelationshipStatus.REVOKED }),
    ]);

    const useCase = new ListMyTrainersUseCase(relationshipRepo, usersRepo);
    const result = await useCase.execute("student-1");

    expect(result.map((r) => r.id)).toEqual(["rel-1", "rel-2"]);
  });

  it("includes REVOKED relationships when explicitly filtered", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const usersRepo = makeUsersRepo();
    relationshipRepo.findByStudent.mockResolvedValue([
      makeRelationship({ id: "rel-3", status: RelationshipStatus.REVOKED }),
    ]);

    const useCase = new ListMyTrainersUseCase(relationshipRepo, usersRepo);
    const result = await useCase.execute("student-1", RelationshipStatus.REVOKED);

    expect(result.map((r) => r.id)).toEqual(["rel-3"]);
  });
});
