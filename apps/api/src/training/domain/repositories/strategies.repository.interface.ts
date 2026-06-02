import { Strategy } from "../strategy.entity";

export interface IStrategiesRepository {
  findByTenant(tenantId: string): Promise<Strategy[]>;
  findById(id: string, tenantId: string): Promise<Strategy | null>;
  findActiveByTenant(tenantId: string): Promise<Strategy | null>;
  create(data: {
    tenantId: string;
    name: string;
    type?: string;
    description?: string;
  }): Promise<Strategy>;
  setActive(id: string, tenantId: string): Promise<Strategy>;
  delete(id: string, tenantId: string): Promise<void>;
}
