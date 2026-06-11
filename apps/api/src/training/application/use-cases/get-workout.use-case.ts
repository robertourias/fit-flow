import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { WORKOUTS_REPOSITORY } from "../../training.tokens";
import type { IWorkoutsRepository } from "../../domain/repositories/workouts.repository.interface";
import type { Workout } from "../../domain/workout.entity";

@Injectable()
export class GetWorkoutUseCase {
  constructor(
    @Inject(WORKOUTS_REPOSITORY)
    private readonly _workoutsRepository: IWorkoutsRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<Workout> {
    const workout = await this._workoutsRepository.findById(id, tenantId);
    if (!workout) {
      throw new NotFoundException("Workout not found");
    }
    return workout;
  }
}
