import { Inject, Injectable } from "@nestjs/common";
import { MUSCLE_GROUPS_REPOSITORY } from "../../catalog.tokens";
import type { IMuscleGroupsRepository } from "../../domain/repositories/muscle-groups.repository.interface";
import type { MuscleGroup } from "../../domain/muscle-group.entity";

@Injectable()
export class ListMuscleGroupsUseCase {
  constructor(
    @Inject(MUSCLE_GROUPS_REPOSITORY)
    private readonly _muscleGroupsRepository: IMuscleGroupsRepository,
  ) {}

  async execute(): Promise<MuscleGroup[]> {
    return this._muscleGroupsRepository.findAll();
  }
}
