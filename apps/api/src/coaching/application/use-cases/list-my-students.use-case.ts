import { Inject, Injectable } from "@nestjs/common";
import {
  TRAINER_STUDENT_RELATIONSHIP_REPOSITORY,
  USERS_REPOSITORY,
} from "../../../identity/identity.tokens";
import type { ITrainerStudentRelationshipRepository } from "../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import type { IUsersRepository } from "../../../identity/domain/repositories/users.repository.interface";
import { RelationshipStatus } from "../../../identity/domain/relationship-status.enum";
import { RelationshipDto } from "../dto/relationship.dto";

@Injectable()
export class ListMyStudentsUseCase {
  constructor(
    @Inject(TRAINER_STUDENT_RELATIONSHIP_REPOSITORY)
    private readonly _relationshipRepository: ITrainerStudentRelationshipRepository,
    @Inject(USERS_REPOSITORY)
    private readonly _usersRepository: IUsersRepository,
  ) {}

  async execute(trainerId: string, status?: RelationshipStatus): Promise<RelationshipDto[]> {
    const relationships = await this._relationshipRepository.findByTrainer(trainerId, status);

    // FR-011: sem filtro, retorna todos exceto REVOKED.
    const filtered = status
      ? relationships
      : relationships.filter((r) => r.status !== RelationshipStatus.REVOKED);

    return Promise.all(
      filtered.map((relationship) =>
        RelationshipDto.fromEntity(relationship, this._usersRepository),
      ),
    );
  }
}
