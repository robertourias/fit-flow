import { NotFoundException } from "@nestjs/common";
import { MarkMessagesReadUseCase } from "../mark-messages-read.use-case";
import { TrainerStudentRelationship } from "../../../../identity/domain/trainer-student-relationship.entity";
import { RelationshipStatus } from "../../../../identity/domain/relationship-status.enum";
import { RelationshipInitiator } from "../../../../identity/domain/relationship-initiator.enum";
import type { ITrainerStudentRelationshipRepository } from "../../../../identity/domain/repositories/trainer-student-relationship.repository.interface";

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

function makeRelationshipRepo(): jest.Mocked<ITrainerStudentRelationshipRepository> {
  return {
    findById: jest.fn(),
    findByTrainerAndStudent: jest.fn(),
    findByStudent: jest.fn(),
    findByTrainer: jest.fn(),
    create: jest.fn(),
    updateStatus: jest.fn(),
    trainerHasAccessToStudent: jest.fn(),
    markRead: jest.fn(),
  };
}

describe("MarkMessagesReadUseCase", () => {
  it("throws NotFound when relationship does not exist", async () => {
    const relationshipRepo = makeRelationshipRepo();
    relationshipRepo.findById.mockResolvedValue(null);

    const useCase = new MarkMessagesReadUseCase(relationshipRepo);

    await expect(useCase.execute("trainer-1", "rel-1")).rejects.toThrow(NotFoundException);
    expect(relationshipRepo.markRead).not.toHaveBeenCalled();
  });

  it("throws NotFound when relationship is not ACTIVE", async () => {
    const relationshipRepo = makeRelationshipRepo();
    relationshipRepo.findById.mockResolvedValue(
      makeRelationship({ status: RelationshipStatus.REVOKED }),
    );

    const useCase = new MarkMessagesReadUseCase(relationshipRepo);

    await expect(useCase.execute("trainer-1", "rel-1")).rejects.toThrow(NotFoundException);
    expect(relationshipRepo.markRead).not.toHaveBeenCalled();
  });

  it("throws NotFound when current user does not participate in the relationship", async () => {
    const relationshipRepo = makeRelationshipRepo();
    relationshipRepo.findById.mockResolvedValue(makeRelationship());

    const useCase = new MarkMessagesReadUseCase(relationshipRepo);

    await expect(useCase.execute("intruder-1", "rel-1")).rejects.toThrow(NotFoundException);
    expect(relationshipRepo.markRead).not.toHaveBeenCalled();
  });

  // FR-005
  it("marks read on the TRAINER side when current user is the trainer", async () => {
    const relationshipRepo = makeRelationshipRepo();
    relationshipRepo.findById.mockResolvedValue(makeRelationship());
    relationshipRepo.markRead.mockResolvedValue(
      makeRelationship({ trainerLastReadAt: new Date("2026-06-18") }),
    );

    const useCase = new MarkMessagesReadUseCase(relationshipRepo);
    await useCase.execute("trainer-1", "rel-1");

    expect(relationshipRepo.markRead).toHaveBeenCalledWith(
      "rel-1",
      "TRAINER",
      expect.any(Date),
    );
  });

  // FR-005
  it("marks read on the STUDENT side when current user is the student", async () => {
    const relationshipRepo = makeRelationshipRepo();
    relationshipRepo.findById.mockResolvedValue(makeRelationship());
    relationshipRepo.markRead.mockResolvedValue(
      makeRelationship({ studentLastReadAt: new Date("2026-06-18") }),
    );

    const useCase = new MarkMessagesReadUseCase(relationshipRepo);
    const result = await useCase.execute("student-1", "rel-1");

    expect(relationshipRepo.markRead).toHaveBeenCalledWith(
      "rel-1",
      "STUDENT",
      expect.any(Date),
    );
    expect(result.studentLastReadAt).toEqual(new Date("2026-06-18"));
  });
});
