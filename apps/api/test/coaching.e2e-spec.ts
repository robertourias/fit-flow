import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { ApiErrorCode } from "@fitflow/types";
import { createTestApp, authHeader, fakeDecode } from "./e2e-utils";
import { USERS_REPOSITORY } from "../src/identity/identity.tokens";
import { TRAINER_STUDENT_RELATIONSHIP_REPOSITORY } from "../src/identity/identity.tokens";
import {
  STRATEGIES_REPOSITORY,
  WORKOUTS_REPOSITORY,
  WORKOUT_SESSIONS_REPOSITORY,
} from "../src/training/training.tokens";
import { EXERCISES_REPOSITORY } from "../src/catalog/catalog.tokens";
import { User } from "../src/identity/domain/user.entity";
import { Plan } from "../src/identity/domain/plan.enum";
import { TrainerStudentRelationship } from "../src/identity/domain/trainer-student-relationship.entity";
import { RelationshipStatus } from "../src/identity/domain/relationship-status.enum";
import { RelationshipInitiator } from "../src/identity/domain/relationship-initiator.enum";
import { Strategy } from "../src/training/domain/strategy.entity";
import { Workout } from "../src/training/domain/workout.entity";
import { WorkoutExercise } from "../src/training/domain/workout-exercise.entity";
import { PlannedSet } from "../src/training/domain/planned-set.value-object";
import { Exercise } from "../src/catalog/domain/exercise.entity";
import { ExerciseCategory } from "../src/catalog/domain/exercise-category.enum";
import type { IUsersRepository } from "../src/identity/domain/repositories/users.repository.interface";
import type { ITrainerStudentRelationshipRepository } from "../src/identity/domain/repositories/trainer-student-relationship.repository.interface";
import type { IStrategiesRepository } from "../src/training/domain/repositories/strategies.repository.interface";
import type {
  IWorkoutExerciseInput,
  IWorkoutsRepository,
} from "../src/training/domain/repositories/workouts.repository.interface";
import type { IWorkoutSessionsRepository } from "../src/training/domain/repositories/workout-sessions.repository.interface";
import type { IExercisesRepository } from "../src/catalog/domain/repositories/exercises.repository.interface";

jest.mock("@auth/core/jwt", () => ({
  decode: jest.fn((args: { token: string }) => fakeDecode(args)),
}));

function makeUser(overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User {
  return new User({
    id: overrides.id ?? "user-id",
    email: overrides.email ?? "user@test.com",
    name: overrides.name ?? "User",
    avatarUrl: null,
    bio: null,
    age: null,
    goals: [],
    isTrainer: overrides.isTrainer ?? false,
    plan: overrides.plan ?? Plan.FREE,
    hasOnboarded: true,
    deletedAt: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  });
}

class FakeUsersRepository implements IUsersRepository {
  constructor(private readonly _users: Map<string, User>) {}

  async findById(id: string): Promise<User | null> {
    return this._users.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return (
      [...this._users.values()].find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      ) ?? null
    );
  }

  async create(): Promise<User> {
    throw new Error("not used");
  }

  async update(): Promise<User> {
    throw new Error("not used");
  }

  async softDelete(): Promise<void> {}

  async findManyDeletedBefore(): Promise<User[]> {
    return [];
  }

  async countWorkouts(): Promise<number> {
    return 0;
  }
}

class FakeRelationshipRepository implements ITrainerStudentRelationshipRepository {
  private _seq = 0;
  constructor(private readonly _relationships: Map<string, TrainerStudentRelationship>) {}

  async findById(id: string): Promise<TrainerStudentRelationship | null> {
    return this._relationships.get(id) ?? null;
  }

  async findByTrainerAndStudent(
    trainerId: string,
    studentId: string,
  ): Promise<TrainerStudentRelationship | null> {
    return (
      [...this._relationships.values()].find(
        (r) => r.trainerId === trainerId && r.studentId === studentId,
      ) ?? null
    );
  }

  async findByStudent(
    studentId: string,
    status?: RelationshipStatus,
  ): Promise<TrainerStudentRelationship[]> {
    return [...this._relationships.values()].filter(
      (r) => r.studentId === studentId && (!status || r.status === status),
    );
  }

  async findByTrainer(
    trainerId: string,
    status?: RelationshipStatus,
  ): Promise<TrainerStudentRelationship[]> {
    return [...this._relationships.values()].filter(
      (r) => r.trainerId === trainerId && (!status || r.status === status),
    );
  }

  async create(
    trainerId: string,
    studentId: string,
    initiatedBy: RelationshipInitiator,
  ): Promise<TrainerStudentRelationship> {
    const relationship = new TrainerStudentRelationship({
      id: `rel-${++this._seq}`,
      trainerId,
      studentId,
      status: RelationshipStatus.PENDING,
      initiatedBy,
      startedAt: new Date("2026-06-17"),
      endedAt: null,
    });
    this._relationships.set(relationship.id, relationship);
    return relationship;
  }

  async updateStatus(
    id: string,
    status: RelationshipStatus,
  ): Promise<TrainerStudentRelationship> {
    const existing = this._relationships.get(id);
    if (!existing) {
      throw new Error("Relationship not found");
    }
    const updated = new TrainerStudentRelationship({
      id: existing.id,
      trainerId: existing.trainerId,
      studentId: existing.studentId,
      status,
      initiatedBy: existing.initiatedBy,
      startedAt: existing.startedAt,
      endedAt: status === RelationshipStatus.REVOKED ? new Date("2026-06-18") : existing.endedAt,
    });
    this._relationships.set(id, updated);
    return updated;
  }

  async trainerHasAccessToStudent(trainerId: string, studentId: string): Promise<boolean> {
    return [...this._relationships.values()].some(
      (r) =>
        r.trainerId === trainerId &&
        r.studentId === studentId &&
        r.status === RelationshipStatus.ACTIVE,
    );
  }
}

interface StrategyProps {
  id: string;
  tenantId: string;
  name: string;
  type: string | null;
  description: string | null;
  isActive: boolean;
  workouts: Workout[];
  createdAt: Date;
  updatedAt: Date;
}

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
      isActive: true,
      workouts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this._strategies.set(props.id, props);
    return new Strategy(props);
  }

  async update(): Promise<Strategy | null> {
    throw new Error("not used");
  }

  async delete(): Promise<void> {}

  raw(id: string): StrategyProps | undefined {
    return this._strategies.get(id);
  }
}

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

function toWorkoutEntity(rec: WorkoutRecord): Workout {
  return new Workout({
    id: rec.id,
    strategyId: rec.strategyId,
    tenantId: rec.tenantId,
    name: rec.name,
    description: rec.description,
    order: rec.order,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
    exercises: rec.exercises.map(
      (ex, i) =>
        new WorkoutExercise({
          id: `we-${rec.id}-${i}`,
          workoutId: rec.id,
          exerciseId: ex.exerciseId,
          order: ex.order,
          restSeconds: ex.restSeconds ?? 90,
          notes: ex.notes ?? null,
          plannedSets: ex.plannedSets.map(
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
      .map(toWorkoutEntity);
  }

  async findById(id: string, tenantId: string): Promise<Workout | null> {
    const rec = this._workouts.get(id);
    return rec && rec.tenantId === tenantId ? toWorkoutEntity(rec) : null;
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
    return toWorkoutEntity(rec);
  }

  async update(): Promise<Workout | null> {
    throw new Error("not used");
  }

  async delete(): Promise<void> {}
}

const exercisesRepo: IExercisesRepository = {
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

const workoutSessionsRepo: IWorkoutSessionsRepository = {
  findById: async () => null,
  findManyByTenant: async () => [],
  count: async () => 0,
  countFinishedByStrategy: async () => 0,
  findFinishedSince: async () => [],
  create: async () => {
    throw new Error("not used");
  },
  update: async () => null,
  delete: async () => {},
};

const validWorkoutBody = {
  name: "Treino A",
  order: 1,
  exercises: [
    {
      exerciseId: "ex-1",
      order: 1,
      plannedSets: [{ setNumber: 1, targetReps: "8-12", targetKg: "60" }],
    },
  ],
};

describe("Coaching (e2e)", () => {
  let app: INestApplication;
  let usersRepo: FakeUsersRepository;
  let relationshipsRepo: FakeRelationshipRepository;
  let strategiesRepo: FakeStrategiesRepository;
  let workoutsRepo: FakeWorkoutsRepository;

  beforeEach(async () => {
    usersRepo = new FakeUsersRepository(
      new Map([
        ["trainer-1", makeUser({ id: "trainer-1", email: "trainer@test.com", isTrainer: true })],
        ["student-1", makeUser({ id: "student-1", email: "student@test.com", isTrainer: false })],
        [
          "other-trainer",
          makeUser({ id: "other-trainer", email: "other-trainer@test.com", isTrainer: true }),
        ],
      ]),
    );
    relationshipsRepo = new FakeRelationshipRepository(new Map());
    strategiesRepo = new FakeStrategiesRepository(new Map());
    workoutsRepo = new FakeWorkoutsRepository(new Map());

    app = await createTestApp([
      { token: USERS_REPOSITORY, value: usersRepo },
      { token: TRAINER_STUDENT_RELATIONSHIP_REPOSITORY, value: relationshipsRepo },
      { token: STRATEGIES_REPOSITORY, value: strategiesRepo },
      { token: WORKOUTS_REPOSITORY, value: workoutsRepo },
      { token: WORKOUT_SESSIONS_REPOSITORY, value: workoutSessionsRepo },
      { token: EXERCISES_REPOSITORY, value: exercisesRepo },
    ]);
  });

  afterEach(async () => {
    await app.close();
  });

  it("full happy path: invite -> accept -> create strategy -> create workout -> read dashboard", async () => {
    // 1. Trainer convida o aluno pelo email.
    const inviteRes = await request(app.getHttpServer())
      .post("/api/v1/coaching/relationships")
      .set(authHeader("trainer-1"))
      .send({ targetEmail: "student@test.com" })
      .expect(201);

    expect(inviteRes.body.data).toMatchObject({
      trainerId: "trainer-1",
      studentId: "student-1",
      status: "PENDING",
      initiatedBy: "TRAINER",
    });
    const relationshipId = inviteRes.body.data.id;

    // 2. Aluno aceita o convite.
    const acceptRes = await request(app.getHttpServer())
      .patch(`/api/v1/coaching/relationships/${relationshipId}`)
      .set(authHeader("student-1"))
      .send({ action: "ACCEPT" })
      .expect(200);
    expect(acceptRes.body.data.status).toBe("ACTIVE");

    // 3. Trainer lista seus alunos e vê o vínculo ACTIVE.
    const studentsRes = await request(app.getHttpServer())
      .get("/api/v1/coaching/students")
      .set(authHeader("trainer-1"))
      .expect(200);
    expect(studentsRes.body.data).toHaveLength(1);
    expect(studentsRes.body.data[0].status).toBe("ACTIVE");

    // 4. Trainer cria uma estratégia em nome do aluno.
    const strategyRes = await request(app.getHttpServer())
      .post(`/api/v1/coaching/students/student-1/strategies`)
      .set(authHeader("trainer-1"))
      .send({ name: "PPL", type: "PPL" })
      .expect(201);
    expect(strategyRes.body.data.name).toBe("PPL");
    expect(strategiesRepo.raw(strategyRes.body.data.id)!.tenantId).toBe("student-1");
    const strategyId = strategyRes.body.data.id;

    // 5. Trainer cria um treino em nome do aluno, na estratégia criada.
    const workoutRes = await request(app.getHttpServer())
      .post(`/api/v1/coaching/students/student-1/workouts`)
      .set(authHeader("trainer-1"))
      .send({ ...validWorkoutBody, strategyId })
      .expect(201);
    expect(workoutRes.body.data.name).toBe("Treino A");
    expect(workoutRes.body.data.strategyId).toBe(strategyId);

    // 6. Trainer lê o dashboard de progresso do aluno.
    const dashboardRes = await request(app.getHttpServer())
      .get(`/api/v1/coaching/students/student-1/dashboard`)
      .set(authHeader("trainer-1"))
      .expect(200);
    expect(dashboardRes.body.data).toHaveProperty("diasEstaSemana");
    expect(dashboardRes.body.data).toHaveProperty("volumeData");

    // 7. Aluno revoga o vínculo ativo.
    const revokeRes = await request(app.getHttpServer())
      .patch(`/api/v1/coaching/relationships/${relationshipId}`)
      .set(authHeader("student-1"))
      .send({ action: "REVOKE" })
      .expect(200);
    expect(revokeRes.body.data.status).toBe("REVOKED");
  });

  it("POST /coaching/relationships between two trainers returns 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/coaching/relationships")
      .set(authHeader("trainer-1"))
      .send({ targetEmail: "other-trainer@test.com" })
      .expect(400);
    expect(res.body.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
  });

  it("POST /coaching/relationships with unknown email returns 404", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/coaching/relationships")
      .set(authHeader("trainer-1"))
      .send({ targetEmail: "unknown@test.com" })
      .expect(404);
  });

  it("PATCH /coaching/relationships/:id ACCEPT by the inviting side returns 403", async () => {
    const inviteRes = await request(app.getHttpServer())
      .post("/api/v1/coaching/relationships")
      .set(authHeader("trainer-1"))
      .send({ targetEmail: "student@test.com" })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/api/v1/coaching/relationships/${inviteRes.body.data.id}`)
      .set(authHeader("trainer-1"))
      .send({ action: "ACCEPT" })
      .expect(403);
  });

  it("students/:studentId endpoints return 404 without an active relationship", async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/coaching/students/student-1/dashboard`)
      .set(authHeader("trainer-1"))
      .expect(404);

    await request(app.getHttpServer())
      .post(`/api/v1/coaching/students/student-1/strategies`)
      .set(authHeader("trainer-1"))
      .send({ name: "PPL" })
      .expect(404);

    await request(app.getHttpServer())
      .post(`/api/v1/coaching/students/student-1/workouts`)
      .set(authHeader("trainer-1"))
      .send({ ...validWorkoutBody, strategyId: "strategy-x" })
      .expect(404);
  });

  it("requires authentication", async () => {
    await request(app.getHttpServer()).get("/api/v1/coaching/students").expect(401);
  });
});
