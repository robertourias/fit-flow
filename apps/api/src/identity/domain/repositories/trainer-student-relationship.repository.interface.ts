import { TrainerStudentRelationship } from "../trainer-student-relationship.entity";
import { RelationshipStatus } from "../relationship-status.enum";
import { RelationshipInitiator } from "../relationship-initiator.enum";

export interface ITrainerStudentRelationshipRepository {
  findById(id: string): Promise<TrainerStudentRelationship | null>;
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
  create(
    trainerId: string,
    studentId: string,
    initiatedBy: RelationshipInitiator,
  ): Promise<TrainerStudentRelationship>;
  updateStatus(id: string, status: RelationshipStatus): Promise<TrainerStudentRelationship>;
  trainerHasAccessToStudent(trainerId: string, studentId: string): Promise<boolean>;
  markRead(
    relationshipId: string,
    side: "TRAINER" | "STUDENT",
    at: Date,
  ): Promise<TrainerStudentRelationship>;
}
