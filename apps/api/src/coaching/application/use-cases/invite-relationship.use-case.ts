import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@fitflow/db";
import {
  TRAINER_STUDENT_RELATIONSHIP_REPOSITORY,
  USERS_REPOSITORY,
} from "../../../identity/identity.tokens";
import type { ITrainerStudentRelationshipRepository } from "../../../identity/domain/repositories/trainer-student-relationship.repository.interface";
import type { IUsersRepository } from "../../../identity/domain/repositories/users.repository.interface";
import { RelationshipInitiator } from "../../../identity/domain/relationship-initiator.enum";
import { RelationshipStatus } from "../../../identity/domain/relationship-status.enum";
import type { TrainerStudentRelationship } from "../../../identity/domain/trainer-student-relationship.entity";
import { RelationshipDto } from "../dto/relationship.dto";

@Injectable()
export class InviteRelationshipUseCase {
  constructor(
    @Inject(TRAINER_STUDENT_RELATIONSHIP_REPOSITORY)
    private readonly _relationshipRepository: ITrainerStudentRelationshipRepository,
    @Inject(USERS_REPOSITORY)
    private readonly _usersRepository: IUsersRepository,
  ) {}

  async execute(currentUserId: string, targetEmail: string): Promise<RelationshipDto> {
    const currentUser = await this._usersRepository.findById(currentUserId);
    if (!currentUser || currentUser.isDeleted()) {
      throw new NotFoundException("User not found");
    }

    // FR-005: não é permitido convidar a si mesmo.
    if (currentUser.email.toLowerCase() === targetEmail.toLowerCase()) {
      throw new BadRequestException("Cannot invite yourself");
    }

    const targetUser = await this._usersRepository.findByEmail(targetEmail);
    if (!targetUser || targetUser.isDeleted()) {
      throw new NotFoundException("User not found");
    }

    // FR-002: vínculo só entre um isTrainer=true e outro isTrainer=false.
    if (currentUser.isTrainer === targetUser.isTrainer) {
      throw new BadRequestException(
        "Relationship requires exactly one trainer and one student",
      );
    }

    const trainerId = currentUser.isTrainer ? currentUser.id : targetUser.id;
    const studentId = currentUser.isTrainer ? targetUser.id : currentUser.id;
    const initiatedBy = currentUser.isTrainer
      ? RelationshipInitiator.TRAINER
      : RelationshipInitiator.STUDENT;

    // FR-004: convite duplicado com vínculo PENDING/ACTIVE é idempotente.
    const existing = await this._relationshipRepository.findByTrainerAndStudent(
      trainerId,
      studentId,
    );
    if (existing && existing.status !== RelationshipStatus.REVOKED) {
      return RelationshipDto.fromEntity(existing, this._usersRepository);
    }

    let relationship: TrainerStudentRelationship;
    try {
      relationship = await this._relationshipRepository.create(
        trainerId,
        studentId,
        initiatedBy,
      );
    } catch (error) {
      // Risco de condição de corrida (convites simultâneos dos dois lados):
      // o unique[trainerId, studentId] pode disparar P2002 mesmo após o check acima.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const race = await this._relationshipRepository.findByTrainerAndStudent(
          trainerId,
          studentId,
        );
        if (race) {
          return RelationshipDto.fromEntity(race, this._usersRepository);
        }
      }
      throw error;
    }

    return RelationshipDto.fromEntity(relationship, this._usersRepository);
  }
}
