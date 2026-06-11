import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { WORKOUTS_REPOSITORY } from "../../training.tokens";
import type { IWorkoutsRepository } from "../../domain/repositories/workouts.repository.interface";

@Injectable()
export class DeleteWorkoutUseCase {
  constructor(
    @Inject(WORKOUTS_REPOSITORY)
    private readonly _workoutsRepository: IWorkoutsRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const workout = await this._workoutsRepository.findById(id, tenantId);
    if (!workout) {
      throw new NotFoundException("Workout not found");
    }
    await this._workoutsRepository.delete(id, tenantId);
  }
}
