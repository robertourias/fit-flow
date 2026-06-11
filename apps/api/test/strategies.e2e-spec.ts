import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { ApiErrorCode } from "@fitflow/types";
import { createTestApp, authHeader, fakeDecode } from "./e2e-utils";
import { STRATEGIES_REPOSITORY, WORKOUT_SESSIONS_REPOSITORY } from "../src/training/training.tokens";
import { EXERCISES_REPOSITORY } from "../src/catalog/catalog.tokens";
import { Strategy } from "../src/training/domain/strategy.entity";
import { Workout } from "../src/training/domain/workout.entity";
import { WorkoutExercise } from "../src/training/domain/workout-exercise.entity";
import { PlannedSet } from "../src/training/domain/planned-set.value-object";
import { Exercise } from "../src/catalog/domain/exercise.entity";
import { ExerciseCategory } from "../src/catalog/domain/exercise-category.enum";
import type { IStrategiesRepository } from "../src/training/domain/repositories/strategies.repository.interface";
import type { IWorkoutSessionsRepository } from "../src/training/domain/repositories/workout-sessions.repository.interface";
import type { IExercisesRepository } from "../src/catalog/domain/repositories/exercises.repository.interface";

jest.mock("@auth/core/jwt", () => ({
  decode: jest.fn((args: { token: string }) => fakeDecode(args)),
}));

type StrategyProps = ConstructorParameters<typeof Strategy>[0];

class FakeStrategiesRepository implements IStrategiesRepository {
  private _seq = 0;

  constructor(private readonly _strategies: Map<string, StrategyProps>) {}

  async findByTenant(tenantId: string): Promise<Strategy[]> {
    return [...this._strategies.values()]
      .filter((s) => s.tenantId === tenantId)
      .map((s) => new Strategy(s));
  }

  async findById(id: string, tenantId: string): Promise<Strategy | null> {
    const props = this._strategies.get(id);
    return props && props.tenantId === tenantId ? new Strategy(props) : null;
  }

  async findActiveByTenant(tenantId: string): Promise<Strategy | null> {
    const props = [...this._strategies.values()].find(
      (s) => s.tenantId === tenantId && s.isActive,
    );
    return props ? new Strategy(props) : null;
  }

  async create(data: {
    tenantId: string;
    name: string;
    type?: string;
    description?: string;
  }): Promise<Strategy> {
    const props: StrategyProps = {
      id: `strategy-${++this._seq}`,
      tenantId: data.tenantId,
      name: data.name,
      type: data.type ?? null,
      description: data.description ?? null,
      isActive: true, // default do schema
      workouts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this._strategies.set(props.id, props);
    return new Strategy(props);
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<{ name: string; type: string | null; description: string | null; isActive: boolean }>,
  ): Promise<Strategy | null> {
    const props = this._strategies.get(id);
    if (!props || props.tenantId !== tenantId) return null;

    if (data.isActive === true) {
      for (const [otherId, other] of this._strategies) {
        if (other.tenantId === tenantId && otherId !== id) {
          this._strategies.set(otherId, { ...other, isActive: false });
        }
      }
    }
    const updated = { ...props, ...data, updatedAt: new Date() };
    this._strategies.set(id, updated);
    return new Strategy(updated);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const props = this._strategies.get(id);
    if (props && props.tenantId === tenantId) {
      // cascata: workouts morrem junto (FK onDelete: Cascade no schema)
      this._strategies.delete(id);
    }
  }

  raw(id: string): StrategyProps | undefined {
    return this._strategies.get(id);
  }
}

function makeWorkout(id: string, strategyId: string, tenantId: string): Workout {
  return new Workout({
    id,
    strategyId,
    tenantId,
    name: `Treino ${id}`,
    description: null,
    order: 1,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    exercises: [
      new WorkoutExercise({
        id: `we-${id}`,
        workoutId: id,
        exerciseId: "ex-1",
        order: 1,
        restSeconds: 90,
        notes: null,
        plannedSets: [
          new PlannedSet({
            id: `ps-${id}`,
            workoutExerciseId: `we-${id}`,
            setNumber: 1,
            targetReps: "8-12",
            targetKg: "60",
          }),
        ],
      }),
    ],
  });
}

function makeStrategyProps(
  id: string,
  tenantId: string,
  overrides: Partial<StrategyProps> = {},
): StrategyProps {
  return {
    id,
    tenantId,
    name: `Estratégia ${id}`,
    type: "ABC",
    description: null,
    isActive: false,
    workouts: [makeWorkout(`workout-${id}`, id, tenantId)],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("Strategies CRUD (e2e)", () => {
  let app: INestApplication;
  let repo: FakeStrategiesRepository;

  beforeEach(async () => {
    repo = new FakeStrategiesRepository(
      new Map([
        ["strategy-a1", makeStrategyProps("strategy-a1", "tenant-a", { isActive: true })],
        ["strategy-a2", makeStrategyProps("strategy-a2", "tenant-a")],
        ["strategy-b1", makeStrategyProps("strategy-b1", "tenant-b", { isActive: true })],
      ]),
    );
    app = await createTestApp([{ token: STRATEGIES_REPOSITORY, value: repo }]);
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /strategies returns only the tenant's strategies with workout summaries", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/strategies")
      .set(authHeader("tenant-a"))
      .expect(200);

    expect(res.body.data).toHaveLength(2);
    const ids = res.body.data.map((s: { id: string }) => s.id);
    expect(ids).toEqual(expect.arrayContaining(["strategy-a1", "strategy-a2"]));
    expect(ids).not.toContain("strategy-b1");

    // resumo de workouts: só id/name/order, sem exercises/plannedSets
    const workout = res.body.data[0].workouts[0];
    expect(workout).toEqual({
      id: expect.any(String),
      name: expect.any(String),
      order: 1,
    });
  });

  it("GET /strategies/:id returns full nested workouts (exercises + plannedSets)", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/strategies/strategy-a1")
      .set(authHeader("tenant-a"))
      .expect(200);

    const workout = res.body.data.workouts[0];
    expect(workout.exercises[0].plannedSets[0]).toMatchObject({
      setNumber: 1,
      targetReps: "8-12",
      targetKg: "60",
    });
  });

  it("GET /strategies/:id of another tenant returns 404", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/strategies/strategy-b1")
      .set(authHeader("tenant-a"))
      .expect(404);
    expect(res.body.error.code).toBe(ApiErrorCode.NOT_FOUND);
  });

  it("POST /strategies without name returns 400 VALIDATION_ERROR", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/strategies")
      .set(authHeader("tenant-a"))
      .send({ type: "ABC" })
      .expect(400);
    expect(res.body.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
  });

  it("POST /strategies creates strategy for the tenant", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/strategies")
      .set(authHeader("tenant-a"))
      .send({ name: "PPL", type: "PPL", description: "Push/Pull/Legs" })
      .expect(201);

    expect(res.body.data).toMatchObject({ name: "PPL", type: "PPL", isActive: true });
    expect(repo.raw(res.body.data.id)!.tenantId).toBe("tenant-a");
  });

  it("PATCH /strategies/:id with isActive=true deactivates the tenant's other strategies", async () => {
    await request(app.getHttpServer())
      .patch("/api/v1/strategies/strategy-a2")
      .set(authHeader("tenant-a"))
      .send({ isActive: true })
      .expect(200);

    expect(repo.raw("strategy-a2")!.isActive).toBe(true);
    expect(repo.raw("strategy-a1")!.isActive).toBe(false);
    // estratégia de outro tenant não é afetada
    expect(repo.raw("strategy-b1")!.isActive).toBe(true);
  });

  it("PATCH /strategies/:id of another tenant returns 404", async () => {
    await request(app.getHttpServer())
      .patch("/api/v1/strategies/strategy-b1")
      .set(authHeader("tenant-a"))
      .send({ name: "hack" })
      .expect(404);
    expect(repo.raw("strategy-b1")!.name).toBe("Estratégia strategy-b1");
  });

  it("DELETE /strategies/:id removes the strategy", async () => {
    await request(app.getHttpServer())
      .delete("/api/v1/strategies/strategy-a2")
      .set(authHeader("tenant-a"))
      .expect(204);
    expect(repo.raw("strategy-a2")).toBeUndefined();
  });

  it("DELETE /strategies/:id of another tenant returns 404 and does not delete", async () => {
    await request(app.getHttpServer())
      .delete("/api/v1/strategies/strategy-b1")
      .set(authHeader("tenant-a"))
      .expect(404);
    expect(repo.raw("strategy-b1")).toBeDefined();
  });
});

describe("GET /strategies/active-workout (e2e)", () => {
  function awWorkout(id: string, order: number, exerciseIds: string[]): Workout {
    return new Workout({
      id,
      strategyId: "strategy-x1",
      tenantId: "tenant-x",
      name: `Treino ${id}`,
      description: null,
      order,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
      exercises: exerciseIds.map(
        (exId, i) =>
          new WorkoutExercise({
            id: `we-${id}-${i}`,
            workoutId: id,
            exerciseId: exId,
            order: i,
            restSeconds: 90,
            notes: null,
            plannedSets: [],
          }),
      ),
    });
  }

  function awStrategyProps(id: string, isActive: boolean, workouts: Workout[]): StrategyProps {
    return {
      id,
      tenantId: "tenant-x",
      name: `Estratégia ${id}`,
      type: "ABC",
      description: null,
      isActive,
      workouts,
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    };
  }

  class FakeWorkoutSessionsRepository implements IWorkoutSessionsRepository {
    constructor(private readonly _countByStrategy: Record<string, number>) {}
    async findById(): Promise<never> {
      throw new Error("not used");
    }
    async findManyByTenant(): Promise<never> {
      throw new Error("not used");
    }
    async count(): Promise<never> {
      throw new Error("not used");
    }
    async countFinishedByStrategy(strategyId: string): Promise<number> {
      return this._countByStrategy[strategyId] ?? 0;
    }
    async create(): Promise<never> {
      throw new Error("not used");
    }
    async update(): Promise<never> {
      throw new Error("not used");
    }
    async delete(): Promise<never> {
      throw new Error("not used");
    }
  }

  const exercisesRepoFake: IExercisesRepository = {
    findMany: async () => [],
    count: async () => 0,
    findById: async (id: string) =>
      id === "ex-1"
        ? new Exercise({
            id: "ex-1",
            name: "Supino",
            description: null,
            imageUrl: null,
            videoUrl: null,
            category: ExerciseCategory.STRENGTH,
            isArchived: false,
            tenantId: null,
            muscleGroups: [],
            equipment: [],
            createdAt: new Date("2026-01-01"),
            updatedAt: new Date("2026-01-01"),
          })
        : null,
    create: async () => {
      throw new Error("not used");
    },
    update: async () => null,
    archive: async () => false,
  };

  async function boot(
    strategies: Map<string, StrategyProps>,
    countByStrategy: Record<string, number> = {},
  ): Promise<INestApplication> {
    return createTestApp([
      { token: STRATEGIES_REPOSITORY, value: new FakeStrategiesRepository(strategies) },
      {
        token: WORKOUT_SESSIONS_REPOSITORY,
        value: new FakeWorkoutSessionsRepository(countByStrategy),
      },
      { token: EXERCISES_REPOSITORY, value: exercisesRepoFake },
    ]);
  }

  it("returns null when there is no active strategy", async () => {
    const app = await boot(
      new Map([["strategy-x1", awStrategyProps("strategy-x1", false, [awWorkout("w0", 0, [])])]]),
    );
    const res = await request(app.getHttpServer())
      .get("/api/v1/strategies/active-workout")
      .set(authHeader("tenant-x"))
      .expect(200);
    expect(res.body.data).toBeNull();
    await app.close();
  });

  it("returns null when the active strategy has no workouts", async () => {
    const app = await boot(new Map([["strategy-x1", awStrategyProps("strategy-x1", true, [])]]));
    const res = await request(app.getHttpServer())
      .get("/api/v1/strategies/active-workout")
      .set(authHeader("tenant-x"))
      .expect(200);
    expect(res.body.data).toBeNull();
    await app.close();
  });

  it("returns workout 0 with exercise names when no sessions are finished", async () => {
    const workouts = [awWorkout("w0", 0, ["ex-1"]), awWorkout("w1", 1, []), awWorkout("w2", 2, [])];
    const app = await boot(
      new Map([["strategy-x1", awStrategyProps("strategy-x1", true, workouts)]]),
      { "strategy-x1": 0 },
    );
    const res = await request(app.getHttpServer())
      .get("/api/v1/strategies/active-workout")
      .set(authHeader("tenant-x"))
      .expect(200);
    expect(res.body.data.estrategiaNome).toBe("Estratégia strategy-x1");
    expect(res.body.data.workout).toEqual({
      id: "w0",
      nome: "Treino w0",
      exercicios: ["Supino"],
      order: 0,
    });
    expect(res.body.data.proximos.map((p: { id: string }) => p.id)).toEqual(["w1", "w2"]);
    await app.close();
  });

  it("rotates to the next workout based on finished session count", async () => {
    const workouts = [awWorkout("w0", 0, []), awWorkout("w1", 1, []), awWorkout("w2", 2, [])];
    const app = await boot(
      new Map([["strategy-x1", awStrategyProps("strategy-x1", true, workouts)]]),
      { "strategy-x1": 1 },
    );
    const res = await request(app.getHttpServer())
      .get("/api/v1/strategies/active-workout")
      .set(authHeader("tenant-x"))
      .expect(200);
    expect(res.body.data.workout.id).toBe("w1");
    expect(res.body.data.proximos.map((p: { id: string }) => p.id)).toEqual(["w2", "w0"]);
    await app.close();
  });

  it("returns empty proximos for a strategy with a single workout", async () => {
    const app = await boot(
      new Map([["strategy-x1", awStrategyProps("strategy-x1", true, [awWorkout("w0", 0, [])])]]),
      { "strategy-x1": 0 },
    );
    const res = await request(app.getHttpServer())
      .get("/api/v1/strategies/active-workout")
      .set(authHeader("tenant-x"))
      .expect(200);
    expect(res.body.data.proximos).toEqual([]);
    await app.close();
  });

  it("requires authentication", async () => {
    const app = await boot(
      new Map([["strategy-x1", awStrategyProps("strategy-x1", true, [awWorkout("w0", 0, [])])]]),
    );
    await request(app.getHttpServer()).get("/api/v1/strategies/active-workout").expect(401);
    await app.close();
  });
});
