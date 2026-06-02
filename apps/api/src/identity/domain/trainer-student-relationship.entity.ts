import { RelationshipStatus } from "./relationship-status.enum";

export interface ITrainerStudentRelationshipProps {
  id: string;
  trainerId: string;
  studentId: string;
  status: RelationshipStatus;
  startedAt: Date;
  endedAt?: Date | null;
}

export class TrainerStudentRelationship {
  constructor(private readonly props: ITrainerStudentRelationshipProps) {}

  get id() { return this.props.id; }
  get trainerId() { return this.props.trainerId; }
  get studentId() { return this.props.studentId; }
  get status() { return this.props.status; }
  get startedAt() { return this.props.startedAt; }
  get endedAt() { return this.props.endedAt; }

  isActive(): boolean {
    return this.props.status === RelationshipStatus.ACTIVE;
  }
}
