import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { WORKOUTS_REPOSITORY, WORKOUT_SESSIONS_REPOSITORY } from "../../training.tokens";
import { EXERCISES_REPOSITORY } from "../../../catalog/catalog.tokens";
import type { IWorkoutsRepository } from "../../domain/repositories/workouts.repository.interface";
import type { IWorkoutSessionsRepository } from "../../domain/repositories/workout-sessions.repository.interface";
import type { IExercisesRepository } from "../../../catalog/domain/repositories/exercises.repository.interface";
import type { WorkoutSession } from "../../domain/workout-session.entity";
import { WorkoutSessionStatus } from "../../domain/workout-session-status.enum";
import type { CreateWorkoutSessionDto } from "../dto/workout-session.dto";
import { validateExerciseIds } from "./validate-exercise-ids";

@Injectable()
export class CreateWorkoutSessionUseCase {
  constructor(
    @Inject(WORKOUT_SESSIONS_REPOSITORY)
    private readonly _sessionsRepository: IWorkoutSessionsRepository,
    @Inject(WORKOUTS_REPOSITORY)
    private readonly _workoutsRepository: IWorkoutsRepository,
    @Inject(EXERCISES_REPOSITORY)
    private readonly _exercisesRepository: IExercisesRepository,
  ) {}

  async execute(tenantId: string, dto: CreateWorkoutSessionDto): Promise<WorkoutSession> {
    const workout = await this._workoutsRepository.findById(dto.workoutId, tenantId);
    if (!workout) {
      throw new NotFoundException("Workout not found");
    }

    await validateExerciseIds(
      this._exercisesRepository,
      tenantId,
      dto.exercises.map((ex) => ex.exerciseId),
    );

    // status default: FINISHED se endedAt informado, senão ACTIVE
    const status =
      dto.status ??
      (dto.endedAt ? WorkoutSessionStatus.FINISHED : WorkoutSessionStatus.ACTIVE);

    return this._sessionsRepository.create({
      workoutId: dto.workoutId,
      tenantId,
      startedAt: new Date(dto.startedAt),
      endedAt: dto.endedAt ? new Date(dto.endedAt) : null,
      status,
      comment: dto.comment,
      difficulty: dto.difficulty,
      exercises: dto.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        order: ex.order,
        notes: ex.notes,
        executedSets: ex.executedSets.map((set) => ({
          setNumber: set.setNumber,
          kg: set.kg,
          reps: set.reps,
          completedAt: set.completedAt ? new Date(set.completedAt) : null,
        })),
      })),
    });
  }
}
