import { WorkoutSession } from "../workout-session.entity";
import { WorkoutSessionStatus } from "../workout-session-status.enum";

export interface IExecutedSetInput {
  setNumber: number;
  kg?: number | null;
  reps?: number | null;
  completedAt?: Date | null;
}

export interface ISessionExerciseInput {
  exerciseId: string;
  order: number;
  notes?: string | null;
  executedSets: IExecutedSetInput[];
}

export interface IWorkoutSessionsRepository {
  findById(id: string, tenantId: string): Promise<WorkoutSession | null>;
  /** Página do tenant, ordenada por startedAt desc, id desc. startedAfter filtra retenção (plano FREE). */
  findManyByTenant(opts: {
    tenantId: string;
    take: number;
    cursor?: string;
    skip?: number;
    startedAfter?: Date;
    workoutId?: string;
  }): Promise<WorkoutSession[]>;
  count(opts: { tenantId: string; startedAfter?: Date; workoutId?: string }): Promise<number>;
  /** Total de sessões FINISHED cujo Workout pertence a strategyId, no tenant. */
  countFinishedByStrategy(strategyId: string, tenantId: string): Promise<number>;
  /** Sessões FINISHED do tenant com startedAt >= since, com exercises/executedSets, orderBy startedAt asc. */
  findFinishedSince(tenantId: string, since: Date): Promise<WorkoutSession[]>;
  create(data: {
    workoutId: string;
    tenantId: string;
    startedAt: Date;
    endedAt?: Date | null;
    status: WorkoutSessionStatus;
    comment?: string | null;
    difficulty?: number | null;
    exercises: ISessionExerciseInput[];
  }): Promise<WorkoutSession>;
  /**
   * Atualiza a sessão do tenant. Se `exercises` for fornecido, substitui integralmente
   * os filhos (delete + recreate). Retorna null se não pertencer ao tenant.
   */
  update(
    id: string,
    tenantId: string,
    data: Partial<{
      endedAt: Date | null;
      status: WorkoutSessionStatus;
      comment: string | null;
      difficulty: number | null;
      exercises: ISessionExerciseInput[];
    }>,
  ): Promise<WorkoutSession | null>;
  delete(id: string, tenantId: string): Promise<void>;
}
