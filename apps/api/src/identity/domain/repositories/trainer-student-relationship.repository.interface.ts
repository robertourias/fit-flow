import { TrainerStudentRelationship } from "../trainer-student-relationship.entity";
import { RelationshipStatus } from "../relationship-status.enum";

export interface ITrainerStudentRelationshipRepository {
  findByTrainerAndStudent(
    trainerId: string,
    studentId: string,
  ): Promise<TrainerStudentRelationship | null>;
  findByStudent(
    studentId: string,
    status?: RelationshipStatus,
  ): Promise<TrainerStudentRelationship[]>;
  findByTrainer(
    trainerId: string,
    status?: RelationshipStatus,
  ): Promise<TrainerStudentRelationship[]>;
  create(trainerId: string, studentId: string): Promise<TrainerStudentRelationship>;
  updateStatus(id: string, status: RelationshipStatus): Promise<TrainerStudentRelationship>;
  trainerHasAccessToStudent(trainerId: string, studentId: string): Promise<boolean>;
}
