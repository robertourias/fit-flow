import { Inject, Injectable } from "@nestjs/common";
import { STRATEGIES_REPOSITORY, WORKOUT_SESSIONS_REPOSITORY } from "../../training.tokens";
import { EXERCISES_REPOSITORY } from "../../../catalog/catalog.tokens";
import type { IStrategiesRepository } from "../../domain/repositories/strategies.repository.interface";
import type { IWorkoutSessionsRepository } from "../../domain/repositories/workout-sessions.repository.interface";
import type { IExercisesRepository } from "../../../catalog/domain/repositories/exercises.repository.interface";
import { ActiveWorkoutDto } from "../dto/active-workout.dto";

@Injectable()
export class GetActiveWorkoutUseCase {
  constructor(
    @Inject(STRATEGIES_REPOSITORY)
    private readonly _strategiesRepository: IStrategiesRepository,
    @Inject(WORKOUT_SESSIONS_REPOSITORY)
    private readonly _workoutSessionsRepository: IWorkoutSessionsRepository,
    @Inject(EXERCISES_REPOSITORY)
    private readonly _exercisesRepository: IExercisesRepository,
  ) {}

  async execute(tenantId: string): Promise<ActiveWorkoutDto | null> {
    const strategy = await this._strategiesRepository.findActiveByTenant(tenantId);
    if (!strategy || strategy.workouts.length === 0) {
      return null;
    }

    const total = await this._workoutSessionsRepository.countFinishedByStrategy(
      strategy.id,
      tenantId,
    );
    const idx = total % strategy.workouts.length;
    const today = strategy.workouts[idx];

    const exercicios = await Promise.all(
      today.exercises.map(async (we) => {
        const exercise = await this._exercisesRepository.findById(we.exerciseId);
        return exercise?.name ?? "Exercício";
      }),
    );

    const proximos =
      strategy.workouts.length > 1
        ? [1, 2].map((offset) => {
            const w = strategy.workouts[(idx + offset) % strategy.workouts.length];
            return { id: w.id, nome: w.name, numExercicios: w.exercises.length, order: w.order };
          })
        : [];

    const dto = new ActiveWorkoutDto();
    dto.estrategiaNome = strategy.name;
    dto.workout = { id: today.id, nome: today.name, exercicios, order: today.order };
    dto.proximos = proximos;
    return dto;
  }
}
