import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { BODY_MEASUREMENTS_REPOSITORY } from "../../measurements.tokens";
import type { IBodyMeasurementsRepository } from "../../domain/repositories/body-measurements.repository.interface";
import type { UpdateBodyMeasurementDto } from "../dto/body-measurement.dto";
import { BodyMeasurementDto } from "../dto/body-measurement.dto";

@Injectable()
export class UpdateBodyMeasurementUseCase {
  constructor(
    @Inject(BODY_MEASUREMENTS_REPOSITORY)
    private readonly _repository: IBodyMeasurementsRepository,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateBodyMeasurementDto): Promise<BodyMeasurementDto> {
    const existing = await this._repository.findById(id);
    if (!existing || existing.tenantId !== tenantId) {
      throw new NotFoundException("Medição não encontrada.");
    }

    const entity = await this._repository.update(id, {
      ...(dto.measuredAt !== undefined && { measuredAt: new Date(dto.measuredAt) }),
      ...(dto.weight !== undefined && { weight: dto.weight }),
      ...(dto.neck !== undefined && { neck: dto.neck }),
      ...(dto.chest !== undefined && { chest: dto.chest }),
      ...(dto.waist !== undefined && { waist: dto.waist }),
      ...(dto.hip !== undefined && { hip: dto.hip }),
      ...(dto.leftArm !== undefined && { leftArm: dto.leftArm }),
      ...(dto.rightArm !== undefined && { rightArm: dto.rightArm }),
      ...(dto.leftThigh !== undefined && { leftThigh: dto.leftThigh }),
      ...(dto.rightThigh !== undefined && { rightThigh: dto.rightThigh }),
      ...(dto.calf !== undefined && { calf: dto.calf }),
      ...(dto.bodyFatPct !== undefined && { bodyFatPct: dto.bodyFatPct }),
      ...(dto.muscleMassPct !== undefined && { muscleMassPct: dto.muscleMassPct }),
      ...(dto.visceralFat !== undefined && { visceralFat: dto.visceralFat }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    });

    return BodyMeasurementDto.fromEntity(entity);
  }
}
