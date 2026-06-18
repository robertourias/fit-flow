import { ConflictException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { RespondRelationshipUseCase } from "../respond-relationship.use-case";
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
    status: RelationshipStatus.PENDING,
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

describe("RespondRelationshipUseCase", () => {
  it("ACCEPT by the invited side (student) moves status to ACTIVE", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const usersRepo = makeUsersRepo();
    relationshipRepo.findById.mockResolvedValue(
      makeRelationship({ initiatedBy: RelationshipInitiator.TRAINER }),
    );
    relationshipRepo.updateStatus.mockResolvedValue(
      makeRelationship({ status: RelationshipStatus.ACTIVE }),
    );

    const useCase = new RespondRelationshipUseCase(relationshipRepo, usersRepo);
    const result = await useCase.execute("student-1", "rel-1", "ACCEPT");

    expect(relationshipRepo.updateStatus).toHaveBeenCalledWith("rel-1", RelationshipStatus.ACTIVE);
    expect(result.status).toBe(RelationshipStatus.ACTIVE);
  });

  it("REJECT by the invited side (student) moves status to REVOKED", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const usersRepo = makeUsersRepo();
    relationshipRepo.findById.mockResolvedValue(
      makeRelationship({ initiatedBy: RelationshipInitiator.TRAINER }),
    );
    relationshipRepo.updateStatus.mockResolvedValue(
      makeRelationship({ status: RelationshipStatus.REVOKED }),
    );

    const useCase = new RespondRelationshipUseCase(relationshipRepo, usersRepo);
    await useCase.execute("student-1", "rel-1", "REJECT");

    expect(relationshipRepo.updateStatus).toHaveBeenCalledWith(
      "rel-1",
      RelationshipStatus.REVOKED,
    );
  });

  it("invited side can be the trainer when STUDENT initiated", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const usersRepo = makeUsersRepo();
    relationshipRepo.findById.mockResolvedValue(
      makeRelationship({ initiatedBy: RelationshipInitiator.STUDENT }),
    );
    relationshipRepo.updateStatus.mockResolvedValue(
      makeRelationship({ status: RelationshipStatus.ACTIVE }),
    );

    const useCase = new RespondRelationshipUseCase(relationshipRepo, usersRepo);
    await useCase.execute("trainer-1", "rel-1", "ACCEPT");

    expect(relationshipRepo.updateStatus).toHaveBeenCalledWith("rel-1", RelationshipStatus.ACTIVE);
  });

  // FR-006
  it("throws Forbidden when the initiator (trainer) tries to respond", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const usersRepo = makeUsersRepo();
    relationshipRepo.findById.mockResolvedValue(
      makeRelationship({ initiatedBy: RelationshipInitiator.TRAINER }),
    );

    const useCase = new RespondRelationshipUseCase(relationshipRepo, usersRepo);

    await expect(useCase.execute("trainer-1", "rel-1", "ACCEPT")).rejects.toThrow(
      ForbiddenException,
    );
    expect(relationshipRepo.updateStatus).not.toHaveBeenCalled();
  });

  // FR-006
  it("throws Forbidden when the initiator (student) tries to respond", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const usersRepo = makeUsersRepo();
    relationshipRepo.findById.mockResolvedValue(
      makeRelationship({ initiatedBy: RelationshipInitiator.STUDENT }),
    );

    const useCase = new RespondRelationshipUseCase(relationshipRepo, usersRepo);

    await expect(useCase.execute("student-1", "rel-1", "REJECT")).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("throws NotFound when relationship does not exist", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const usersRepo = makeUsersRepo();
    relationshipRepo.findById.mockResolvedValue(null);

    const useCase = new RespondRelationshipUseCase(relationshipRepo, usersRepo);

    await expect(useCase.execute("student-1", "ghost", "ACCEPT")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("throws NotFound when current user does not participate in the relationship", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const usersRepo = makeUsersRepo();
    relationshipRepo.findById.mockResolvedValue(makeRelationship());

    const useCase = new RespondRelationshipUseCase(relationshipRepo, usersRepo);

    await expect(useCase.execute("outsider", "rel-1", "ACCEPT")).rejects.toThrow(
      NotFoundException,
    );
  });

  // FR-007 transition guard
  it("throws Conflict when relationship is already ACTIVE", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const usersRepo = makeUsersRepo();
    relationshipRepo.findById.mockResolvedValue(
      makeRelationship({ status: RelationshipStatus.ACTIVE }),
    );

    const useCase = new RespondRelationshipUseCase(relationshipRepo, usersRepo);

    await expect(useCase.execute("student-1", "rel-1", "ACCEPT")).rejects.toThrow(
      ConflictException,
    );
  });

  it("throws Conflict when relationship is already REVOKED", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const usersRepo = makeUsersRepo();
    relationshipRepo.findById.mockResolvedValue(
      makeRelationship({ status: RelationshipStatus.REVOKED }),
    );

    const useCase = new RespondRelationshipUseCase(relationshipRepo, usersRepo);

    await expect(useCase.execute("student-1", "rel-1", "REJECT")).rejects.toThrow(
      ConflictException,
    );
  });
});
