import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import type { Workout } from "../../domain/workout.entity";
import type { WorkoutExercise } from "../../domain/workout-exercise.entity";
import type { PlannedSet } from "../../domain/planned-set.value-object";

export class PlannedSetDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  setNumber!: number;

  @ApiProperty()
  targetReps!: string;

  @ApiProperty({ nullable: true, type: String })
  targetKg!: string | null;

  static fromEntity(entity: PlannedSet): PlannedSetDto {
    const dto = new PlannedSetDto();
    dto.id = entity.id;
    dto.setNumber = entity.setNumber;
    dto.targetReps = entity.targetReps;
    dto.targetKg = entity.targetKg ?? null;
    return dto;
  }
}

export class WorkoutExerciseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  exerciseId!: string;

  @ApiProperty()
  order!: number;

  @ApiProperty()
  restSeconds!: number;

  @ApiProperty({ nullable: true, type: String })
  notes!: string | null;

  @ApiProperty({ type: [PlannedSetDto] })
  plannedSets!: PlannedSetDto[];

  static fromEntity(entity: WorkoutExercise): WorkoutExerciseDto {
    const dto = new WorkoutExerciseDto();
    dto.id = entity.id;
    dto.exerciseId = entity.exerciseId;
    dto.order = entity.order;
    dto.restSeconds = entity.restSeconds;
    dto.notes = entity.notes ?? null;
    dto.plannedSets = entity.plannedSets.map((set) => PlannedSetDto.fromEntity(set));
    return dto;
  }
}

export class WorkoutSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  order!: number;

  static fromEntity(entity: Workout): WorkoutSummaryDto {
    const dto = new WorkoutSummaryDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.order = entity.order;
    return dto;
  }
}

export class WorkoutDetailDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  strategyId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true, type: String })
  description!: string | null;

  @ApiProperty()
  order!: number;

  @ApiProperty({ type: [WorkoutExerciseDto] })
  exercises!: WorkoutExerciseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromEntity(entity: Workout): WorkoutDetailDto {
    const dto = new WorkoutDetailDto();
    dto.id = entity.id;
    dto.strategyId = entity.strategyId;
    dto.name = entity.name;
    dto.description = entity.description ?? null;
    dto.order = entity.order;
    dto.exercises = entity.exercises.map((exercise) => WorkoutExerciseDto.fromEntity(exercise));
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class CreatePlannedSetDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  setNumber!: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  targetReps!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetKg?: string;
}

export class CreateWorkoutExerciseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  exerciseId!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  order!: number;

  @ApiPropertyOptional({ description: "default 90s" })
  @IsOptional()
  @IsInt()
  @Min(0)
  restSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreatePlannedSetDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePlannedSetDto)
  plannedSets!: CreatePlannedSetDto[];
}

export class CreateWorkoutDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  strategyId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  order!: number;

  @ApiProperty({ type: [CreateWorkoutExerciseDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutExerciseDto)
  exercises!: CreateWorkoutExerciseDto[];
}

export class UpdateWorkoutDto {
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
  @IsInt()
  @Min(0)
  order?: number;

  @ApiPropertyOptional({ type: [CreateWorkoutExerciseDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateWorkoutExerciseDto)
  exercises?: CreateWorkoutExerciseDto[];
}
