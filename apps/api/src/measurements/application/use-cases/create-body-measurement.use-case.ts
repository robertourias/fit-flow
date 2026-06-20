import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { BODY_MEASUREMENTS_REPOSITORY } from "../../measurements.tokens";
import type { IBodyMeasurementsRepository } from "../../domain/repositories/body-measurements.repository.interface";
import type { CreateBodyMeasurementDto } from "../dto/body-measurement.dto";
import { BodyMeasurementDto } from "../dto/body-measurement.dto";

const MEASUREMENT_FIELDS = [
  "weight", "neck", "chest", "waist", "hip",
  "leftArm", "rightArm", "leftThigh", "rightThigh", "calf",
  "bodyFatPct", "muscleMassPct", "visceralFat",
] as const;

@Injectable()
export class CreateBodyMeasurementUseCase {
  constructor(
    @Inject(BODY_MEASUREMENTS_REPOSITORY)
    private readonly _repository: IBodyMeasurementsRepository,
  ) {}

  async execute(tenantId: string, dto: CreateBodyMeasurementDto): Promise<BodyMeasurementDto> {
    const hasAny = MEASUREMENT_FIELDS.some((f) => dto[f] != null);
    if (!hasAny) {
      throw new BadRequestException("Informe ao menos um campo de medição.");
    }

    const entity = await this._repository.create({
      tenantId,
      measuredAt: new Date(dto.measuredAt),
      weight: dto.weight ?? null,
      neck: dto.neck ?? null,
      chest: dto.chest ?? null,
      waist: dto.waist ?? null,
      hip: dto.hip ?? null,
      leftArm: dto.leftArm ?? null,
      rightArm: dto.rightArm ?? null,
      leftThigh: dto.leftThigh ?? null,
      rightThigh: dto.rightThigh ?? null,
      calf: dto.calf ?? null,
      bodyFatPct: dto.bodyFatPct ?? null,
      muscleMassPct: dto.muscleMassPct ?? null,
      visceralFat: dto.visceralFat ?? null,
      notes: dto.notes ?? null,
    });

    return BodyMeasurementDto.fromEntity(entity);
  }
}
