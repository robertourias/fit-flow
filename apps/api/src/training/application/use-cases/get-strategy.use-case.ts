import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { STRATEGIES_REPOSITORY } from "../../training.tokens";
import type { IStrategiesRepository } from "../../domain/repositories/strategies.repository.interface";
import type { Strategy } from "../../domain/strategy.entity";

@Injectable()
export class GetStrategyUseCase {
  constructor(
    @Inject(STRATEGIES_REPOSITORY)
    private readonly _strategiesRepository: IStrategiesRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<Strategy> {
    const strategy = await this._strategiesRepository.findById(id, tenantId);
    if (!strategy) {
      throw new NotFoundException("Strategy not found");
    }
    return strategy;
  }
}
