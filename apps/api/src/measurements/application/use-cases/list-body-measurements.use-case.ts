import { Inject, Injectable } from "@nestjs/common";
import type { PaginatedResponse } from "@fitflow/types";
import { BODY_MEASUREMENTS_REPOSITORY } from "../../measurements.tokens";
import { USERS_REPOSITORY } from "../../../identity/identity.tokens";
import type { IBodyMeasurementsRepository } from "../../domain/repositories/body-measurements.repository.interface";
import type { IUsersRepository } from "../../../identity/domain/repositories/users.repository.interface";
import type { BodyMeasurement } from "../../domain/body-measurement.entity";
import { paginate } from "../../../common/pagination/paginate";
import type { FindBodyMeasurementsQueryDto } from "../dto/find-body-measurements-query.dto";

const RETENTION_DAYS_FREE = 60;

@Injectable()
export class ListBodyMeasurementsUseCase {
  constructor(
    @Inject(BODY_MEASUREMENTS_REPOSITORY)
    private readonly _repository: IBodyMeasurementsRepository,
    @Inject(USERS_REPOSITORY)
    private readonly _usersRepository: IUsersRepository,
  ) {}

  async execute(
    tenantId: string,
    query: FindBodyMeasurementsQueryDto,
  ): Promise<PaginatedResponse<BodyMeasurement>> {
    const user = await this._usersRepository.findById(tenantId);
    let measuredAfter: Date | undefined;
    if (user?.isFreePlan()) {
      measuredAfter = new Date(Date.now() - RETENTION_DAYS_FREE * 24 * 60 * 60 * 1000);
    }

    return paginate<BodyMeasurement>({
      findPage: (args) =>
        this._repository.findManyByTenant({
          tenantId,
          take: args.take,
          cursor: args.cursor?.id,
          skip: args.skip,
          measuredAfter,
        }),
      count: () => this._repository.count({ tenantId, measuredAfter }),
      cursor: query.cursor,
      limit: query.limit,
    });
  }
}
