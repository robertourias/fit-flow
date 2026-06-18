import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@fitflow/db";
import { InviteRelationshipUseCase } from "../invite-relationship.use-case";
import { User } from "../../../../identity/domain/user.entity";
import { Plan } from "../../../../identity/domain/plan.enum";
import { TrainerStudentRelationship } from "../../../../identity/domain/trainer-student-relationship.entity";
import { RelationshipStatus } from "../../../../identity/domain/relationship-status.enum";
import { RelationshipInitiator } from "../../../../identity/domain/relationship-initiator.enum";
import type { ITrainerStudentRelationshipRepository } from "../../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import type { IUsersRepository } from "../../../../identity/domain/repositories/users.repository.interface";

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

function makeUsersRepo(): jest.Mocked<IUsersRepository> {
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

describe("InviteRelationshipUseCase", () => {
  it("creates relationship when current user is trainer and target is student", async () => {
    const usersRepo = makeUsersRepo();
    const relationshipRepo = makeRelationshipRepo();
    const trainer = makeUser({ id: "trainer-1", email: "trainer@test.com", isTrainer: true });
    const student = makeUser({ id: "student-1", email: "student@test.com", isTrainer: false });

    usersRepo.findById.mockResolvedValue(trainer);
    usersRepo.findByEmail.mockResolvedValue(student);
    relationshipRepo.findByTrainerAndStudent.mockResolvedValue(null);
    relationshipRepo.create.mockResolvedValue(makeRelationship());

    const useCase = new InviteRelationshipUseCase(relationshipRepo, usersRepo);
    const result = await useCase.execute("trainer-1", "student@test.com");

    expect(relationshipRepo.create).toHaveBeenCalledWith(
      "trainer-1",
      "student-1",
      RelationshipInitiator.TRAINER,
    );
    expect(result.trainerId).toBe("trainer-1");
    expect(result.studentId).toBe("student-1");
  });

  it("creates relationship when current user is student and target is trainer", async () => {
    const usersRepo = makeUsersRepo();
    const relationshipRepo = makeRelationshipRepo();
    const student = makeUser({ id: "student-1", email: "student@test.com", isTrainer: false });
    const trainer = makeUser({ id: "trainer-1", email: "trainer@test.com", isTrainer: true });

    usersRepo.findById.mockResolvedValue(student);
    usersRepo.findByEmail.mockResolvedValue(trainer);
    relationshipRepo.findByTrainerAndStudent.mockResolvedValue(null);
    relationshipRepo.create.mockResolvedValue(
      makeRelationship({ initiatedBy: RelationshipInitiator.STUDENT }),
    );

    const useCase = new InviteRelationshipUseCase(relationshipRepo, usersRepo);
    await useCase.execute("student-1", "trainer@test.com");

    expect(relationshipRepo.create).toHaveBeenCalledWith(
      "trainer-1",
      "student-1",
      RelationshipInitiator.STUDENT,
    );
  });

  // FR-002
  it("throws BadRequest when both users are trainers", async () => {
    const usersRepo = makeUsersRepo();
    const relationshipRepo = makeRelationshipRepo();
    usersRepo.findById.mockResolvedValue(makeUser({ id: "user-1", isTrainer: true }));
    usersRepo.findByEmail.mockResolvedValue(
      makeUser({ id: "user-2", email: "other@test.com", isTrainer: true }),
    );

    const useCase = new InviteRelationshipUseCase(relationshipRepo, usersRepo);

    await expect(useCase.execute("user-1", "other@test.com")).rejects.toThrow(
      BadRequestException,
    );
    expect(relationshipRepo.create).not.toHaveBeenCalled();
  });

  // FR-002
  it("throws BadRequest when both users are students", async () => {
    const usersRepo = makeUsersRepo();
    const relationshipRepo = makeRelationshipRepo();
    usersRepo.findById.mockResolvedValue(makeUser({ id: "user-1", isTrainer: false }));
    usersRepo.findByEmail.mockResolvedValue(
      makeUser({ id: "user-2", email: "other@test.com", isTrainer: false }),
    );

    const useCase = new InviteRelationshipUseCase(relationshipRepo, usersRepo);

    await expect(useCase.execute("user-1", "other@test.com")).rejects.toThrow(
      BadRequestException,
    );
    expect(relationshipRepo.create).not.toHaveBeenCalled();
  });

  // FR-005
  it("throws BadRequest when inviting self", async () => {
    const usersRepo = makeUsersRepo();
    const relationshipRepo = makeRelationshipRepo();
    usersRepo.findById.mockResolvedValue(
      makeUser({ id: "user-1", email: "self@test.com", isTrainer: true }),
    );

    const useCase = new InviteRelationshipUseCase(relationshipRepo, usersRepo);

    await expect(useCase.execute("user-1", "self@test.com")).rejects.toThrow(
      BadRequestException,
    );
    expect(usersRepo.findByEmail).not.toHaveBeenCalled();
  });

  // FR-005 (case-insensitive email comparison)
  it("throws BadRequest when inviting self regardless of email case", async () => {
    const usersRepo = makeUsersRepo();
    const relationshipRepo = makeRelationshipRepo();
    usersRepo.findById.mockResolvedValue(
      makeUser({ id: "user-1", email: "self@test.com", isTrainer: true }),
    );

    const useCase = new InviteRelationshipUseCase(relationshipRepo, usersRepo);

    await expect(useCase.execute("user-1", "SELF@TEST.COM")).rejects.toThrow(
      BadRequestException,
    );
  });

  it("throws NotFound when target email does not exist", async () => {
    const usersRepo = makeUsersRepo();
    const relationshipRepo = makeRelationshipRepo();
    usersRepo.findById.mockResolvedValue(makeUser({ id: "user-1", isTrainer: true }));
    usersRepo.findByEmail.mockResolvedValue(null);

    const useCase = new InviteRelationshipUseCase(relationshipRepo, usersRepo);

    await expect(useCase.execute("user-1", "ghost@test.com")).rejects.toThrow(NotFoundException);
  });

  // FR-004
  it("returns existing PENDING relationship idempotently instead of creating duplicate", async () => {
    const usersRepo = makeUsersRepo();
    const relationshipRepo = makeRelationshipRepo();
    const trainer = makeUser({ id: "trainer-1", email: "trainer@test.com", isTrainer: true });
    const student = makeUser({ id: "student-1", email: "student@test.com", isTrainer: false });
    usersRepo.findById.mockResolvedValue(trainer);
    usersRepo.findByEmail.mockResolvedValue(student);
    relationshipRepo.findByTrainerAndStudent.mockResolvedValue(
      makeRelationship({ status: RelationshipStatus.PENDING }),
    );

    const useCase = new InviteRelationshipUseCase(relationshipRepo, usersRepo);
    const result = await useCase.execute("trainer-1", "student@test.com");

    expect(relationshipRepo.create).not.toHaveBeenCalled();
    expect(result.id).toBe("rel-1");
  });

  // FR-004
  it("returns existing ACTIVE relationship idempotently instead of creating duplicate", async () => {
    const usersRepo = makeUsersRepo();
    const relationshipRepo = makeRelationshipRepo();
    const trainer = makeUser({ id: "trainer-1", email: "trainer@test.com", isTrainer: true });
    const student = makeUser({ id: "student-1", email: "student@test.com", isTrainer: false });
    usersRepo.findById.mockResolvedValue(trainer);
    usersRepo.findByEmail.mockResolvedValue(student);
    relationshipRepo.findByTrainerAndStudent.mockResolvedValue(
      makeRelationship({ status: RelationshipStatus.ACTIVE }),
    );

    const useCase = new InviteRelationshipUseCase(relationshipRepo, usersRepo);
    const result = await useCase.execute("trainer-1", "student@test.com");

    expect(relationshipRepo.create).not.toHaveBeenCalled();
    expect(result.status).toBe(RelationshipStatus.ACTIVE);
  });

  it("creates a new relationship when existing one is REVOKED", async () => {
    const usersRepo = makeUsersRepo();
    const relationshipRepo = makeRelationshipRepo();
    const trainer = makeUser({ id: "trainer-1", email: "trainer@test.com", isTrainer: true });
    const student = makeUser({ id: "student-1", email: "student@test.com", isTrainer: false });
    usersRepo.findById.mockResolvedValue(trainer);
    usersRepo.findByEmail.mockResolvedValue(student);
    relationshipRepo.findByTrainerAndStudent.mockResolvedValue(
      makeRelationship({ status: RelationshipStatus.REVOKED }),
    );
    relationshipRepo.create.mockResolvedValue(makeRelationship());

    const useCase = new InviteRelationshipUseCase(relationshipRepo, usersRepo);
    await useCase.execute("trainer-1", "student@test.com");

    expect(relationshipRepo.create).toHaveBeenCalled();
  });

  // Risco de condição de corrida — P2002 no create() deve retornar o vínculo existente.
  it("returns existing relationship when create() throws P2002 race condition error", async () => {
    const usersRepo = makeUsersRepo();
    const relationshipRepo = makeRelationshipRepo();
    const trainer = makeUser({ id: "trainer-1", email: "trainer@test.com", isTrainer: true });
    const student = makeUser({ id: "student-1", email: "student@test.com", isTrainer: false });
    usersRepo.findById.mockResolvedValue(trainer);
    usersRepo.findByEmail.mockResolvedValue(student);
    relationshipRepo.findByTrainerAndStudent
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeRelationship());

    const p2002Error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "6.19.3",
    });
    relationshipRepo.create.mockRejectedValue(p2002Error);

    const useCase = new InviteRelationshipUseCase(relationshipRepo, usersRepo);
    const result = await useCase.execute("trainer-1", "student@test.com");

    expect(result.id).toBe("rel-1");
    expect(relationshipRepo.findByTrainerAndStudent).toHaveBeenCalledTimes(2);
  });

  it("rethrows non-P2002 errors from create()", async () => {
    const usersRepo = makeUsersRepo();
    const relationshipRepo = makeRelationshipRepo();
    const trainer = makeUser({ id: "trainer-1", email: "trainer@test.com", isTrainer: true });
    const student = makeUser({ id: "student-1", email: "student@test.com", isTrainer: false });
    usersRepo.findById.mockResolvedValue(trainer);
    usersRepo.findByEmail.mockResolvedValue(student);
    relationshipRepo.findByTrainerAndStudent.mockResolvedValue(null);
    relationshipRepo.create.mockRejectedValue(new Error("unexpected db error"));

    const useCase = new InviteRelationshipUseCase(relationshipRepo, usersRepo);

    await expect(useCase.execute("trainer-1", "student@test.com")).rejects.toThrow(
      "unexpected db error",
    );
  });
});
