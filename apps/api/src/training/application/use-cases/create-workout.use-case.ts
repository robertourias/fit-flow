import {
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ApiErrorCode } from "@fitflow/types";
import {
  STRATEGIES_REPOSITORY,
  WORKOUTS_REPOSITORY,
} from "../../training.tokens";
import { EXERCISES_REPOSITORY } from "../../../catalog/catalog.tokens";
import type { IStrategiesRepository } from "../../domain/repositories/strategies.repository.interface";
import type { IWorkoutsRepository } from "../../domain/repositories/workouts.repository.interface";
import type { IExercisesRepository } from "../../../catalog/domain/repositories/exercises.repository.interface";
import type { Workout } from "../../domain/workout.entity";
import type { CreateWorkoutDto } from "../dto/workout.dto";
import { validateExerciseIds } from "./validate-exercise-ids";

const FREE_PLAN_WORKOUT_LIMIT = 6;

@Injectable()
export class CreateWorkoutUseCase {
  constructor(
    @Inject(STRATEGIES_REPOSITORY)
    private readonly _strategiesRepository: IStrategiesRepository,
    @Inject(WORKOUTS_REPOSITORY)
    private readonly _workoutsRepository: IWorkoutsRepository,
    @Inject(EXERCISES_REPOSITORY)
    private readonly _exercisesRepository: IExercisesRepository,
  ) {}

  async execute(tenantId: string, dto: CreateWorkoutDto): Promise<Workout> {
    const strategy = await this._strategiesRepository.findById(dto.strategyId, tenantId);
    if (!strategy) {
      throw new NotFoundException("Strategy not found");
    }

    const count = await this._workoutsRepository.countByTenant(tenantId);
    if (count >= FREE_PLAN_WORKOUT_LIMIT) {
      throw new UnprocessableEntityException({
        code: ApiErrorCode.PLAN_LIMIT_EXCEEDED,
        message: `Limite de ${FREE_PLAN_WORKOUT_LIMIT} treinos atingido`,
      });
    }

    await validateExerciseIds(
      this._exercisesRepository,
      tenantId,
      dto.exercises.map((ex) => ex.exerciseId),
    );

    return this._workoutsRepository.create({
      strategyId: dto.strategyId,
      tenantId,
      name: dto.name,
      description: dto.description,
      order: dto.order,
      exercises: dto.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        order: ex.order,
        restSeconds: ex.restSeconds,
        notes: ex.notes,
        plannedSets: ex.plannedSets.map((set) => ({
          setNumber: set.setNumber,
          targetReps: set.targetReps,
          targetKg: set.targetKg,
        })),
      })),
    });
  }
}
