import { Injectable } from "@nestjs/common";
import { prisma, Prisma } from "@fitflow/db";
import { IWorkoutsRepository } from "../../domain/repositories/workouts.repository.interface";
import { Workout } from "../../domain/workout.entity";
import { WorkoutExercise } from "../../domain/workout-exercise.entity";
import { PlannedSet } from "../../domain/planned-set.value-object";

const FREE_PLAN_WORKOUT_LIMIT = 6;

const WORKOUT_INCLUDE = {
  workoutExercises: {
    orderBy: { order: "asc" as const },
    include: { plannedSets: { orderBy: { setNumber: "asc" as const } } },
  },
};

type WorkoutRow = Prisma.WorkoutGetPayload<{
  include: { workoutExercises: { include: { plannedSets: true } } };
}>;

@Injectable()
export class PrismaWorkoutsRepository implements IWorkoutsRepository {
  async findByStrategy(strategyId: string, tenantId: string): Promise<Workout[]> {
    const rows = await prisma.workout.findMany({
      where: { strategyId, tenantId },
      include: WORKOUT_INCLUDE,
      orderBy: { order: "asc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string, tenantId: string): Promise<Workout | null> {
    const row = await prisma.workout.findFirst({
      where: { id, tenantId },
      include: WORKOUT_INCLUDE,
    });
    return row ? this.toDomain(row) : null;
  }

  async countByTenant(tenantId: string): Promise<number> {
    return prisma.workout.count({ where: { tenantId } });
  }

  async create(data: Parameters<IWorkoutsRepository["create"]>[0]): Promise<Workout> {
    // Secondary defense — primary validation belongs in the use case
    const count = await this.countByTenant(data.tenantId);
    if (count >= FREE_PLAN_WORKOUT_LIMIT) {
      throw new Error("PLAN_LIMIT_EXCEEDED");
    }
    const row = await prisma.workout.create({
      data: {
        strategyId: data.strategyId,
        tenantId: data.tenantId,
        name: data.name,
        description: data.description,
        order: data.order,
      },
      include: WORKOUT_INCLUDE,
    });
    return this.toDomain(row);
  }

  async update(
    id: string,
    tenantId: string,
    data: Parameters<IWorkoutsRepository["update"]>[2],
  ): Promise<Workout> {
    const row = await prisma.workout.update({
      where: { id },
      data,
      include: WORKOUT_INCLUDE,
    });
    if (row.tenantId !== tenantId) throw new Error("FORBIDDEN");
    return this.toDomain(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.workout.deleteMany({ where: { id, tenantId } });
  }

  private toDomain(row: WorkoutRow): Workout {
    return new Workout({
      id: row.id,
      strategyId: row.strategyId,
      tenantId: row.tenantId,
      name: row.name,
      description: row.description,
      order: row.order,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      exercises: row.workoutExercises.map((we) =>
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
    });
  }
}
