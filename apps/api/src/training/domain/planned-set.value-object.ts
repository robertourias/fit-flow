export interface IPlannedSetProps {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  targetReps: string;
  targetKg?: string | null;
}

export class PlannedSet {
  constructor(private readonly props: IPlannedSetProps) {}

  get id() { return this.props.id; }
  get setNumber() { return this.props.setNumber; }
  get targetReps() { return this.props.targetReps; }
  get targetKg() { return this.props.targetKg; }
}
