import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { EXERCISES_REPOSITORY } from "../../catalog.tokens";
import type { IExercisesRepository } from "../../domain/repositories/exercises.repository.interface";

@Injectable()
export class ArchiveExerciseUseCase {
  constructor(
    @Inject(EXERCISES_REPOSITORY)
    private readonly _exercisesRepository: IExercisesRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const archived = await this._exercisesRepository.archive(id, tenantId);
    if (!archived) {
      throw new NotFoundException("Exercise not found");
    }
  }
}
