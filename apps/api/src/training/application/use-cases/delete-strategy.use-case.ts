import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { STRATEGIES_REPOSITORY } from "../../training.tokens";
import type { IStrategiesRepository } from "../../domain/repositories/strategies.repository.interface";

@Injectable()
export class DeleteStrategyUseCase {
  constructor(
    @Inject(STRATEGIES_REPOSITORY)
    private readonly _strategiesRepository: IStrategiesRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const strategy = await this._strategiesRepository.findById(id, tenantId);
    if (!strategy) {
      throw new NotFoundException("Strategy not found");
    }
    await this._strategiesRepository.delete(id, tenantId);
  }
}
