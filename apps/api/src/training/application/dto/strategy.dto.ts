import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { WorkoutDetailDto, WorkoutSummaryDto } from "./workout.dto";
import type { Strategy } from "../../domain/strategy.entity";

export class StrategySummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true, type: String })
  type!: string | null;

  @ApiProperty({ nullable: true, type: String })
  description!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: [WorkoutSummaryDto] })
  workouts!: WorkoutSummaryDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromEntity(entity: Strategy): StrategySummaryDto {
    const dto = new StrategySummaryDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.type = entity.type ?? null;
    dto.description = entity.description ?? null;
    dto.isActive = entity.isActive;
    dto.workouts = entity.workouts.map((workout) => WorkoutSummaryDto.fromEntity(workout));
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class StrategyDetailDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true, type: String })
  type!: string | null;

  @ApiProperty({ nullable: true, type: String })
  description!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: [WorkoutDetailDto] })
  workouts!: WorkoutDetailDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromEntity(entity: Strategy): StrategyDetailDto {
    const dto = new StrategyDetailDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.type = entity.type ?? null;
    dto.description = entity.description ?? null;
    dto.isActive = entity.isActive;
    dto.workouts = entity.workouts.map((workout) => WorkoutDetailDto.fromEntity(workout));
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class CreateStrategyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateStrategyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
