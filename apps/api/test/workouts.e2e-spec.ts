import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { ApiErrorCode } from "@fitflow/types";
import { createTestApp, authHeader, fakeDecode } from "./e2e-utils";
import { STRATEGIES_REPOSITORY, WORKOUTS_REPOSITORY } from "../src/training/training.tokens";
import { EXERCISES_REPOSITORY } from "../src/catalog/catalog.tokens";
import { Workout } from "../src/training/domain/workout.entity";
import { WorkoutExercise } from "../src/training/domain/workout-exercise.entity";
import { PlannedSet } from "../src/training/domain/planned-set.value-object";
import { Strategy } from "../src/training/domain/strategy.entity";
import { Exercise } from "../src/catalog/domain/exercise.entity";
import { ExerciseCategory } from "../src/catalog/domain/exercise-category.enum";
import type { IStrategiesRepository } from "../src/training/domain/repositories/strategies.repository.interface";
import type {
  IWorkoutExerciseInput,
  IWorkoutsRepository,
} from "../src/training/domain/repositories/workouts.repository.interface";
import type { IExercisesRepository } from "../src/catalog/domain/repositories/exercises.repository.interface";

jest.mock("@auth/core/jwt", () => ({
  decode: jest.fn((args: { token: string }) => fakeDecode(args)),
}));

interface WorkoutRecord {
  id: string;
  strategyId: string;
  tenantId: string;
  name: string;
  description: string | null;
  order: number;
  exercises: IWorkoutExerciseInput[];
  createdAt: Date;
  updatedAt: Date;
}

function toEntity(rec: WorkoutRecord): Workout {
  return new Workout({
    id: rec.id,
    strategyId: rec.strategyId,
    tenantId: rec.tenantId,
    name: rec.name,
    description: rec.description,
    order: rec.order,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
    exercises: rec.exercises
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(
        (ex, i) =>
          new WorkoutExercise({
            id: `we-${rec.id}-${i}`,
            workoutId: rec.id,
            exerciseId: ex.exerciseId,
            order: ex.order,
            restSeconds: ex.restSeconds ?? 90,
            notes: ex.notes ?? null,
            plannedSets: ex.plannedSets
              .slice()
              .sort((a, b) => a.setNumber - b.setNumber)
              .map(
                (ps, j) =>
                  new PlannedSet({
                    id: `ps-${rec.id}-${i}-${j}`,
                    workoutExerciseId: `we-${rec.id}-${i}`,
                    setNumber: ps.setNumber,
                    targetReps: ps.targetReps,
                    targetKg: ps.targetKg ?? null,
                  }),
              ),
          }),
      ),
  });
}

class FakeWorkoutsRepository implements IWorkoutsRepository {
  private _seq = 0;
  constructor(private readonly _workouts: Map<string, WorkoutRecord>) {}

  async findByStrategy(strategyId: string, tenantId: string): Promise<Workout[]> {
    return [...this._workouts.values()]
      .filter((w) => w.strategyId === strategyId && w.tenantId === tenantId)
      .map(toEntity);
  }

  async findById(id: string, tenantId: string): Promise<Workout | null> {
    const rec = this._workouts.get(id);
    return rec && rec.tenantId === tenantId ? toEntity(rec) : null;
  }

  async countByTenant(tenantId: string): Promise<number> {
    return [...this._workouts.values()].filter((w) => w.tenantId === tenantId).length;
  }

  async create(data: Parameters<IWorkoutsRepository["create"]>[0]): Promise<Workout> {
    const rec: WorkoutRecord = {
      id: `workout-new-${++this._seq}`,
      strategyId: data.strategyId,
      tenantId: data.tenantId,
      name: data.name,
      description: data.description ?? null,
      order: data.order,
      exercises: data.exercises,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this._workouts.set(rec.id, rec);
    return toEntity(rec);
  }

  async update(
    id: string,
    tenantId: string,
    data: Parameters<IWorkoutsRepository["update"]>[2],
  ): Promise<Workout | null> {
    const rec = this._workouts.get(id);
    if (!rec || rec.tenantId !== tenantId) return null;
    const updated: WorkoutRecord = {
      ...rec,
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.exercises !== undefined && { exercises: data.exercises }),
      updatedAt: new Date(),
    };
    this._workouts.set(id, updated);
    return toEntity(updated);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const rec = this._workouts.get(id);
    if (rec && rec.tenantId === tenantId) this._workouts.delete(id);
  }

  raw(id: string): WorkoutRecord | undefined {
    return this._workouts.get(id);
  }
}

function makeStrategy(id: string, tenantId: string): Strategy {
  return new Strategy({
    id,
    tenantId,
    name: "ABC",
    type: null,
    description: null,
    isActive: true,
    workouts: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  });
}

const strategiesRepo: IStrategiesRepository = {
  findByTenant: async () => [],
  findById: async (id, tenantId) =>
    // strategy-a* pertence a tenant-a; strategy-b* a tenant-b
    (id.startsWith("strategy-a") && tenantId === "tenant-a") ||
    (id.startsWith("strategy-b") && tenantId === "tenant-b")
      ? makeStrategy(id, tenantId)
      : null,
  findActiveByTenant: async () => null,
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
    id === "ex-global" || id === "ex-1" || id === "ex-2"
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

const validBody = {
  strategyId: "strategy-a1",
  name: "Treino A",
  order: 1,
  exercises: [
    {
      exerciseId: "ex-1",
      order: 2,
      restSeconds: 90,
      plannedSets: [
        { setNumber: 2, targetReps: "8", targetKg: "60" },
        { setNumber: 1, targetReps: "10", targetKg: "50" },
      ],
    },
    {
      exerciseId: "ex-2",
      order: 1,
      plannedSets: [{ setNumber: 1, targetReps: "12" }],
    },
  ],
};

describe("Workouts CRUD nested (e2e)", () => {
  let app: INestApplication;
  let repo: FakeWorkoutsRepository;

  async function boot(initial: Map<string, WorkoutRecord>): Promise<void> {
    repo = new FakeWorkoutsRepository(initial);
    app = await createTestApp([
      { token: WORKOUTS_REPOSITORY, value: repo },
      { token: STRATEGIES_REPOSITORY, value: strategiesRepo },
      { token: EXERCISES_REPOSITORY, value: exercisesRepo },
    ]);
  }

  afterEach(async () => {
    await app.close();
  });

  it("POST /workouts with strategyId of another tenant returns 404", async () => {
    await boot(new Map());
    await request(app.getHttpServer())
      .post("/api/v1/workouts")
      .set(authHeader("tenant-a"))
      .send({ ...validBody, strategyId: "strategy-b1" })
      .expect(404);
  });

  it("POST /workouts returns 422 PLAN_LIMIT_EXCEEDED at the 7th", async () => {
    const initial = new Map<string, WorkoutRecord>();
    for (let i = 0; i < 6; i++) {
      initial.set(`w${i}`, {
        id: `w${i}`,
        strategyId: "strategy-a1",
        tenantId: "tenant-a",
        name: `W${i}`,
        description: null,
        order: i,
        exercises: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await boot(initial);

    const res = await request(app.getHttpServer())
      .post("/api/v1/workouts")
      .set(authHeader("tenant-a"))
      .send(validBody)
      .expect(422);
    expect(res.body.error.code).toBe(ApiErrorCode.PLAN_LIMIT_EXCEEDED);
  });

  it("POST /workouts with an unknown exerciseId returns 400 VALIDATION_ERROR", async () => {
    await boot(new Map());
    const res = await request(app.getHttpServer())
      .post("/api/v1/workouts")
      .set(authHeader("tenant-a"))
      .send({
        ...validBody,
        exercises: [
          { exerciseId: "ex-ghost", order: 1, plannedSets: [{ setNumber: 1, targetReps: "8" }] },
        ],
      })
      .expect(400);
    expect(res.body.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
  });

  it("POST /workouts creates and GET returns exercises ordered by order, plannedSets by setNumber", async () => {
    await boot(new Map());
    const created = await request(app.getHttpServer())
      .post("/api/v1/workouts")
      .set(authHeader("tenant-a"))
      .send(validBody)
      .expect(201);

    const id = created.body.data.id;
    const res = await request(app.getHttpServer())
      .get(`/api/v1/workouts/${id}`)
      .set(authHeader("tenant-a"))
      .expect(200);

    const exercises = res.body.data.exercises;
    expect(exercises.map((e: { exerciseId: string }) => e.exerciseId)).toEqual(["ex-2", "ex-1"]);
    const exOne = exercises.find((e: { exerciseId: string }) => e.exerciseId === "ex-1");
    expect(exOne.plannedSets.map((p: { setNumber: number }) => p.setNumber)).toEqual([1, 2]);
  });

  it("POST without plannedSets returns 400 (ArrayMinSize)", async () => {
    await boot(new Map());
    await request(app.getHttpServer())
      .post("/api/v1/workouts")
      .set(authHeader("tenant-a"))
      .send({
        ...validBody,
        exercises: [{ exerciseId: "ex-1", order: 1, plannedSets: [] }],
      })
      .expect(400);
  });

  it("PATCH /workouts/:id replaces nested exercises entirely", async () => {
    await boot(new Map());
    const created = await request(app.getHttpServer())
      .post("/api/v1/workouts")
      .set(authHeader("tenant-a"))
      .send(validBody)
      .expect(201);
    const id = created.body.data.id;

    await request(app.getHttpServer())
      .patch(`/api/v1/workouts/${id}`)
      .set(authHeader("tenant-a"))
      .send({
        exercises: [
          { exerciseId: "ex-global", order: 1, plannedSets: [{ setNumber: 1, targetReps: "5" }] },
        ],
      })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/workouts/${id}`)
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(res.body.data.exercises).toHaveLength(1);
    expect(res.body.data.exercises[0].exerciseId).toBe("ex-global");
    expect(repo.raw(id)!.exercises).toHaveLength(1);
  });

  it("GET/PATCH/DELETE of another tenant's workout returns 404", async () => {
    const initial = new Map<string, WorkoutRecord>([
      [
        "w-b",
        {
          id: "w-b",
          strategyId: "strategy-b1",
          tenantId: "tenant-b",
          name: "B",
          description: null,
          order: 1,
          exercises: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    ]);
    await boot(initial);

    await request(app.getHttpServer())
      .get("/api/v1/workouts/w-b")
      .set(authHeader("tenant-a"))
      .expect(404);
    await request(app.getHttpServer())
      .patch("/api/v1/workouts/w-b")
      .set(authHeader("tenant-a"))
      .send({ name: "hack" })
      .expect(404);
    await request(app.getHttpServer())
      .delete("/api/v1/workouts/w-b")
      .set(authHeader("tenant-a"))
      .expect(404);
    expect(repo.raw("w-b")).toBeDefined();
  });

  it("DELETE /workouts/:id removes the workout", async () => {
    await boot(new Map());
    const created = await request(app.getHttpServer())
      .post("/api/v1/workouts")
      .set(authHeader("tenant-a"))
      .send(validBody)
      .expect(201);
    const id = created.body.data.id;

    await request(app.getHttpServer())
      .delete(`/api/v1/workouts/${id}`)
      .set(authHeader("tenant-a"))
      .expect(204);
    expect(repo.raw(id)).toBeUndefined();
  });
});
