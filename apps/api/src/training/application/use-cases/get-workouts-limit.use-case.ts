import { Inject, Injectable } from "@nestjs/common";
import { WORKOUTS_REPOSITORY } from "../../training.tokens";
import { USERS_REPOSITORY } from "../../../identity/identity.tokens";
import type { IWorkoutsRepository } from "../../domain/repositories/workouts.repository.interface";
import type { IUsersRepository } from "../../../identity/domain/repositories/users.repository.interface";
import { Plan } from "../../../identity/domain/plan.enum";
import { FREE_PLAN_WORKOUT_LIMIT } from "./plan-limits.constants";

export interface IWorkoutsLimitResult {
  count: number;
  limit: number | null;
  plan: Plan;
}

@Injectable()
export class GetWorkoutsLimitUseCase {
  constructor(
    @Inject(WORKOUTS_REPOSITORY)
    private readonly _workoutsRepository: IWorkoutsRepository,
    @Inject(USERS_REPOSITORY)
    private readonly _usersRepository: IUsersRepository,
  ) {}

  async execute(tenantId: string): Promise<IWorkoutsLimitResult> {
    const [count, user] = await Promise.all([
      this._workoutsRepository.countByTenant(tenantId),
      this._usersRepository.findById(tenantId),
    ]);

    const plan = user?.plan ?? Plan.FREE;
    const limit = (user?.isFreePlan() ?? true) ? FREE_PLAN_WORKOUT_LIMIT : null;

    return { count, limit, plan };
  }
}
