import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { EXERCISES_REPOSITORY } from "../../catalog.tokens";
import type { IExercisesRepository } from "../../domain/repositories/exercises.repository.interface";
import type { Exercise } from "../../domain/exercise.entity";
import type { UpdateExerciseDto } from "../dto/exercise.dto";

@Injectable()
export class UpdateExerciseUseCase {
  constructor(
    @Inject(EXERCISES_REPOSITORY)
    private readonly _exercisesRepository: IExercisesRepository,
  ) {}

  async execute(id: string, tenantId: string, dto: UpdateExerciseDto): Promise<Exercise> {
    const updated = await this._exercisesRepository.update(id, tenantId, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
      ...(dto.videoUrl !== undefined && { videoUrl: dto.videoUrl }),
      ...(dto.category !== undefined && { category: dto.category }),
      ...(dto.muscleGroupIds !== undefined && { muscleGroupIds: dto.muscleGroupIds }),
      ...(dto.equipmentIds !== undefined && { equipmentIds: dto.equipmentIds }),
    });
    if (!updated) {
      throw new NotFoundException("Exercise not found");
    }
    return updated;
  }
}
