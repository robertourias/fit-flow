import { ApiProperty } from "@nestjs/swagger";
import { RelationshipStatus } from "../../../identity/domain/relationship-status.enum";
import { RelationshipInitiator } from "../../../identity/domain/relationship-initiator.enum";
import type { TrainerStudentRelationship } from "../../../identity/domain/trainer-student-relationship.entity";
import type { IUsersRepository } from "../../../identity/domain/repositories/users.repository.interface";

export class RelationshipDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  trainerId!: string;

  @ApiProperty()
  trainerName!: string;

  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  studentName!: string;

  @ApiProperty({ enum: RelationshipStatus })
  status!: RelationshipStatus;

  @ApiProperty({ enum: RelationshipInitiator })
  initiatedBy!: RelationshipInitiator;

  @ApiProperty()
  startedAt!: string;

  @ApiProperty({ nullable: true, type: String })
  endedAt!: string | null;

  // Precisa do nome de ambos os lados — não fica disponível na entidade de domínio,
  // por isso recebe o repositório de usuários para resolver via findById.
  static async fromEntity(
    relationship: TrainerStudentRelationship,
    usersRepository: IUsersRepository,
  ): Promise<RelationshipDto> {
    const [trainer, student] = await Promise.all([
      usersRepository.findById(relationship.trainerId),
      usersRepository.findById(relationship.studentId),
    ]);

    const dto = new RelationshipDto();
    dto.id = relationship.id;
    dto.trainerId = relationship.trainerId;
    dto.trainerName = trainer?.name ?? "";
    dto.studentId = relationship.studentId;
    dto.studentName = student?.name ?? "";
    dto.status = relationship.status;
    dto.initiatedBy = relationship.initiatedBy;
    dto.startedAt = relationship.startedAt.toISOString();
    dto.endedAt = relationship.endedAt ? relationship.endedAt.toISOString() : null;
    return dto;
  }
}
