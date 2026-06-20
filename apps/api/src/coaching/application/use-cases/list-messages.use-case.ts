import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TRAINER_STUDENT_RELATIONSHIP_REPOSITORY } from "../../../identity/identity.tokens";
import type { ITrainerStudentRelationshipRepository } from "../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import { MESSAGE_REPOSITORY } from "../../coaching.tokens";
import type { IMessageRepository } from "../../domain/repositories/message.repository.interface";
import type { Message } from "../../domain/message.entity";

export interface IListMessagesResult {
  items: Message[];
  total: number;
}

@Injectable()
export class ListMessagesUseCase {
  constructor(
    @Inject(TRAINER_STUDENT_RELATIONSHIP_REPOSITORY)
    private readonly _relationshipRepository: ITrainerStudentRelationshipRepository,
    @Inject(MESSAGE_REPOSITORY)
    private readonly _messageRepository: IMessageRepository,
  ) {}

  async execute(
    currentUserId: string,
    relationshipId: string,
    opts: { limit: number; offset: number },
  ): Promise<IListMessagesResult> {
    // FR-004: paginação limit/offset, mas só para quem participa de um vínculo ACTIVE
    // (mesma regra de acesso do FR-001/FR-008 — sem vínculo ACTIVE → 404).
    const relationship = await this._relationshipRepository.findById(relationshipId);
    if (
      !relationship ||
      !relationship.isActive() ||
      (relationship.trainerId !== currentUserId && relationship.studentId !== currentUserId)
    ) {
      throw new NotFoundException("Relationship not found");
    }

    const [items, total] = await Promise.all([
      this._messageRepository.findByRelationship(relationshipId, opts),
      this._messageRepository.countByRelationship(relationshipId),
    ]);

    return { items, total };
  }
}
