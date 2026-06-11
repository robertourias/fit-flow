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
  /**
   * Atualiza campos da estratégia do tenant. Retorna null se não pertencer ao tenant.
   * isActive=true desativa as demais estratégias do tenant na mesma transação.
   */
  update(
    id: string,
    tenantId: string,
    data: Partial<{
      name: string;
      type: string | null;
      description: string | null;
      isActive: boolean;
    }>,
  ): Promise<Strategy | null>;
  delete(id: string, tenantId: string): Promise<void>;
}
