export interface IExecutedSetProps {
  id: string;
  sessionExerciseId: string;
  setNumber: number;
  kg?: number | null;
  reps?: number | null;
  completedAt?: Date | null;
}

export class ExecutedSet {
  constructor(private readonly props: IExecutedSetProps) {}

  get id() { return this.props.id; }
  get setNumber() { return this.props.setNumber; }
  get kg() { return this.props.kg; }
  get reps() { return this.props.reps; }
  get completedAt() { return this.props.completedAt; }

  isCompleted(): boolean {
    return this.props.completedAt != null;
  }
}
