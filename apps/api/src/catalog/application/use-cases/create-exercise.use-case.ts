import { Inject, Injectable } from "@nestjs/common";
import { EXERCISES_REPOSITORY } from "../../catalog.tokens";
import type { IExercisesRepository } from "../../domain/repositories/exercises.repository.interface";
import type { Exercise } from "../../domain/exercise.entity";
import type { CreateExerciseDto } from "../dto/exercise.dto";

@Injectable()
export class CreateExerciseUseCase {
  constructor(
    @Inject(EXERCISES_REPOSITORY)
    private readonly _exercisesRepository: IExercisesRepository,
  ) {}

  async execute(tenantId: string, dto: CreateExerciseDto): Promise<Exercise> {
    return this._exercisesRepository.create({
      tenantId,
      name: dto.name,
      description: dto.description,
      imageUrl: dto.imageUrl,
      videoUrl: dto.videoUrl,
      category: dto.category,
      muscleGroupIds: dto.muscleGroupIds,
      equipmentIds: dto.equipmentIds,
    });
  }
}
