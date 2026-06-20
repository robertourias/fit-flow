import { WorkoutExercise } from "./workout-exercise.entity";

export interface IWorkoutProps {
  id: string;
  strategyId: string;
  tenantId: string | null;
  name: string;
  description?: string | null;
  order: number;
  exercises: WorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
}

export class Workout {
  constructor(private readonly props: IWorkoutProps) {}

  get id() { return this.props.id; }
  get strategyId() { return this.props.strategyId; }
  get tenantId() { return this.props.tenantId; }
  get name() { return this.props.name; }
  get description() { return this.props.description; }
  get order() { return this.props.order; }
  get exercises() { return this.props.exercises; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  totalPlannedSets(): number {
    return this.props.exercises.reduce((sum, ex) => sum + ex.plannedSets.length, 0);
  }
}
