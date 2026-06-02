import { PlannedSet } from "./planned-set.value-object";

export interface IWorkoutExerciseProps {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  restSeconds: number;
  notes?: string | null;
  plannedSets: PlannedSet[];
}

export class WorkoutExercise {
  constructor(private readonly props: IWorkoutExerciseProps) {}

  get id() { return this.props.id; }
  get workoutId() { return this.props.workoutId; }
  get exerciseId() { return this.props.exerciseId; }
  get order() { return this.props.order; }
  get restSeconds() { return this.props.restSeconds; }
  get notes() { return this.props.notes; }
  get plannedSets() { return this.props.plannedSets; }
}
