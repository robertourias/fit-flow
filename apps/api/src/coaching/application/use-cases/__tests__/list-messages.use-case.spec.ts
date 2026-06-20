import { NotFoundException } from "@nestjs/common";
import { ListMessagesUseCase } from "../list-messages.use-case";
import { TrainerStudentRelationship } from "../../../../identity/domain/trainer-student-relationship.entity";
import { RelationshipStatus } from "../../../../identity/domain/relationship-status.enum";
import { RelationshipInitiator } from "../../../../identity/domain/relationship-initiator.enum";
import { Message } from "../../../domain/message.entity";
import type { ITrainerStudentRelationshipRepository } from "../../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import type { IMessageRepository } from "../../../domain/repositories/message.repository.interface";

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

function makeMessage(overrides: Partial<ConstructorParameters<typeof Message>[0]> = {}): Message {
  return new Message({
    id: "msg-1",
    relationshipId: "rel-1",
    senderId: "trainer-1",
    content: "Olá",
    createdAt: new Date("2026-01-01"),
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

function makeMessageRepo(): jest.Mocked<IMessageRepository> {
  return {
    create: jest.fn(),
    findByRelationship: jest.fn(),
    countByRelationship: jest.fn(),
  };
}

describe("ListMessagesUseCase", () => {
  // FR-001 / FR-004
  it("throws NotFound when relationship does not exist", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const messageRepo = makeMessageRepo();
    relationshipRepo.findById.mockResolvedValue(null);

    const useCase = new ListMessagesUseCase(relationshipRepo, messageRepo);

    await expect(
      useCase.execute("trainer-1", "rel-1", { limit: 20, offset: 0 }),
    ).rejects.toThrow(NotFoundException);
    expect(messageRepo.findByRelationship).not.toHaveBeenCalled();
  });

  it("throws NotFound when relationship is not ACTIVE", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const messageRepo = makeMessageRepo();
    relationshipRepo.findById.mockResolvedValue(
      makeRelationship({ status: RelationshipStatus.PENDING }),
    );

    const useCase = new ListMessagesUseCase(relationshipRepo, messageRepo);

    await expect(
      useCase.execute("trainer-1", "rel-1", { limit: 20, offset: 0 }),
    ).rejects.toThrow(NotFoundException);
  });

  it("throws NotFound when current user does not participate in the relationship", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const messageRepo = makeMessageRepo();
    relationshipRepo.findById.mockResolvedValue(makeRelationship());

    const useCase = new ListMessagesUseCase(relationshipRepo, messageRepo);

    await expect(
      useCase.execute("intruder-1", "rel-1", { limit: 20, offset: 0 }),
    ).rejects.toThrow(NotFoundException);
  });

  // FR-004
  it("returns paginated messages ordered desc with total count", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const messageRepo = makeMessageRepo();
    relationshipRepo.findById.mockResolvedValue(makeRelationship());
    const messages = [makeMessage({ id: "msg-2" }), makeMessage({ id: "msg-1" })];
    messageRepo.findByRelationship.mockResolvedValue(messages);
    messageRepo.countByRelationship.mockResolvedValue(2);

    const useCase = new ListMessagesUseCase(relationshipRepo, messageRepo);
    const result = await useCase.execute("trainer-1", "rel-1", { limit: 20, offset: 0 });

    expect(messageRepo.findByRelationship).toHaveBeenCalledWith("rel-1", {
      limit: 20,
      offset: 0,
    });
    expect(result.items).toBe(messages);
    expect(result.total).toBe(2);
  });

  it("allows the student side to list messages too", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const messageRepo = makeMessageRepo();
    relationshipRepo.findById.mockResolvedValue(makeRelationship());
    messageRepo.findByRelationship.mockResolvedValue([]);
    messageRepo.countByRelationship.mockResolvedValue(0);

    const useCase = new ListMessagesUseCase(relationshipRepo, messageRepo);
    const result = await useCase.execute("student-1", "rel-1", { limit: 10, offset: 5 });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });
});
