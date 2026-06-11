import { Inject, Injectable } from "@nestjs/common";
import { STRATEGIES_REPOSITORY } from "../../training.tokens";
import type { IStrategiesRepository } from "../../domain/repositories/strategies.repository.interface";
import type { Strategy } from "../../domain/strategy.entity";
import type { CreateStrategyDto } from "../dto/strategy.dto";

@Injectable()
export class CreateStrategyUseCase {
  constructor(
    @Inject(STRATEGIES_REPOSITORY)
    private readonly _strategiesRepository: IStrategiesRepository,
  ) {}

  async execute(tenantId: string, dto: CreateStrategyDto): Promise<Strategy> {
    return this._strategiesRepository.create({
      tenantId,
      name: dto.name,
      type: dto.type,
      description: dto.description,
    });
  }
}
