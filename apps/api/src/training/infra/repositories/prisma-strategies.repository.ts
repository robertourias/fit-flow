import { Injectable } from "@nestjs/common";
import { prisma, Prisma } from "@fitflow/db";
import { IStrategiesRepository } from "../../domain/repositories/strategies.repository.interface";
import { Strategy } from "../../domain/strategy.entity";
import { Workout } from "../../domain/workout.entity";
import { WorkoutExercise } from "../../domain/workout-exercise.entity";
import { PlannedSet } from "../../domain/planned-set.value-object";

const STRATEGY_INCLUDE = {
  workouts: {
    orderBy: { order: "asc" as const },
    include: {
      workoutExercises: {
        orderBy: { order: "asc" as const },
        include: { plannedSets: { orderBy: { setNumber: "asc" as const } } },
      },
    },
  },
};

type StrategyRow = Prisma.StrategyGetPayload<{
  include: {
    workouts: {
      include: {
        workoutExercises: { include: { plannedSets: true } };
      };
    };
  };
}>;

@Injectable()
export class PrismaStrategiesRepository implements IStrategiesRepository {
  async findByTenant(tenantId: string): Promise<Strategy[]> {
    const rows = await prisma.strategy.findMany({
      where: { tenantId },
      include: STRATEGY_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string, tenantId: string): Promise<Strategy | null> {
    const row = await prisma.strategy.findFirst({
      where: { id, tenantId },
      include: STRATEGY_INCLUDE,
    });
    return row ? this.toDomain(row) : null;
  }

  async findActiveByTenant(tenantId: string): Promise<Strategy | null> {
    const row = await prisma.strategy.findFirst({
      where: { tenantId, isActive: true },
      include: STRATEGY_INCLUDE,
    });
    return row ? this.toDomain(row) : null;
  }

  async create(data: Parameters<IStrategiesRepository["create"]>[0]): Promise<Strategy> {
    const row = await prisma.strategy.create({
      data: { tenantId: data.tenantId, name: data.name, type: data.type, description: data.description },
      include: STRATEGY_INCLUDE,
    });
    return this.toDomain(row);
  }

  async setActive(id: string, tenantId: string): Promise<Strategy> {
    const row = await prisma.$transaction(async (tx) => {
      await tx.strategy.updateMany({ where: { tenantId }, data: { isActive: false } });
      return tx.strategy.update({
        where: { id },
        data: { isActive: true },
        include: STRATEGY_INCLUDE,
      });
    });
    return this.toDomain(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.strategy.deleteMany({ where: { id, tenantId } });
  }

  private toDomain(row: StrategyRow): Strategy {
    return new Strategy({
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      type: row.type,
      description: row.description,
      isActive: row.isActive,
      workouts: row.workouts.map((w) =>
        new Workout({
          id: w.id,
          strategyId: w.strategyId,
          tenantId: w.tenantId,
          name: w.name,
          description: w.description,
          order: w.order,
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
          exercises: w.workoutExercises.map((we) =>
            new WorkoutExercise({
              id: we.id,
              workoutId: we.workoutId,
              exerciseId: we.exerciseId,
              order: we.order,
              restSeconds: we.restSeconds,
              notes: we.notes,
              plannedSets: we.plannedSets.map((ps) =>
                new PlannedSet({
                  id: ps.id,
                  workoutExerciseId: ps.workoutExerciseId,
                  setNumber: ps.setNumber,
                  targetReps: ps.targetReps,
                  targetKg: ps.targetKg,
                }),
              ),
            }),
          ),
        }),
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
