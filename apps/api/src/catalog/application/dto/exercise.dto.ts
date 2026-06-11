import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { ExerciseCategory } from "../../domain/exercise-category.enum";
import type { Exercise } from "../../domain/exercise.entity";

class ExerciseMuscleGroupDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  isPrimary!: boolean;
}

class ExerciseEquipmentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

export class ExerciseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true, type: String })
  description!: string | null;

  @ApiProperty({ nullable: true, type: String })
  imageUrl!: string | null;

  @ApiProperty({ nullable: true, type: String })
  videoUrl!: string | null;

  @ApiProperty({ enum: ExerciseCategory })
  category!: ExerciseCategory;

  @ApiProperty()
  isArchived!: boolean;

  @ApiProperty({ nullable: true, type: String })
  tenantId!: string | null;

  @ApiProperty({ type: [ExerciseMuscleGroupDto] })
  muscleGroups!: ExerciseMuscleGroupDto[];

  @ApiProperty({ type: [ExerciseEquipmentDto] })
  equipment!: ExerciseEquipmentDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromEntity(entity: Exercise): ExerciseDto {
    const dto = new ExerciseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.imageUrl = entity.imageUrl ?? null;
    dto.videoUrl = entity.videoUrl ?? null;
    dto.category = entity.category;
    dto.isArchived = entity.isArchived;
    dto.tenantId = entity.tenantId ?? null;
    dto.muscleGroups = entity.muscleGroups.map((m) => ({
      id: m.muscleGroup.id,
      name: m.muscleGroup.name,
      slug: m.muscleGroup.slug,
      isPrimary: m.isPrimary,
    }));
    dto.equipment = entity.equipment.map((e) => ({ id: e.id, name: e.name, slug: e.slug }));
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class ExerciseMuscleGroupInputDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id!: string;

  @ApiProperty()
  @IsBoolean()
  isPrimary!: boolean;
}

export class CreateExerciseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({ enum: ExerciseCategory })
  @IsEnum(ExerciseCategory)
  category!: ExerciseCategory;

  @ApiProperty({ type: [ExerciseMuscleGroupInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExerciseMuscleGroupInputDto)
  muscleGroupIds!: ExerciseMuscleGroupInputDto[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  equipmentIds!: string[];
}

export class UpdateExerciseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ enum: ExerciseCategory })
  @IsOptional()
  @IsEnum(ExerciseCategory)
  category?: ExerciseCategory;

  @ApiPropertyOptional({ type: [ExerciseMuscleGroupInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExerciseMuscleGroupInputDto)
  muscleGroupIds?: ExerciseMuscleGroupInputDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipmentIds?: string[];
}
