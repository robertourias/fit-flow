import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { WORKOUTS_REPOSITORY } from "../../training.tokens";
import { EXERCISES_REPOSITORY } from "../../../catalog/catalog.tokens";
import type { IWorkoutsRepository } from "../../domain/repositories/workouts.repository.interface";
import type { IExercisesRepository } from "../../../catalog/domain/repositories/exercises.repository.interface";
import type { Workout } from "../../domain/workout.entity";
import type { UpdateWorkoutDto } from "../dto/workout.dto";
import { validateExerciseIds } from "./validate-exercise-ids";

@Injectable()
export class UpdateWorkoutUseCase {
  constructor(
    @Inject(WORKOUTS_REPOSITORY)
    private readonly _workoutsRepository: IWorkoutsRepository,
    @Inject(EXERCISES_REPOSITORY)
    private readonly _exercisesRepository: IExercisesRepository,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateWorkoutDto): Promise<Workout> {
    if (dto.exercises !== undefined) {
      await validateExerciseIds(
        this._exercisesRepository,
        tenantId,
        dto.exercises.map((ex) => ex.exerciseId),
      );
    }

    const updated = await this._workoutsRepository.update(id, tenantId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.order !== undefined && { order: dto.order }),
      ...(dto.exercises !== undefined && {
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
      }),
    });
    if (!updated) {
      throw new NotFoundException("Workout not found");
    }
    return updated;
  }
}
