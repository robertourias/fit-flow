import { Injectable } from "@nestjs/common";
import { prisma, Prisma } from "@fitflow/db";
import { ITrainerStudentRelationshipRepository } from "../../domain/repositories/trainer-student-relationship.repository.interface";
import { TrainerStudentRelationship } from "../../domain/trainer-student-relationship.entity";
import { RelationshipStatus } from "../../domain/relationship-status.enum";
import { RelationshipInitiator } from "../../domain/relationship-initiator.enum";

type RelationshipRow = Prisma.TrainerStudentRelationshipGetPayload<Record<string, never>>;

@Injectable()
export class PrismaTrainerStudentRelationshipRepository
  implements ITrainerStudentRelationshipRepository
{
  async findById(id: string): Promise<TrainerStudentRelationship | null> {
    const row = await prisma.trainerStudentRelationship.findUnique({
      where: { id },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByTrainerAndStudent(
    trainerId: string,
    studentId: string,
  ): Promise<TrainerStudentRelationship | null> {
    const row = await prisma.trainerStudentRelationship.findUnique({
      where: { trainerId_studentId: { trainerId, studentId } },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByStudent(
    studentId: string,
    status?: RelationshipStatus,
  ): Promise<TrainerStudentRelationship[]> {
    const rows = await prisma.trainerStudentRelationship.findMany({
      where: { studentId, ...(status ? { status } : {}) },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByTrainer(
    trainerId: string,
    status?: RelationshipStatus,
  ): Promise<TrainerStudentRelationship[]> {
    const rows = await prisma.trainerStudentRelationship.findMany({
      where: { trainerId, ...(status ? { status } : {}) },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async create(
    trainerId: string,
    studentId: string,
    initiatedBy: RelationshipInitiator,
  ): Promise<TrainerStudentRelationship> {
    const row = await prisma.trainerStudentRelationship.create({
      data: { trainerId, studentId, initiatedBy },
    });
    return this.toDomain(row);
  }

  async updateStatus(id: string, status: RelationshipStatus): Promise<TrainerStudentRelationship> {
    const row = await prisma.trainerStudentRelationship.update({
      where: { id },
      data: { status, ...(status === RelationshipStatus.REVOKED ? { endedAt: new Date() } : {}) },
    });
    return this.toDomain(row);
  }

  async trainerHasAccessToStudent(trainerId: string, studentId: string): Promise<boolean> {
    const row = await prisma.trainerStudentRelationship.findUnique({
      where: { trainerId_studentId: { trainerId, studentId } },
      select: { status: true },
    });
    return row?.status === RelationshipStatus.ACTIVE;
  }

  private toDomain(row: RelationshipRow): TrainerStudentRelationship {
    return new TrainerStudentRelationship({
      id: row.id,
      trainerId: row.trainerId,
      studentId: row.studentId,
      status: row.status as RelationshipStatus,
      initiatedBy: row.initiatedBy as RelationshipInitiator,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
    });
  }
}
