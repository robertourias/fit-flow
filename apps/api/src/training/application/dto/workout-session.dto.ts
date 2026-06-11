import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { WorkoutSessionStatus } from "../../domain/workout-session-status.enum";
import type { WorkoutSession } from "../../domain/workout-session.entity";
import type { SessionExercise } from "../../domain/session-exercise.entity";
import type { ExecutedSet } from "../../domain/executed-set.value-object";

export class ExecutedSetDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  setNumber!: number;

  @ApiProperty({ nullable: true, type: Number })
  kg!: number | null;

  @ApiProperty({ nullable: true, type: Number })
  reps!: number | null;

  @ApiProperty({ nullable: true, type: String })
  completedAt!: string | null;

  static fromEntity(entity: ExecutedSet): ExecutedSetDto {
    const dto = new ExecutedSetDto();
    dto.id = entity.id;
    dto.setNumber = entity.setNumber;
    dto.kg = entity.kg ?? null;
    dto.reps = entity.reps ?? null;
    dto.completedAt = entity.completedAt ? entity.completedAt.toISOString() : null;
    return dto;
  }
}

export class SessionExerciseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  exerciseId!: string;

  @ApiProperty()
  order!: number;

  @ApiProperty({ nullable: true, type: String })
  notes!: string | null;

  @ApiProperty({ type: [ExecutedSetDto] })
  executedSets!: ExecutedSetDto[];

  static fromEntity(entity: SessionExercise): SessionExerciseDto {
    const dto = new SessionExerciseDto();
    dto.id = entity.id;
    dto.exerciseId = entity.exerciseId;
    dto.order = entity.order;
    dto.notes = entity.notes ?? null;
    dto.executedSets = entity.executedSets.map((set) => ExecutedSetDto.fromEntity(set));
    return dto;
  }
}

export class WorkoutSessionSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  workoutId!: string;

  @ApiProperty()
  startedAt!: string;

  @ApiProperty({ nullable: true, type: String })
  endedAt!: string | null;

  @ApiProperty({ enum: WorkoutSessionStatus })
  status!: WorkoutSessionStatus;

  @ApiProperty({ nullable: true, type: String })
  comment!: string | null;

  @ApiProperty({ nullable: true, type: Number })
  difficulty!: number | null;

  @ApiProperty()
  createdAt!: string;

  static fromEntity(entity: WorkoutSession): WorkoutSessionSummaryDto {
    const dto = new WorkoutSessionSummaryDto();
    dto.id = entity.id;
    dto.workoutId = entity.workoutId;
    dto.startedAt = entity.startedAt.toISOString();
    dto.endedAt = entity.endedAt ? entity.endedAt.toISOString() : null;
    dto.status = entity.status;
    dto.comment = entity.comment ?? null;
    dto.difficulty = entity.difficulty ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}

export class WorkoutSessionDetailDto extends WorkoutSessionSummaryDto {
  @ApiProperty({ type: [SessionExerciseDto] })
  exercises!: SessionExerciseDto[];

  static fromEntity(entity: WorkoutSession): WorkoutSessionDetailDto {
    const dto = new WorkoutSessionDetailDto();
    Object.assign(dto, WorkoutSessionSummaryDto.fromEntity(entity));
    dto.exercises = entity.exercises.map((exercise) => SessionExerciseDto.fromEntity(exercise));
    return dto;
  }
}

export class CreateExecutedSetDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  setNumber!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  kg?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  reps?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}

export class CreateSessionExerciseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  exerciseId!: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  order!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateExecutedSetDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateExecutedSetDto)
  executedSets!: CreateExecutedSetDto[];
}

export class CreateWorkoutSessionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workoutId!: string;

  @ApiProperty()
  @IsDateString()
  startedAt!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @ApiPropertyOptional({ enum: WorkoutSessionStatus })
  @IsOptional()
  @IsEnum(WorkoutSessionStatus)
  status?: WorkoutSessionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  difficulty?: number;

  @ApiProperty({ type: [CreateSessionExerciseDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSessionExerciseDto)
  exercises!: CreateSessionExerciseDto[];
}

export class UpdateWorkoutSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endedAt?: string;

  @ApiPropertyOptional({ enum: WorkoutSessionStatus })
  @IsOptional()
  @IsEnum(WorkoutSessionStatus)
  status?: WorkoutSessionStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  difficulty?: number;

  @ApiPropertyOptional({ type: [CreateSessionExerciseDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSessionExerciseDto)
  exercises?: CreateSessionExerciseDto[];
}
