import { Plan } from './plan.enum'

export interface IUserProps {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  bio?: string | null
  age?: number | null
  goals: string[]
  isTrainer: boolean
  plan: Plan
  hasOnboarded: boolean
  deletedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export class User {
  constructor(private readonly props: IUserProps) {}

  get id() { return this.props.id }
  get email() { return this.props.email }
  get name() { return this.props.name }
  get avatarUrl() { return this.props.avatarUrl }
  get bio() { return this.props.bio }
  get age() { return this.props.age }
  get goals() { return this.props.goals }
  get isTrainer() { return this.props.isTrainer }
  get plan() { return this.props.plan }
  get hasOnboarded() { return this.props.hasOnboarded }
  get deletedAt() { return this.props.deletedAt }
  get createdAt() { return this.props.createdAt }
  get updatedAt() { return this.props.updatedAt }

  isFreePlan(): boolean {
    return this.props.plan === Plan.FREE
  }

  isDeleted(): boolean {
    return this.props.deletedAt != null
  }
}
