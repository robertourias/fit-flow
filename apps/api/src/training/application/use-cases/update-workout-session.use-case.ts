import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { WORKOUT_SESSIONS_REPOSITORY } from "../../training.tokens";
import { EXERCISES_REPOSITORY } from "../../../catalog/catalog.tokens";
import type { IWorkoutSessionsRepository } from "../../domain/repositories/workout-sessions.repository.interface";
import type { IExercisesRepository } from "../../../catalog/domain/repositories/exercises.repository.interface";
import type { WorkoutSession } from "../../domain/workout-session.entity";
import type { UpdateWorkoutSessionDto } from "../dto/workout-session.dto";
import { validateExerciseIds } from "./validate-exercise-ids";

@Injectable()
export class UpdateWorkoutSessionUseCase {
  constructor(
    @Inject(WORKOUT_SESSIONS_REPOSITORY)
    private readonly _sessionsRepository: IWorkoutSessionsRepository,
    @Inject(EXERCISES_REPOSITORY)
    private readonly _exercisesRepository: IExercisesRepository,
  ) {}

  async execute(
    id: string,
    tenantId: string,
    dto: UpdateWorkoutSessionDto,
  ): Promise<WorkoutSession> {
    if (dto.exercises !== undefined) {
      await validateExerciseIds(
        this._exercisesRepository,
        tenantId,
        dto.exercises.map((ex) => ex.exerciseId),
      );
    }

    const updated = await this._sessionsRepository.update(id, tenantId, {
      ...(dto.endedAt !== undefined && { endedAt: new Date(dto.endedAt) }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.comment !== undefined && { comment: dto.comment }),
      ...(dto.difficulty !== undefined && { difficulty: dto.difficulty }),
      ...(dto.exercises !== undefined && {
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
      }),
    });
    if (!updated) {
      throw new NotFoundException("Workout session not found");
    }
    return updated;
  }
}
