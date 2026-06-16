import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BODY_MEASUREMENTS_REPOSITORY } from "../../measurements.tokens";
import type { IBodyMeasurementsRepository } from "../../domain/repositories/body-measurements.repository.interface";

@Injectable()
export class DeleteBodyMeasurementUseCase {
  constructor(
    @Inject(BODY_MEASUREMENTS_REPOSITORY)
    private readonly _repository: IBodyMeasurementsRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const existing = await this._repository.findById(id);
    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException("Medição não encontrada.");
    }
    await this._repository.delete(id);
  }
}
