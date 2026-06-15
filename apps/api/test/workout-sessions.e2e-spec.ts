import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { ApiErrorCode } from "@fitflow/types";
import { createTestApp, authHeader, fakeDecode } from "./e2e-utils";
import {
  WORKOUTS_REPOSITORY,
  WORKOUT_SESSIONS_REPOSITORY,
} from "../src/training/training.tokens";
import { EXERCISES_REPOSITORY } from "../src/catalog/catalog.tokens";
import { USERS_REPOSITORY } from "../src/identity/identity.tokens";
import { WorkoutSession } from "../src/training/domain/workout-session.entity";
import { WorkoutSessionStatus } from "../src/training/domain/workout-session-status.enum";
import { SessionExercise } from "../src/training/domain/session-exercise.entity";
import { ExecutedSet } from "../src/training/domain/executed-set.value-object";
import { Workout } from "../src/training/domain/workout.entity";
import { Exercise } from "../src/catalog/domain/exercise.entity";
import { ExerciseCategory } from "../src/catalog/domain/exercise-category.enum";
import { User } from "../src/identity/domain/user.entity";
import { Plan } from "../src/identity/domain/plan.enum";
import type {
  ISessionExerciseInput,
  IWorkoutSessionsRepository,
} from "../src/training/domain/repositories/workout-sessions.repository.interface";
import type { IWorkoutsRepository } from "../src/training/domain/repositories/workouts.repository.interface";
import type { IExercisesRepository } from "../src/catalog/domain/repositories/exercises.repository.interface";
import type { IUsersRepository } from "../src/identity/domain/repositories/users.repository.interface";

jest.mock("@auth/core/jwt", () => ({
  decode: jest.fn((args: { token: string }) => fakeDecode(args)),
}));

interface SessionRecord {
  id: string;
  workoutId: string;
  tenantId: string;
  startedAt: Date;
  endedAt: Date | null;
  status: WorkoutSessionStatus;
  comment: string | null;
  difficulty: number | null;
  exercises: ISessionExerciseInput[];
  createdAt: Date;
}

function toEntity(rec: SessionRecord): WorkoutSession {
  return new WorkoutSession({
    id: rec.id,
    workoutId: rec.workoutId,
    tenantId: rec.tenantId,
    startedAt: rec.startedAt,
    endedAt: rec.endedAt,
    comment: rec.comment,
    difficulty: rec.difficulty,
    status: rec.status,
    createdAt: rec.createdAt,
    exercises: rec.exercises.map(
      (ex, i) =>
        new SessionExercise({
          id: `se-${rec.id}-${i}`,
          sessionId: rec.id,
          exerciseId: ex.exerciseId,
          order: ex.order,
          notes: ex.notes ?? null,
          executedSets: ex.executedSets.map(
            (es, j) =>
              new ExecutedSet({
                id: `es-${rec.id}-${i}-${j}`,
                sessionExerciseId: `se-${rec.id}-${i}`,
                setNumber: es.setNumber,
                kg: es.kg ?? null,
                reps: es.reps ?? null,
                completedAt: es.completedAt ?? null,
              }),
          ),
        }),
    ),
  });
}

class FakeSessionsRepository implements IWorkoutSessionsRepository {
  private _seq = 0;
  constructor(private readonly _sessions: Map<string, SessionRecord>) {}

  async findById(id: string, tenantId: string): Promise<WorkoutSession | null> {
    const rec = this._sessions.get(id);
    return rec && rec.tenantId === tenantId ? toEntity(rec) : null;
  }

  private _filtered(opts: {
    tenantId: string;
    startedAfter?: Date;
    workoutId?: string;
  }): SessionRecord[] {
    return [...this._sessions.values()]
      .filter((s) => s.tenantId === opts.tenantId)
      .filter((s) => !opts.startedAfter || s.startedAt.getTime() >= opts.startedAfter.getTime())
      .filter((s) => !opts.workoutId || s.workoutId === opts.workoutId)
      .sort((a, b) => {
        const t = b.startedAt.getTime() - a.startedAt.getTime();
        return t !== 0 ? t : b.id.localeCompare(a.id);
      });
  }

  async findManyByTenant(
    opts: Parameters<IWorkoutSessionsRepository["findManyByTenant"]>[0],
  ): Promise<WorkoutSession[]> {
    const sorted = this._filtered(opts);
    let start = 0;
    if (opts.cursor) {
      const idx = sorted.findIndex((s) => s.id === opts.cursor);
      start = idx >= 0 ? idx + (opts.skip ?? 1) : 0;
    }
    return sorted.slice(start, start + opts.take).map(toEntity);
  }

  async count(opts: Parameters<IWorkoutSessionsRepository["count"]>[0]): Promise<number> {
    return this._filtered(opts).length;
  }

  async countFinishedByStrategy(strategyId: string, tenantId: string): Promise<number> {
    return [...this._sessions.values()].filter(
      (s) => s.tenantId === tenantId && s.status === WorkoutSessionStatus.FINISHED,
    ).length;
  }

  async findFinishedSince(tenantId: string, since: Date): Promise<WorkoutSession[]> {
    const records = [...this._sessions.values()]
      .filter((s) => s.tenantId === tenantId && s.status === WorkoutSessionStatus.FINISHED && s.startedAt >= since)
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
    return records.map(toEntity);
  }

  async create(data: Parameters<IWorkoutSessionsRepository["create"]>[0]): Promise<WorkoutSession> {
    const rec: SessionRecord = {
      id: `session-new-${++this._seq}`,
      workoutId: data.workoutId,
      tenantId: data.tenantId,
      startedAt: data.startedAt,
      endedAt: data.endedAt ?? null,
      status: data.status,
      comment: data.comment ?? null,
      difficulty: data.difficulty ?? null,
      exercises: data.exercises,
      createdAt: new Date(),
    };
    this._sessions.set(rec.id, rec);
    return toEntity(rec);
  }

  async update(
    id: string,
    tenantId: string,
    data: Parameters<IWorkoutSessionsRepository["update"]>[2],
  ): Promise<WorkoutSession | null> {
    const rec = this._sessions.get(id);
    if (!rec || rec.tenantId !== tenantId) return null;
    const updated: SessionRecord = {
      ...rec,
      ...(data.endedAt !== undefined && { endedAt: data.endedAt }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.comment !== undefined && { comment: data.comment }),
      ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
      ...(data.exercises !== undefined && { exercises: data.exercises }),
    };
    this._sessions.set(id, updated);
    return toEntity(updated);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const rec = this._sessions.get(id);
    if (rec && rec.tenantId === tenantId) this._sessions.delete(id);
  }

  raw(id: string): SessionRecord | undefined {
    return this._sessions.get(id);
  }
}

const workoutsRepo: IWorkoutsRepository = {
  findByStrategy: async () => [],
  findById: async (id, tenantId) =>
    // workout-a* pertence a tenant-a / tenant-free / tenant-pro; workout-b* a tenant-b
    (id.startsWith("workout-b") && tenantId === "tenant-b") ||
    (id.startsWith("workout-a") && tenantId !== "tenant-b")
      ? new Workout({
          id,
          strategyId: "s",
          tenantId,
          name: "W",
          description: null,
          order: 1,
          exercises: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      : null,
  countByTenant: async () => 0,
  create: async () => {
    throw new Error("not used");
  },
  update: async () => null,
  delete: async () => {},
};

const exercisesRepo: IExercisesRepository = {
  findMany: async () => [],
  count: async () => 0,
  findById: async (id) =>
    id === "ex-1" || id === "ex-2"
      ? new Exercise({
          id,
          name: id,
          description: null,
          imageUrl: null,
          videoUrl: null,
          category: ExerciseCategory.STRENGTH,
          isArchived: false,
          tenantId: null,
          muscleGroups: [],
          equipment: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      : null,
  create: async () => {
    throw new Error("not used");
  },
  update: async () => null,
  archive: async () => false,
};

function usersRepoFor(planByTenant: Record<string, Plan>): IUsersRepository {
  return {
    findById: async (id) =>
      planByTenant[id]
        ? new User({
            id,
            email: `${id}@test.com`,
            name: id,
            avatarUrl: null,
            bio: null,
            age: 30,
            goals: [],
            isTrainer: false,
            plan: planByTenant[id]!,
            hasOnboarded: true,
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        : null,
    findByEmail: async () => null,
    create: async () => {
      throw new Error("not used");
    },
    update: async () => {
      throw new Error("not used");
    },
    softDelete: async () => {},
    findManyDeletedBefore: async () => [],
    countWorkouts: async () => 0,
  };
}

const validBody = {
  workoutId: "workout-a1",
  startedAt: "2026-06-01T10:00:00.000Z",
  exercises: [
    {
      exerciseId: "ex-1",
      order: 1,
      executedSets: [
        { setNumber: 1, kg: 60, reps: 10, completedAt: "2026-06-01T10:05:00.000Z" },
        { setNumber: 2, kg: 62.5, reps: 8 },
      ],
    },
  ],
};

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

describe("WorkoutSessions CRUD nested (e2e)", () => {
  let app: INestApplication;
  let repo: FakeSessionsRepository;

  async function boot(
    initial: Map<string, SessionRecord>,
    plans: Record<string, Plan> = { "tenant-a": Plan.PRO },
  ): Promise<void> {
    repo = new FakeSessionsRepository(initial);
    app = await createTestApp([
      { token: WORKOUT_SESSIONS_REPOSITORY, value: repo },
      { token: WORKOUTS_REPOSITORY, value: workoutsRepo },
      { token: EXERCISES_REPOSITORY, value: exercisesRepo },
      { token: USERS_REPOSITORY, value: usersRepoFor(plans) },
    ]);
  }

  afterEach(async () => {
    await app.close();
  });

  it("POST with workoutId of another tenant returns 404", async () => {
    await boot(new Map());
    await request(app.getHttpServer())
      .post("/api/v1/workout-sessions")
      .set(authHeader("tenant-a"))
      .send({ ...validBody, workoutId: "workout-b1" })
      .expect(404);
  });

  it("POST without endedAt creates ACTIVE session", async () => {
    await boot(new Map());
    const res = await request(app.getHttpServer())
      .post("/api/v1/workout-sessions")
      .set(authHeader("tenant-a"))
      .send(validBody)
      .expect(201);
    expect(res.body.data.status).toBe("ACTIVE");
    expect(res.body.data.endedAt).toBeNull();
  });

  it("POST with endedAt creates FINISHED session", async () => {
    await boot(new Map());
    const res = await request(app.getHttpServer())
      .post("/api/v1/workout-sessions")
      .set(authHeader("tenant-a"))
      .send({ ...validBody, endedAt: "2026-06-01T11:00:00.000Z" })
      .expect(201);
    expect(res.body.data.status).toBe("FINISHED");
  });

  it("GET /:id returns nested exercises with executedSets ordered", async () => {
    await boot(new Map());
    const created = await request(app.getHttpServer())
      .post("/api/v1/workout-sessions")
      .set(authHeader("tenant-a"))
      .send(validBody)
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/workout-sessions/${created.body.data.id}`)
      .set(authHeader("tenant-a"))
      .expect(200);
    const sets = res.body.data.exercises[0].executedSets;
    expect(sets.map((s: { setNumber: number }) => s.setNumber)).toEqual([1, 2]);
    expect(sets[1].kg).toBe(62.5);
  });

  it("POST with exercises[].executedSets: [] returns 201 (skipped exercise)", async () => {
    await boot(new Map());
    const res = await request(app.getHttpServer())
      .post("/api/v1/workout-sessions")
      .set(authHeader("tenant-a"))
      .send({
        ...validBody,
        exercises: [
          ...validBody.exercises,
          { exerciseId: "ex-2", order: 2, executedSets: [] },
        ],
      })
      .expect(201);
    expect(res.body.data.exercises).toHaveLength(2);
    expect(res.body.data.exercises[1].executedSets).toEqual([]);
  });

  it("GET /workout-sessions?workoutId=X returns only that workout's sessions, tenant-isolated", async () => {
    const initial = new Map<string, SessionRecord>([
      [
        "s-a1",
        {
          id: "s-a1",
          workoutId: "workout-a1",
          tenantId: "tenant-a",
          startedAt: new Date(2026, 5, 1, 10, 0, 0),
          endedAt: null,
          status: WorkoutSessionStatus.FINISHED,
          comment: null,
          difficulty: null,
          exercises: [],
          createdAt: new Date(),
        },
      ],
      [
        "s-a2",
        {
          id: "s-a2",
          workoutId: "workout-a2",
          tenantId: "tenant-a",
          startedAt: new Date(2026, 5, 2, 10, 0, 0),
          endedAt: null,
          status: WorkoutSessionStatus.FINISHED,
          comment: null,
          difficulty: null,
          exercises: [],
          createdAt: new Date(),
        },
      ],
      [
        "s-b1",
        {
          id: "s-b1",
          workoutId: "workout-a1",
          tenantId: "tenant-b",
          startedAt: new Date(2026, 5, 1, 10, 0, 0),
          endedAt: null,
          status: WorkoutSessionStatus.FINISHED,
          comment: null,
          difficulty: null,
          exercises: [],
          createdAt: new Date(),
        },
      ],
    ]);
    await boot(initial, { "tenant-a": Plan.PRO, "tenant-b": Plan.PRO });

    const res = await request(app.getHttpServer())
      .get("/api/v1/workout-sessions?workoutId=workout-a1")
      .set(authHeader("tenant-a"))
      .expect(200);

    const ids = res.body.data.items.map((s: { id: string }) => s.id);
    expect(ids).toEqual(["s-a1"]);
  });

  it("POST with invalid exerciseId returns 400", async () => {
    await boot(new Map());
    await request(app.getHttpServer())
      .post("/api/v1/workout-sessions")
      .set(authHeader("tenant-a"))
      .send({
        ...validBody,
        exercises: [{ exerciseId: "ghost", order: 1, executedSets: [{ setNumber: 1 }] }],
      })
      .expect(400);
  });

  it("paginates 25 sessions for a PRO tenant", async () => {
    const initial = new Map<string, SessionRecord>();
    for (let i = 0; i < 25; i++) {
      const id = `s${String(i).padStart(2, "0")}`;
      initial.set(id, {
        id,
        workoutId: "workout-a1",
        tenantId: "tenant-a",
        startedAt: new Date(2026, 5, 1, 0, 0, i),
        endedAt: null,
        status: WorkoutSessionStatus.FINISHED,
        comment: null,
        difficulty: null,
        exercises: [],
        createdAt: new Date(),
      });
    }
    await boot(initial, { "tenant-a": Plan.PRO });

    const page1 = await request(app.getHttpServer())
      .get("/api/v1/workout-sessions?limit=20")
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(page1.body.data.items).toHaveLength(20);
    expect(page1.body.data.total).toBe(25);
    expect(page1.body.data.nextCursor).not.toBeNull();

    const page2 = await request(app.getHttpServer())
      .get(`/api/v1/workout-sessions?limit=20&cursor=${page1.body.data.nextCursor}`)
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(page2.body.data.items).toHaveLength(5);
    expect(page2.body.data.nextCursor).toBeNull();
  });

  it("FREE plan hides sessions older than 60 days; PRO shows them", async () => {
    function build(tenantId: string): Map<string, SessionRecord> {
      return new Map<string, SessionRecord>([
        [
          `${tenantId}-recent`,
          {
            id: `${tenantId}-recent`,
            workoutId: "workout-a1",
            tenantId,
            startedAt: daysAgo(10),
            endedAt: null,
            status: WorkoutSessionStatus.FINISHED,
            comment: null,
            difficulty: null,
            exercises: [],
            createdAt: new Date(),
          },
        ],
        [
          `${tenantId}-old`,
          {
            id: `${tenantId}-old`,
            workoutId: "workout-a1",
            tenantId,
            startedAt: daysAgo(61),
            endedAt: null,
            status: WorkoutSessionStatus.FINISHED,
            comment: null,
            difficulty: null,
            exercises: [],
            createdAt: new Date(),
          },
        ],
      ]);
    }

    await boot(build("tenant-free"), { "tenant-free": Plan.FREE });
    const free = await request(app.getHttpServer())
      .get("/api/v1/workout-sessions")
      .set(authHeader("tenant-free"))
      .expect(200);
    const freeIds = free.body.data.items.map((s: { id: string }) => s.id);
    expect(freeIds).toContain("tenant-free-recent");
    expect(freeIds).not.toContain("tenant-free-old");
    await app.close();

    await boot(build("tenant-pro"), { "tenant-pro": Plan.PRO });
    const pro = await request(app.getHttpServer())
      .get("/api/v1/workout-sessions")
      .set(authHeader("tenant-pro"))
      .expect(200);
    const proIds = pro.body.data.items.map((s: { id: string }) => s.id);
    expect(proIds).toContain("tenant-pro-old");
  });

  it("PATCH replaces nested exercises", async () => {
    await boot(new Map());
    const created = await request(app.getHttpServer())
      .post("/api/v1/workout-sessions")
      .set(authHeader("tenant-a"))
      .send(validBody)
      .expect(201);
    const id = created.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/workout-sessions/${id}`)
      .set(authHeader("tenant-a"))
      .send({
        status: "FINISHED",
        exercises: [{ exerciseId: "ex-2", order: 1, executedSets: [{ setNumber: 1, reps: 5 }] }],
      })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/workout-sessions/${id}`)
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(res.body.data.exercises).toHaveLength(1);
    expect(res.body.data.exercises[0].exerciseId).toBe("ex-2");
    expect(res.body.data.status).toBe("FINISHED");
  });

  it("GET/PATCH/DELETE of another tenant's session returns 404", async () => {
    const initial = new Map<string, SessionRecord>([
      [
        "s-b",
        {
          id: "s-b",
          workoutId: "workout-b1",
          tenantId: "tenant-b",
          startedAt: new Date(),
          endedAt: null,
          status: WorkoutSessionStatus.ACTIVE,
          comment: null,
          difficulty: null,
          exercises: [],
          createdAt: new Date(),
        },
      ],
    ]);
    await boot(initial, { "tenant-a": Plan.PRO });

    await request(app.getHttpServer())
      .get("/api/v1/workout-sessions/s-b")
      .set(authHeader("tenant-a"))
      .expect(404);
    await request(app.getHttpServer())
      .patch("/api/v1/workout-sessions/s-b")
      .set(authHeader("tenant-a"))
      .send({ comment: "hack" })
      .expect(404);
    await request(app.getHttpServer())
      .delete("/api/v1/workout-sessions/s-b")
      .set(authHeader("tenant-a"))
      .expect(404);
    expect(repo.raw("s-b")).toBeDefined();
  });

  it("DELETE removes the session", async () => {
    await boot(new Map());
    const created = await request(app.getHttpServer())
      .post("/api/v1/workout-sessions")
      .set(authHeader("tenant-a"))
      .send(validBody)
      .expect(201);
    const id = created.body.data.id;

    await request(app.getHttpServer())
      .delete(`/api/v1/workout-sessions/${id}`)
      .set(authHeader("tenant-a"))
      .expect(204);
    expect(repo.raw(id)).toBeUndefined();
  });

  it("rejects invalid difficulty (>10) with 400", async () => {
    await boot(new Map());
    const res = await request(app.getHttpServer())
      .post("/api/v1/workout-sessions")
      .set(authHeader("tenant-a"))
      .send({ ...validBody, difficulty: 11 })
      .expect(400);
    expect(res.body.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
  });

  it("GET /summary returns zeroed stats with no sessions", async () => {
    await boot(new Map());
    const res = await request(app.getHttpServer())
      .get("/api/v1/workout-sessions/summary")
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(res.body.data.diasEstaSemana).toBe(0);
    expect(res.body.data.treinosNoMes).toBe(0);
    expect(res.body.data.treinosNoMesDelta).toBe(0);
    expect(res.body.data.diasSequencia).toBe(0);
    expect(res.body.data.volumeSemanal).toBe(0);
    expect(res.body.data.volumeData).toHaveLength(7);
    expect(res.body.data.muscleGroups).toEqual([]);
    expect(res.body.data.trainDates).toEqual([]);
    expect(res.body.data.workoutsCount).toBe(0);
  });

  it("GET /summary without authentication returns 401", async () => {
    await boot(new Map());
    await request(app.getHttpServer())
      .get("/api/v1/workout-sessions/summary")
      .expect(401);
  });

  it("GET /summary is not captured by GET /:id", async () => {
    await boot(new Map());
    const res = await request(app.getHttpServer())
      .get("/api/v1/workout-sessions/summary")
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(res.body.data).toHaveProperty("diasEstaSemana");
  });
});
