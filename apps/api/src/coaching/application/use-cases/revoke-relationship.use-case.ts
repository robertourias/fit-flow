import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  TRAINER_STUDENT_RELATIONSHIP_REPOSITORY,
  USERS_REPOSITORY,
} from "../../../identity/identity.tokens";
import type { ITrainerStudentRelationshipRepository } from "../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import type { IUsersRepository } from "../../../identity/domain/repositories/users.repository.interface";
import { RelationshipStatus } from "../../../identity/domain/relationship-status.enum";
import { RelationshipDto } from "../dto/relationship.dto";

@Injectable()
export class RevokeRelationshipUseCase {
  constructor(
    @Inject(TRAINER_STUDENT_RELATIONSHIP_REPOSITORY)
    private readonly _relationshipRepository: ITrainerStudentRelationshipRepository,
    @Inject(USERS_REPOSITORY)
    private readonly _usersRepository: IUsersRepository,
  ) {}

  async execute(currentUserId: string, relationshipId: string): Promise<RelationshipDto> {
    const relationship = await this._relationshipRepository.findById(relationshipId);
    if (
      !relationship ||
      (relationship.trainerId !== currentUserId && relationship.studentId !== currentUserId)
    ) {
      throw new NotFoundException("Relationship not found");
    }

    // FR-007: REVOKE só é permitido em vínculo ACTIVE, por qualquer um dos dois lados.
    if (!relationship.isActive()) {
      throw new ConflictException("Relationship is not active");
    }

    const updated = await this._relationshipRepository.updateStatus(
      relationshipId,
      RelationshipStatus.REVOKED,
    );

    return RelationshipDto.fromEntity(updated, this._usersRepository);
  }
}
