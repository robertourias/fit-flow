import { Plan } from "./plan.enum";

export interface IUserProps {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  isTrainer: boolean;
  plan: Plan;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(private readonly props: IUserProps) {}

  get id() { return this.props.id; }
  get email() { return this.props.email; }
  get name() { return this.props.name; }
  get avatarUrl() { return this.props.avatarUrl; }
  get isTrainer() { return this.props.isTrainer; }
  get plan() { return this.props.plan; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  isFreePlan(): boolean {
    return this.props.plan === Plan.FREE;
  }
}
