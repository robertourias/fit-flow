import { Inject, Injectable } from "@nestjs/common";
import type { PaginatedResponse } from "@fitflow/types";
import { WORKOUT_SESSIONS_REPOSITORY } from "../../training.tokens";
import { USERS_REPOSITORY } from "../../../identity/identity.tokens";
import type { IWorkoutSessionsRepository } from "../../domain/repositories/workout-sessions.repository.interface";
import type { IUsersRepository } from "../../../identity/domain/repositories/users.repository.interface";
import type { WorkoutSession } from "../../domain/workout-session.entity";
import { paginate } from "../../../common/pagination/paginate";
import type { FindWorkoutSessionsQueryDto } from "../dto/find-workout-sessions-query.dto";

const RETENTION_DAYS_FREE = 60;

@Injectable()
export class ListWorkoutSessionsUseCase {
  constructor(
    @Inject(WORKOUT_SESSIONS_REPOSITORY)
    private readonly _sessionsRepository: IWorkoutSessionsRepository,
    @Inject(USERS_REPOSITORY)
    private readonly _usersRepository: IUsersRepository,
  ) {}

  async execute(
    tenantId: string,
    query: FindWorkoutSessionsQueryDto,
  ): Promise<PaginatedResponse<WorkoutSession>> {
    // Retenção de 60 dias só para plano FREE; PRO vê tudo.
    const user = await this._usersRepository.findById(tenantId);
    let startedAfter: Date | undefined;
    if (user?.isFreePlan()) {
      startedAfter = new Date(Date.now() - RETENTION_DAYS_FREE * 24 * 60 * 60 * 1000);
    }

    return paginate<WorkoutSession>({
      findPage: (args) =>
        this._sessionsRepository.findManyByTenant({
          tenantId,
          take: args.take,
          cursor: args.cursor?.id,
          skip: args.skip,
          startedAfter,
        }),
      count: () => this._sessionsRepository.count({ tenantId, startedAfter }),
      cursor: query.cursor,
      limit: query.limit,
    });
  }
}
