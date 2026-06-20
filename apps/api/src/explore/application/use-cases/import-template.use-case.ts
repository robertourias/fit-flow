import { ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@fitflow/db";
import { STRATEGIES_REPOSITORY, WORKOUTS_REPOSITORY } from "../../../training/training.module";
import { USERS_REPOSITORY } from "../../../identity/identity.module";
import { FREE_PLAN_WORKOUT_LIMIT } from "../../../training/application/use-cases/plan-limits.constants";
import { StrategySummaryDto } from "../../../training/application/dto/strategy.dto";
import type { IStrategiesRepository } from "../../../training/domain/repositories/strategies.repository.interface";
import type { IWorkoutsRepository } from "../../../training/domain/repositories/workouts.repository.interface";
import type { IUsersRepository } from "../../../identity/domain/repositories/users.repository.interface";

@Injectable()
export class ImportTemplateUseCase {
  constructor(
    @Inject(STRATEGIES_REPOSITORY) private readonly _strategiesRepo: IStrategiesRepository,
    @Inject(WORKOUTS_REPOSITORY) private readonly _workoutsRepo: IWorkoutsRepository,
    @Inject(USERS_REPOSITORY) private readonly _usersRepo: IUsersRepository,
  ) {}

  async execute(templateId: string, tenantId: string): Promise<StrategySummaryDto> {
    // 1. Buscar template com workouts + exercises + plannedSets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const template = await (prisma.strategy as any).findFirst({
      where: { id: templateId, isTemplate: true },
      include: {
        workouts: {
          orderBy: { order: "asc" },
          include: {
            workoutExercises: {
              orderBy: { order: "asc" },
              include: { plannedSets: { orderBy: { setNumber: "asc" } } },
            },
          },
        },
      },
    });
    if (!template) throw new NotFoundException("Template não encontrado");

    // 2. Checar limite FREE
    const [existingCount, user] = await Promise.all([
      this._workoutsRepo.countByTenant(tenantId),
      this._usersRepo.findById(tenantId),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const templateWorkoutsCount: number = (template as any).workouts?.length ?? 0;
    if ((user?.isFreePlan() ?? true) && existingCount + templateWorkoutsCount > FREE_PLAN_WORKOUT_LIMIT) {
      throw new ForbiddenException(
        `Limite de ${FREE_PLAN_WORKOUT_LIMIT} treinos atingido no plano gratuito. Faça upgrade para PRO ou remova treinos existentes.`,
      );
    }

    // 3. Criar cópia da estratégia para o tenant
    const newStrategy = await this._strategiesRepo.create({
      tenantId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      name: (template as any).name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: (template as any).type ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      description: (template as any).description ?? undefined,
    });

    // 4. Criar cópia de cada workout com exercises + sets
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const wo of ((template as any).workouts ?? [])) {
      await this._workoutsRepo.create({
        strategyId: newStrategy.id,
        tenantId,
        name: wo.name,
        description: wo.description ?? undefined,
        order: wo.order,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        exercises: (wo.workoutExercises ?? []).map((we: any) => ({
          exerciseId: we.exerciseId,
          order: we.order,
          restSeconds: we.restSeconds,
          notes: we.notes ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          plannedSets: (we.plannedSets ?? []).map((ps: any) => ({
            setNumber: ps.setNumber,
            targetReps: ps.targetReps,
            targetKg: ps.targetKg ?? null,
          })),
        })),
      });
    }

    // 5. Recarregar estratégia com workouts para retornar DTO completo
    const loaded = await this._strategiesRepo.findById(newStrategy.id, tenantId);
    return StrategySummaryDto.fromEntity(loaded!);
  }
}
