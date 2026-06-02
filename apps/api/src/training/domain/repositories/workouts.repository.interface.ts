import { Workout } from "../workout.entity";

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
  }): Promise<Workout>;
  update(
    id: string,
    tenantId: string,
    data: Partial<{ name: string; description: string; order: number }>,
  ): Promise<Workout>;
  delete(id: string, tenantId: string): Promise<void>;
}
