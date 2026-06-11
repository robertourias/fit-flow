import { Workout } from "../workout.entity";

export interface IPlannedSetInput {
  setNumber: number;
  targetReps: string;
  targetKg?: string | null;
}

export interface IWorkoutExerciseInput {
  exerciseId: string;
  order: number;
  restSeconds?: number;
  notes?: string | null;
  plannedSets: IPlannedSetInput[];
}

export interface IWorkoutsRepository {
  findByStrategy(strategyId: string, tenantId: string): Promise<Workout[]>;
  findById(id: string, tenantId: string): Promise<Workout | null>;
  countByTenant(tenantId: string): Promise<number>;
  create(data: {
    strategyId: string;
    tenantId: string;
    name: string;
    description?: string;
    order: number;
    exercises: IWorkoutExerciseInput[];
  }): Promise<Workout>;
  /**
   * Atualiza o workout do tenant. Se `exercises` for fornecido, substitui
   * integralmente os filhos (delete + recreate). Retorna null se não pertencer ao tenant.
   */
  update(
    id: string,
    tenantId: string,
    data: Partial<{
      name: string;
      description: string | null;
      order: number;
      exercises: IWorkoutExerciseInput[];
    }>,
  ): Promise<Workout | null>;
  delete(id: string, tenantId: string): Promise<void>;
}
