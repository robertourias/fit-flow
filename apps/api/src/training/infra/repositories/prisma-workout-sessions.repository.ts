import { Injectable } from "@nestjs/common";
import { prisma, Prisma } from "@fitflow/db";
import {
  ISessionExerciseInput,
  IWorkoutSessionsRepository,
} from "../../domain/repositories/workout-sessions.repository.interface";
import { WorkoutSession } from "../../domain/workout-session.entity";
import { WorkoutSessionStatus } from "../../domain/workout-session-status.enum";
import { SessionExercise } from "../../domain/session-exercise.entity";
import { ExecutedSet } from "../../domain/executed-set.value-object";

const SESSION_INCLUDE = {
  sessionExercises: {
    orderBy: { order: "asc" as const },
    include: { executedSets: { orderBy: { setNumber: "asc" as const } } },
  },
};

type SessionRow = Prisma.WorkoutSessionGetPayload<{
  include: { sessionExercises: { include: { executedSets: true } } };
}>;

function nestedExerciseCreate(
  exercises: ISessionExerciseInput[],
): Prisma.SessionExerciseUncheckedCreateWithoutSessionInput[] {
  return exercises.map((ex) => ({
    exerciseId: ex.exerciseId,
    order: ex.order,
    notes: ex.notes ?? null,
    executedSets: {
      create: ex.executedSets.map((set) => ({
        setNumber: set.setNumber,
        kg: set.kg ?? null,
        reps: set.reps ?? null,
        completedAt: set.completedAt ?? null,
      })),
    },
  }));
}

@Injectable()
export class PrismaWorkoutSessionsRepository implements IWorkoutSessionsRepository {
  async findById(id: string, tenantId: string): Promise<WorkoutSession | null> {
    const row = await prisma.workoutSession.findFirst({
      where: { id, tenantId },
      include: SESSION_INCLUDE,
    });
    return row ? this.toDomain(row) : null;
  }

  async findManyByTenant(
    opts: Parameters<IWorkoutSessionsRepository["findManyByTenant"]>[0],
  ): Promise<WorkoutSession[]> {
    const rows = await prisma.workoutSession.findMany({
      where: {
        tenantId: opts.tenantId,
        ...(opts.startedAfter ? { startedAt: { gte: opts.startedAfter } } : {}),
      },
      include: SESSION_INCLUDE,
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      take: opts.take,
      ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: opts.skip ?? 1 } : {}),
    });
    return rows.map((r) => this.toDomain(r));
  }

  async count(
    opts: Parameters<IWorkoutSessionsRepository["count"]>[0],
  ): Promise<number> {
    return prisma.workoutSession.count({
      where: {
        tenantId: opts.tenantId,
        ...(opts.startedAfter ? { startedAt: { gte: opts.startedAfter } } : {}),
      },
    });
  }

  async countFinishedByStrategy(strategyId: string, tenantId: string): Promise<number> {
    return prisma.workoutSession.count({
      where: { tenantId, status: WorkoutSessionStatus.FINISHED, workout: { strategyId } },
    });
  }

  async findFinishedSince(tenantId: string, since: Date): Promise<WorkoutSession[]> {
    const rows = await prisma.workoutSession.findMany({
      where: { tenantId, status: WorkoutSessionStatus.FINISHED, startedAt: { gte: since } },
      include: SESSION_INCLUDE,
      orderBy: [{ startedAt: "asc" }],
    });
    return rows.map((r) => this.toDomain(r));
  }

  async create(
    data: Parameters<IWorkoutSessionsRepository["create"]>[0],
  ): Promise<WorkoutSession> {
    const row = await prisma.workoutSession.create({
      data: {
        workoutId: data.workoutId,
        tenantId: data.tenantId,
        startedAt: data.startedAt,
        endedAt: data.endedAt ?? null,
        status: data.status,
        comment: data.comment ?? null,
        difficulty: data.difficulty ?? null,
        sessionExercises: { create: nestedExerciseCreate(data.exercises) },
      },
      include: SESSION_INCLUDE,
    });
    return this.toDomain(row);
  }

  async update(
    id: string,
    tenantId: string,
    data: Parameters<IWorkoutSessionsRepository["update"]>[2],
  ): Promise<WorkoutSession | null> {
    const existing = await prisma.workoutSession.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await prisma.$transaction(async (tx) => {
      await tx.workoutSession.update({
        where: { id },
        data: {
          ...(data.endedAt !== undefined && { endedAt: data.endedAt }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.comment !== undefined && { comment: data.comment }),
          ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        },
      });
      if (data.exercises !== undefined) {
        await tx.sessionExercise.deleteMany({ where: { sessionId: id } });
        for (const ex of nestedExerciseCreate(data.exercises)) {
          await tx.sessionExercise.create({ data: { ...ex, sessionId: id } });
        }
      }
      return tx.workoutSession.findUniqueOrThrow({ where: { id }, include: SESSION_INCLUDE });
    });
    return this.toDomain(row);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.workoutSession.deleteMany({ where: { id, tenantId } });
  }

  private toDomain(row: SessionRow): WorkoutSession {
    return new WorkoutSession({
      id: row.id,
      workoutId: row.workoutId,
      tenantId: row.tenantId,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
      comment: row.comment,
      difficulty: row.difficulty,
      status: row.status as WorkoutSessionStatus,
      createdAt: row.createdAt,
      exercises: row.sessionExercises.map((se) =>
        new SessionExercise({
          id: se.id,
          sessionId: se.sessionId,
          exerciseId: se.exerciseId,
          order: se.order,
          notes: se.notes,
          executedSets: se.executedSets.map((es) =>
            new ExecutedSet({
              id: es.id,
              sessionExerciseId: es.sessionExerciseId,
              setNumber: es.setNumber,
              kg: es.kg ? Number(es.kg) : null,
              reps: es.reps,
              completedAt: es.completedAt,
            }),
          ),
        }),
      ),
    });
  }
}
