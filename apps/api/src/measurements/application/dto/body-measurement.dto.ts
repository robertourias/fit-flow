import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import type { BodyMeasurement } from "../../domain/body-measurement.entity";

export class BodyMeasurementDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty()
  measuredAt!: string;

  @ApiProperty({ nullable: true, type: Number })
  weight!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  neck!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  chest!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  waist!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  hip!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  leftArm!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  rightArm!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  leftThigh!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  rightThigh!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  calf!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  bodyFatPct!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  muscleMassPct!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  visceralFat!: number | null;

  @ApiProperty({ nullable: true, type: String })
  notes!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromEntity(entity: BodyMeasurement): BodyMeasurementDto {
    const dto = new BodyMeasurementDto();
    dto.id = entity.id;
    dto.tenantId = entity.tenantId;
    dto.measuredAt = entity.measuredAt.toISOString();
    dto.weight = entity.weight;
    dto.neck = entity.neck;
    dto.chest = entity.chest;
    dto.waist = entity.waist;
    dto.hip = entity.hip;
    dto.leftArm = entity.leftArm;
    dto.rightArm = entity.rightArm;
    dto.leftThigh = entity.leftThigh;
    dto.rightThigh = entity.rightThigh;
    dto.calf = entity.calf;
    dto.bodyFatPct = entity.bodyFatPct;
    dto.muscleMassPct = entity.muscleMassPct;
    dto.visceralFat = entity.visceralFat;
    dto.notes = entity.notes;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class CreateBodyMeasurementDto {
  @ApiProperty({ description: "Data da medição (ISO date, pode ser retroativa)" })
  @IsDateString()
  measuredAt!: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 500 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  neck?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  chest?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  waist?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  hip?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  leftArm?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  rightArm?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  leftThigh?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  rightThigh?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  calf?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bodyFatPct?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  muscleMassPct?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 59 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(59)
  visceralFat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateBodyMeasurementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  measuredAt?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 500 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(500)
  weight?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  neck?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  chest?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  waist?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  hip?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  leftArm?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  rightArm?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  leftThigh?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  rightThigh?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 300 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(300)
  calf?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bodyFatPct?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  muscleMassPct?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 59 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(59)
  visceralFat?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
