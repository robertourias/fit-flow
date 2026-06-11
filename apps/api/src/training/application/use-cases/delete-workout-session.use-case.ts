import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { WORKOUT_SESSIONS_REPOSITORY } from "../../training.tokens";
import type { IWorkoutSessionsRepository } from "../../domain/repositories/workout-sessions.repository.interface";

@Injectable()
export class DeleteWorkoutSessionUseCase {
  constructor(
    @Inject(WORKOUT_SESSIONS_REPOSITORY)
    private readonly _sessionsRepository: IWorkoutSessionsRepository,
  ) {}

  async execute(id: string, tenantId: string): Promise<void> {
    const session = await this._sessionsRepository.findById(id, tenantId);
    if (!session) {
      throw new NotFoundException("Workout session not found");
    }
    await this._sessionsRepository.delete(id, tenantId);
  }
}
