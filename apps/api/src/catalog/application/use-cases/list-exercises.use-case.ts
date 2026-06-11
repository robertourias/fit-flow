import { Inject, Injectable } from "@nestjs/common";
import type { PaginatedResponse } from "@fitflow/types";
import { EXERCISES_REPOSITORY } from "../../catalog.tokens";
import type { IExercisesRepository } from "../../domain/repositories/exercises.repository.interface";
import type { Exercise } from "../../domain/exercise.entity";
import { paginate } from "../../../common/pagination/paginate";
import type { FindExercisesQueryDto } from "../dto/find-exercises-query.dto";

@Injectable()
export class ListExercisesUseCase {
  constructor(
    @Inject(EXERCISES_REPOSITORY)
    private readonly _exercisesRepository: IExercisesRepository,
  ) {}

  async execute(tenantId: string, query: FindExercisesQueryDto): Promise<PaginatedResponse<Exercise>> {
    const filters = {
      tenantId,
      search: query.search,
      muscleGroupSlug: query.muscleGroupSlug,
      equipmentSlug: query.equipmentSlug,
      category: query.category,
      includeArchived: query.includeArchived,
    };
    return paginate<Exercise>({
      findPage: (args) =>
        this._exercisesRepository.findMany({
          ...filters,
          take: args.take,
          cursor: args.cursor?.id,
          skip: args.skip,
        }),
      count: () => this._exercisesRepository.count(filters),
      cursor: query.cursor,
      limit: query.limit,
    });
  }
}
