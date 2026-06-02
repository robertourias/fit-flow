import { ExecutedSet } from "./executed-set.value-object";

export interface ISessionExerciseProps {
  id: string;
  sessionId: string;
  exerciseId: string;
  order: number;
  notes?: string | null;
  executedSets: ExecutedSet[];
}

export class SessionExercise {
  constructor(private readonly props: ISessionExerciseProps) {}

  get id() { return this.props.id; }
  get sessionId() { return this.props.sessionId; }
  get exerciseId() { return this.props.exerciseId; }
  get order() { return this.props.order; }
  get notes() { return this.props.notes; }
  get executedSets() { return this.props.executedSets; }

  completedSetsCount(): number {
    return this.props.executedSets.filter((s) => s.isCompleted()).length;
  }
}
