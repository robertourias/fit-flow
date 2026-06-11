import { Inject, Injectable } from "@nestjs/common";
import { STRATEGIES_REPOSITORY } from "../../training.tokens";
import type { IStrategiesRepository } from "../../domain/repositories/strategies.repository.interface";
import type { Strategy } from "../../domain/strategy.entity";

@Injectable()
export class ListStrategiesUseCase {
  constructor(
    @Inject(STRATEGIES_REPOSITORY)
    private readonly _strategiesRepository: IStrategiesRepository,
  ) {}

  async execute(tenantId: string): Promise<Strategy[]> {
    return this._strategiesRepository.findByTenant(tenantId);
  }
}
