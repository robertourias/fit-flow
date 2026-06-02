import { Workout } from "./workout.entity";

export interface IStrategyProps {
  id: string;
  tenantId: string;
  name: string;
  type?: string | null;
  description?: string | null;
  isActive: boolean;
  workouts: Workout[];
  createdAt: Date;
  updatedAt: Date;
}

export class Strategy {
  constructor(private readonly props: IStrategyProps) {}

  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get name() { return this.props.name; }
  get type() { return this.props.type; }
  get description() { return this.props.description; }
  get isActive() { return this.props.isActive; }
  get workouts() { return this.props.workouts; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}
