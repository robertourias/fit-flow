import { RelationshipStatus } from "./relationship-status.enum";
import { RelationshipInitiator } from "./relationship-initiator.enum";

export interface ITrainerStudentRelationshipProps {
  id: string;
  trainerId: string;
  studentId: string;
  status: RelationshipStatus;
  initiatedBy: RelationshipInitiator;
  startedAt: Date;
  endedAt?: Date | null;
  trainerLastReadAt?: Date | null;
  studentLastReadAt?: Date | null;
}

export class TrainerStudentRelationship {
  constructor(private readonly props: ITrainerStudentRelationshipProps) {}

  get id() { return this.props.id; }
  get trainerId() { return this.props.trainerId; }
  get studentId() { return this.props.studentId; }
  get status() { return this.props.status; }
  get initiatedBy() { return this.props.initiatedBy; }
  get startedAt() { return this.props.startedAt; }
  get endedAt() { return this.props.endedAt; }
  get trainerLastReadAt() { return this.props.trainerLastReadAt ?? null; }
  get studentLastReadAt() { return this.props.studentLastReadAt ?? null; }

  isActive(): boolean {
    return this.props.status === RelationshipStatus.ACTIVE;
  }

  wasInitiatedBy(userId: string): boolean {
    const initiatorId =
      this.props.initiatedBy === RelationshipInitiator.TRAINER
        ? this.props.trainerId
        : this.props.studentId;
    return initiatorId === userId;
  }
}
