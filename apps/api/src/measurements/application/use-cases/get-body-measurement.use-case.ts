import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BODY_MEASUREMENTS_REPOSITORY } from "../../measurements.tokens";
import type { IBodyMeasurementsRepository } from "../../domain/repositories/body-measurements.repository.interface";
import { BodyMeasurementDto } from "../dto/body-measurement.dto";

@Injectable()
export class GetBodyMeasurementUseCase {
  constructor(
    @Inject(BODY_MEASUREMENTS_REPOSITORY)
    private readonly _repository: IBodyMeasurementsRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<BodyMeasurementDto> {
    const entity = await this._repository.findById(id);
    if (!entity || entity.tenantId !== tenantId) {
      throw new NotFoundException("Medição não encontrada.");
    }
    return BodyMeasurementDto.fromEntity(entity);
  }
}
