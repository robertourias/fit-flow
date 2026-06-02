import { Injectable } from "@nestjs/common";
import { prisma, Prisma } from "@fitflow/db";
import { IWorkoutSessionsRepository } from "../../domain/repositories/workout-sessions.repository.interface";
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

@Injectable()
export class PrismaWorkoutSessionsRepository implements IWorkoutSessionsRepository {
  async findById(id: string, tenantId: string): Promise<WorkoutSession | null> {
    const row = await prisma.workoutSession.findFirst({
      where: { id, tenantId },
      include: SESSION_INCLUDE,
    });
    return row ? this.toDomain(row) : null;
  }

  async findByWorkout(workoutId: string, tenantId: string): Promise<WorkoutSession[]> {
    const rows = await prisma.workoutSession.findMany({
      where: { workoutId, tenantId },
      include: SESSION_INCLUDE,
      orderBy: { startedAt: "desc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findLastByWorkout(workoutId: string, tenantId: string): Promise<WorkoutSession | null> {
    const row = await prisma.workoutSession.findFirst({
      where: { workoutId, tenantId, status: WorkoutSessionStatus.FINISHED },
      include: SESSION_INCLUDE,
      orderBy: { startedAt: "desc" },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(data: Parameters<IWorkoutSessionsRepository["create"]>[0]): Promise<WorkoutSession> {
    const row = await prisma.workoutSession.create({
      data: {
        workoutId: data.workoutId,
        tenantId: data.tenantId,
        startedAt: data.startedAt,
      },
      include: SESSION_INCLUDE,
    });
    return this.toDomain(row);
  }

  async finish(
    id: string,
    tenantId: string,
    data: Parameters<IWorkoutSessionsRepository["finish"]>[2],
  ): Promise<WorkoutSession> {
    const row = await prisma.workoutSession.update({
      where: { id },
      data: {
        endedAt: data.endedAt,
        comment: data.comment,
        difficulty: data.difficulty,
        status: WorkoutSessionStatus.FINISHED,
      },
      include: SESSION_INCLUDE,
    });
    if (row.tenantId !== tenantId) throw new Error("FORBIDDEN");
    return this.toDomain(row);
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: WorkoutSessionStatus,
  ): Promise<WorkoutSession> {
    const row = await prisma.workoutSession.update({
      where: { id },
      data: { status },
      include: SESSION_INCLUDE,
    });
    if (row.tenantId !== tenantId) throw new Error("FORBIDDEN");
    return this.toDomain(row);
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
