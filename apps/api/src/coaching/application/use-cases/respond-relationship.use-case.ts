import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  TRAINER_STUDENT_RELATIONSHIP_REPOSITORY,
  USERS_REPOSITORY,
} from "../../../identity/identity.tokens";
import type { ITrainerStudentRelationshipRepository } from "../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import type { IUsersRepository } from "../../../identity/domain/repositories/users.repository.interface";
import { RelationshipStatus } from "../../../identity/domain/relationship-status.enum";
import { RelationshipDto } from "../dto/relationship.dto";

export type RespondRelationshipAction = "ACCEPT" | "REJECT";

@Injectable()
export class RespondRelationshipUseCase {
  constructor(
    @Inject(TRAINER_STUDENT_RELATIONSHIP_REPOSITORY)
    private readonly _relationshipRepository: ITrainerStudentRelationshipRepository,
    @Inject(USERS_REPOSITORY)
    private readonly _usersRepository: IUsersRepository,
  ) {}

  async execute(
    currentUserId: string,
    relationshipId: string,
    action: RespondRelationshipAction,
  ): Promise<RelationshipDto> {
    const relationship = await this._relationshipRepository.findById(relationshipId);
    if (
      !relationship ||
      (relationship.trainerId !== currentUserId && relationship.studentId !== currentUserId)
    ) {
      throw new NotFoundException("Relationship not found");
    }

    if (relationship.status !== RelationshipStatus.PENDING) {
      throw new ConflictException("Relationship is not pending");
    }

    // FR-006: apenas quem NÃO iniciou o convite pode aceitar/recusar.
    if (relationship.wasInitiatedBy(currentUserId)) {
      throw new ForbiddenException("Only the invited side can respond to this invite");
    }

    const newStatus =
      action === "ACCEPT" ? RelationshipStatus.ACTIVE : RelationshipStatus.REVOKED;
    const updated = await this._relationshipRepository.updateStatus(relationshipId, newStatus);

    return RelationshipDto.fromEntity(updated, this._usersRepository);
  }
}
