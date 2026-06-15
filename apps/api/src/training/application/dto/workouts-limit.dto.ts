import { ApiProperty } from "@nestjs/swagger";
import { Plan } from "../../../identity/domain/plan.enum";
import type { IWorkoutsLimitResult } from "../use-cases/get-workouts-limit.use-case";

export class WorkoutsLimitDto {
  @ApiProperty()
  count!: number;

  @ApiProperty({ nullable: true, type: Number })
  limit!: number | null;

  @ApiProperty({ enum: Plan })
  plan!: Plan;

  static from({ count, limit, plan }: IWorkoutsLimitResult): WorkoutsLimitDto {
    const dto = new WorkoutsLimitDto();
    dto.count = count;
    dto.limit = limit;
    dto.plan = plan;
    return dto;
  }
}
