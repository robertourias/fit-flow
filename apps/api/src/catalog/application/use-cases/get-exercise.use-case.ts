import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { EXERCISES_REPOSITORY } from "../../catalog.tokens";
import type { IExercisesRepository } from "../../domain/repositories/exercises.repository.interface";
import type { Exercise } from "../../domain/exercise.entity";

@Injectable()
export class GetExerciseUseCase {
  constructor(
    @Inject(EXERCISES_REPOSITORY)
    private readonly _exercisesRepository: IExercisesRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<Exercise> {
    const exercise = await this._exercisesRepository.findById(id);
    // visível só se global ou do tenant
    if (!exercise || (!exercise.isGlobal() && exercise.tenantId !== tenantId)) {
      throw new NotFoundException("Exercise not found");
    }
    return exercise;
  }
}
