import { WorkoutSessionStatus } from "./workout-session-status.enum";
import { SessionExercise } from "./session-exercise.entity";

export interface IWorkoutSessionProps {
  id: string;
  workoutId: string;
  tenantId: string;
  startedAt: Date;
  endedAt?: Date | null;
  comment?: string | null;
  difficulty?: number | null;
  status: WorkoutSessionStatus;
  exercises: SessionExercise[];
  createdAt: Date;
}

export class WorkoutSession {
  constructor(private readonly props: IWorkoutSessionProps) {}

  get id() { return this.props.id; }
  get workoutId() { return this.props.workoutId; }
  get tenantId() { return this.props.tenantId; }
  get startedAt() { return this.props.startedAt; }
  get endedAt() { return this.props.endedAt; }
  get comment() { return this.props.comment; }
  get difficulty() { return this.props.difficulty; }
  get status() { return this.props.status; }
  get exercises() { return this.props.exercises; }
  get createdAt() { return this.props.createdAt; }

  durationMs(): number | null {
    if (!this.props.endedAt) return null;
    return this.props.endedAt.getTime() - this.props.startedAt.getTime();
  }

  totalCompletedSets(): number {
    return this.props.exercises.reduce((sum, ex) => sum + ex.completedSetsCount(), 0);
  }

  isFinished(): boolean {
    return this.props.status === WorkoutSessionStatus.FINISHED;
  }
}
