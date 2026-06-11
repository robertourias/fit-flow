import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { STRATEGIES_REPOSITORY } from "../../training.tokens";
import type { IStrategiesRepository } from "../../domain/repositories/strategies.repository.interface";
import type { Strategy } from "../../domain/strategy.entity";
import type { UpdateStrategyDto } from "../dto/strategy.dto";

@Injectable()
export class UpdateStrategyUseCase {
  constructor(
    @Inject(STRATEGIES_REPOSITORY)
    private readonly _strategiesRepository: IStrategiesRepository,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateStrategyDto): Promise<Strategy> {
    const updated = await this._strategiesRepository.update(id, tenantId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });
    if (!updated) {
      throw new NotFoundException("Strategy not found");
    }
    return updated;
  }
}
