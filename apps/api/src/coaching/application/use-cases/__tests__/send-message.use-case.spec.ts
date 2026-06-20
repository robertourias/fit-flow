import { NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import type { Queue } from "bullmq";
import { SendMessageUseCase } from "../send-message.use-case";
import { TrainerStudentRelationship } from "../../../../identity/domain/trainer-student-relationship.entity";
import { RelationshipStatus } from "../../../../identity/domain/relationship-status.enum";
import { RelationshipInitiator } from "../../../../identity/domain/relationship-initiator.enum";
import { Message } from "../../../domain/message.entity";
import type { ITrainerStudentRelationshipRepository } from "../../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import type { IMessageRepository } from "../../../domain/repositories/message.repository.interface";
import type { INewMessageJobData } from "../../../../notifications/infra/queue/new-message-notification.processor";

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
    content: "Olá, tudo bem?",
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

function makeQueue(): jest.Mocked<Queue<INewMessageJobData>> {
  return { add: jest.fn() } as unknown as jest.Mocked<Queue<INewMessageJobData>>;
}

describe("SendMessageUseCase", () => {
  // FR-001
  it("throws NotFound when relationship does not exist", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const messageRepo = makeMessageRepo();
    const queue = makeQueue();
    relationshipRepo.findById.mockResolvedValue(null);

    const useCase = new SendMessageUseCase(relationshipRepo, messageRepo, queue);

    await expect(useCase.execute("trainer-1", "rel-1", "oi")).rejects.toThrow(NotFoundException);
    expect(messageRepo.create).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  // FR-001
  it("throws NotFound when relationship is not ACTIVE", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const messageRepo = makeMessageRepo();
    const queue = makeQueue();
    relationshipRepo.findById.mockResolvedValue(
      makeRelationship({ status: RelationshipStatus.PENDING }),
    );

    const useCase = new SendMessageUseCase(relationshipRepo, messageRepo, queue);

    await expect(useCase.execute("trainer-1", "rel-1", "oi")).rejects.toThrow(NotFoundException);
    expect(messageRepo.create).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  // FR-001
  it("throws NotFound when current user does not participate in the relationship", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const messageRepo = makeMessageRepo();
    const queue = makeQueue();
    relationshipRepo.findById.mockResolvedValue(makeRelationship());

    const useCase = new SendMessageUseCase(relationshipRepo, messageRepo, queue);

    await expect(useCase.execute("intruder-1", "rel-1", "oi")).rejects.toThrow(
      NotFoundException,
    );
    expect(messageRepo.create).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  // FR-002
  it("throws UnprocessableEntity and does not persist nor enqueue when content is blocked", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const messageRepo = makeMessageRepo();
    const queue = makeQueue();
    relationshipRepo.findById.mockResolvedValue(makeRelationship());

    const useCase = new SendMessageUseCase(relationshipRepo, messageRepo, queue);

    await expect(
      useCase.execute("trainer-1", "rel-1", "seu burro, faz o treino"),
    ).rejects.toThrow(UnprocessableEntityException);
    expect(messageRepo.create).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  // FR-003: trainer -> student
  it("persists message and enqueues notification job for the student when sender is the trainer", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const messageRepo = makeMessageRepo();
    const queue = makeQueue();
    relationshipRepo.findById.mockResolvedValue(makeRelationship());
    messageRepo.create.mockResolvedValue(makeMessage());

    const useCase = new SendMessageUseCase(relationshipRepo, messageRepo, queue);
    const result = await useCase.execute("trainer-1", "rel-1", "Olá, tudo bem?");

    expect(messageRepo.create).toHaveBeenCalledWith({
      relationshipId: "rel-1",
      senderId: "trainer-1",
      content: "Olá, tudo bem?",
    });
    expect(queue.add).toHaveBeenCalledWith("new-message", {
      recipientId: "student-1",
      relationshipId: "rel-1",
      messageId: "msg-1",
      senderId: "trainer-1",
    });
    expect(result.id).toBe("msg-1");
  });

  // FR-003: student -> trainer
  it("persists message and enqueues notification job for the trainer when sender is the student", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const messageRepo = makeMessageRepo();
    const queue = makeQueue();
    relationshipRepo.findById.mockResolvedValue(makeRelationship());
    messageRepo.create.mockResolvedValue(makeMessage({ senderId: "student-1" }));

    const useCase = new SendMessageUseCase(relationshipRepo, messageRepo, queue);
    await useCase.execute("student-1", "rel-1", "Olá, preparador!");

    expect(queue.add).toHaveBeenCalledWith("new-message", {
      recipientId: "trainer-1",
      relationshipId: "rel-1",
      messageId: "msg-1",
      senderId: "student-1",
    });
  });

  // FR-003: falha no enqueue não impede sucesso do envio
  it("does not throw and still returns the persisted message when Queue.add fails", async () => {
    const relationshipRepo = makeRelationshipRepo();
    const messageRepo = makeMessageRepo();
    const queue = makeQueue();
    relationshipRepo.findById.mockResolvedValue(makeRelationship());
    messageRepo.create.mockResolvedValue(makeMessage());
    queue.add.mockRejectedValue(new Error("redis down"));

    const useCase = new SendMessageUseCase(relationshipRepo, messageRepo, queue);
    const result = await useCase.execute("trainer-1", "rel-1", "Olá, tudo bem?");

    expect(result.id).toBe("msg-1");
    expect(messageRepo.create).toHaveBeenCalled();
  });
});
