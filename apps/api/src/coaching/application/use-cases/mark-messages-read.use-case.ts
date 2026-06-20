import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { TRAINER_STUDENT_RELATIONSHIP_REPOSITORY } from "../../../identity/identity.tokens";
import type { ITrainerStudentRelationshipRepository } from "../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import type { TrainerStudentRelationship } from "../../../identity/domain/trainer-student-relationship.entity";

@Injectable()
export class MarkMessagesReadUseCase {
  constructor(
    @Inject(TRAINER_STUDENT_RELATIONSHIP_REPOSITORY)
    private readonly _relationshipRepository: ITrainerStudentRelationshipRepository,
  ) {}

  async execute(currentUserId: string, relationshipId: string): Promise<TrainerStudentRelationship> {
    // FR-005: cada lado do vínculo tem seu próprio cursor de leitura — identifica se o
    // usuário autenticado é o trainer ou o student para gravar o lado correto.
    const relationship = await this._relationshipRepository.findById(relationshipId);
    if (
      !relationship ||
      !relationship.isActive() ||
      (relationship.trainerId !== currentUserId && relationship.studentId !== currentUserId)
    ) {
      throw new NotFoundException("Relationship not found");
    }

    const side = relationship.trainerId === currentUserId ? "TRAINER" : "STUDENT";
    return this._relationshipRepository.markRead(relationshipId, side, new Date());
  }
}
