import { WorkoutSession } from "../workout-session.entity";
import { WorkoutSessionStatus } from "../workout-session-status.enum";

export interface IWorkoutSessionsRepository {
  findById(id: string, tenantId: string): Promise<WorkoutSession | null>;
  findByWorkout(workoutId: string, tenantId: string): Promise<WorkoutSession[]>;
  findLastByWorkout(workoutId: string, tenantId: string): Promise<WorkoutSession | null>;
  create(data: {
    workoutId: string;
    tenantId: string;
    startedAt: Date;
  }): Promise<WorkoutSession>;
  finish(
    id: string,
    tenantId: string,
    data: { endedAt: Date; comment?: string; difficulty?: number },
  ): Promise<WorkoutSession>;
  updateStatus(
    id: string,
    tenantId: string,
    status: WorkoutSessionStatus,
  ): Promise<WorkoutSession>;
}
