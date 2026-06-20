import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { getQueueToken } from "@nestjs/bullmq";
import { ApiErrorCode } from "@fitflow/types";
import { NewMessageNotificationProcessor } from "../src/notifications/infra/queue/new-message-notification.processor";
import { createTestApp, authHeader, fakeDecode } from "./e2e-utils";
import { USERS_REPOSITORY } from "../src/identity/identity.tokens";
import { TRAINER_STUDENT_RELATIONSHIP_REPOSITORY } from "../src/identity/identity.tokens";
import {
  STRATEGIES_REPOSITORY,
  WORKOUTS_REPOSITORY,
  WORKOUT_SESSIONS_REPOSITORY,
} from "../src/training/training.tokens";
import { EXERCISES_REPOSITORY } from "../src/catalog/catalog.tokens";
import { MESSAGE_REPOSITORY } from "../src/coaching/coaching.tokens";
import { NOTIFICATION_REPOSITORY } from "../src/notifications/notifications.tokens";
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
import { Message } from "../src/coaching/domain/message.entity";
import { Notification } from "../src/notifications/domain/notification.entity";
import type { NotificationPayload } from "../src/notifications/domain/notification.entity";
import { NotificationType } from "../src/notifications/domain/notification-type.enum";
import type { IUsersRepository } from "../src/identity/domain/repositories/users.repository.interface";
import type { ITrainerStudentRelationshipRepository } from "../src/identity/domain/repositories/trainer-student-relationship.repository.interface";
import type { IStrategiesRepository } from "../src/training/domain/repositories/strategies.repository.interface";
import type {
  IWorkoutExerciseInput,
  IWorkoutsRepository,
} from "../src/training/domain/repositories/workouts.repository.interface";
import type { IWorkoutSessionsRepository } from "../src/training/domain/repositories/workout-sessions.repository.interface";
import type { IExercisesRepository } from "../src/catalog/domain/repositories/exercises.repository.interface";
import type { IMessageRepository } from "../src/coaching/domain/repositories/message.repository.interface";
import type { INotificationRepository } from "../src/notifications/domain/repositories/notification.repository.interface";
import type { INewMessageJobData } from "../src/notifications/infra/queue/new-message-notification.processor";

jest.mock("@auth/core/jwt", () => ({
  decode: jest.fn((args: { token: string }) => fakeDecode(args)),
}));

/**
 * Fakes da infra BullMQ ("notifications"): o processor real roda fora do
 * request HTTP, conectado a um Worker/Redis de verdade — depender de Redis
 * real no e2e deixaria o teste acoplado à infra (a conexão já é validada
 * isoladamente em notifications.module.spec.ts e nos testes de T2/T3/T4).
 * FakeNewMessageNotificationProcessor não tem o decorator @Processor(), então
 * o BullExplorer do @nestjs/bullmq não cria nenhum Worker/conexão real para
 * ele ao sobrescrever o provider. FakeNotificationsQueue processa o job de
 * forma síncrona chamando o mesmo repositório de notificações que o processor
 * real usaria — valida o fluxo ponta-a-ponta "mensagem -> notificação" de
 * forma simples e estável, sem depender de timing de infra externa.
 */
class FakeNewMessageNotificationProcessor {}

class FakeNotificationsQueue {
  constructor(private readonly _notificationsRepo: INotificationRepository) {}

  // SendMessageUseCase registra um listener de "error" no Queue injetado
  // (EventEmitter real do BullMQ) — no-op aqui pois este fake nunca emite.
  on(): void {}

  async add(name: string, data: INewMessageJobData): Promise<void> {
    if (name !== "new-message") {
      return;
    }
    await this._notificationsRepo.create({
      userId: data.recipientId,
      type: NotificationType.NEW_MESSAGE,
      payload: {
        relationshipId: data.relationshipId,
        messageId: data.messageId,
        senderId: data.senderId,
      },
    });
  }
}

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

  async markRead(
    relationshipId: string,
    side: "TRAINER" | "STUDENT",
    at: Date,
  ): Promise<TrainerStudentRelationship> {
    const existing = this._relationships.get(relationshipId);
    if (!existing) {
      throw new Error("Relationship not found");
    }
    const updated = new TrainerStudentRelationship({
      id: existing.id,
      trainerId: existing.trainerId,
      studentId: existing.studentId,
      status: existing.status,
      initiatedBy: existing.initiatedBy,
      startedAt: existing.startedAt,
      endedAt: existing.endedAt,
      trainerLastReadAt: side === "TRAINER" ? at : existing.trainerLastReadAt,
      studentLastReadAt: side === "STUDENT" ? at : existing.studentLastReadAt,
    });
    this._relationships.set(relationshipId, updated);
    return updated;
  }
}

class FakeMessageRepository implements IMessageRepository {
  private _seq = 0;
  constructor(private readonly _messages: Map<string, Message>) {}

  async create(data: {
    relationshipId: string;
    senderId: string;
    content: string;
  }): Promise<Message> {
    const message = new Message({
      id: `message-${++this._seq}`,
      relationshipId: data.relationshipId,
      senderId: data.senderId,
      content: data.content,
      createdAt: new Date(),
    });
    this._messages.set(message.id, message);
    return message;
  }

  async findByRelationship(
    relationshipId: string,
    opts: { limit: number; offset: number },
  ): Promise<Message[]> {
    return [...this._messages.values()]
      .filter((m) => m.relationshipId === relationshipId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(opts.offset, opts.offset + opts.limit);
  }

  async countByRelationship(relationshipId: string): Promise<number> {
    return [...this._messages.values()].filter((m) => m.relationshipId === relationshipId).length;
  }
}

class FakeNotificationRepository implements INotificationRepository {
  private _seq = 0;
  constructor(private readonly _notifications: Map<string, Notification>) {}

  async create(data: {
    userId: string;
    type: NotificationType;
    payload: NotificationPayload;
  }): Promise<Notification> {
    const notification = new Notification({
      id: `notification-${++this._seq}`,
      userId: data.userId,
      type: data.type,
      payload: data.payload,
      read: false,
      createdAt: new Date(),
    });
    this._notifications.set(notification.id, notification);
    return notification;
  }

  async findByUser(userId: string, opts?: { unreadOnly?: boolean }): Promise<Notification[]> {
    return [...this._notifications.values()]
      .filter((n) => n.userId === userId && (!opts?.unreadOnly || !n.read))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markRead(id: string, userId: string): Promise<Notification | null> {
    const existing = this._notifications.get(id);
    if (!existing || existing.userId !== userId) {
      return null;
    }
    const updated = new Notification({
      id: existing.id,
      userId: existing.userId,
      type: existing.type,
      payload: existing.payload,
      read: true,
      createdAt: existing.createdAt,
    });
    this._notifications.set(id, updated);
    return updated;
  }

  async markAllRead(userId: string): Promise<number> {
    let count = 0;
    for (const [id, notification] of this._notifications.entries()) {
      if (notification.userId === userId && !notification.read) {
        this._notifications.set(
          id,
          new Notification({
            id: notification.id,
            userId: notification.userId,
            type: notification.type,
            payload: notification.payload,
            read: true,
            createdAt: notification.createdAt,
          }),
        );
        count++;
      }
    }
    return count;
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
  let messagesRepo: FakeMessageRepository;
  let notificationsRepo: FakeNotificationRepository;

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
    messagesRepo = new FakeMessageRepository(new Map());
    notificationsRepo = new FakeNotificationRepository(new Map());

    app = await createTestApp([
      { token: USERS_REPOSITORY, value: usersRepo },
      { token: TRAINER_STUDENT_RELATIONSHIP_REPOSITORY, value: relationshipsRepo },
      { token: STRATEGIES_REPOSITORY, value: strategiesRepo },
      { token: WORKOUTS_REPOSITORY, value: workoutsRepo },
      { token: WORKOUT_SESSIONS_REPOSITORY, value: workoutSessionsRepo },
      { token: EXERCISES_REPOSITORY, value: exercisesRepo },
      { token: MESSAGE_REPOSITORY, value: messagesRepo },
      { token: NOTIFICATION_REPOSITORY, value: notificationsRepo },
      { token: getQueueToken("notifications"), value: new FakeNotificationsQueue(notificationsRepo) },
      { token: NewMessageNotificationProcessor, value: new FakeNewMessageNotificationProcessor() },
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

  describe("Messages & Notifications (TASK18)", () => {
    /** Cria um vínculo ACTIVE entre trainer-1 e student-1 e retorna o id. */
    async function createActiveRelationship(): Promise<string> {
      const inviteRes = await request(app.getHttpServer())
        .post("/api/v1/coaching/relationships")
        .set(authHeader("trainer-1"))
        .send({ targetEmail: "student@test.com" })
        .expect(201);
      const relationshipId = inviteRes.body.data.id as string;

      await request(app.getHttpServer())
        .patch(`/api/v1/coaching/relationships/${relationshipId}`)
        .set(authHeader("student-1"))
        .send({ action: "ACCEPT" })
        .expect(200);

      return relationshipId;
    }

    // No processo real, o job "new-message" é processado por um Worker BullMQ
    // fora do request HTTP. FakeNotificationsQueue.add() já resolve a
    // notificação de forma síncrona (sem depender de Redis/Worker reais — a
    // conexão real já é validada nos testes dedicados do módulo notifications/
    // T2), mas mantemos o polling aqui mesmo assim: é a forma mais simples e
    // estável de validar o fluxo ponta-a-ponta "mensagem -> notificação" via
    // GET /notifications sem acoplar o teste à API interna da fila.
    async function waitForNotification(
      userId: string,
      timeoutMs = 5000,
    ): Promise<{ id: string; type: string; payload: Record<string, unknown> }> {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const res = await request(app.getHttpServer())
          .get("/api/v1/notifications")
          .set(authHeader(userId))
          .expect(200);
        if (res.body.data.length > 0) {
          return res.body.data[0];
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      throw new Error(`Timed out waiting for notification for user ${userId}`);
    }

    it("happy path: send message -> async notification appears -> mark as read", async () => {
      const relationshipId = await createActiveRelationship();

      // 1. Trainer envia mensagem para o aluno.
      const sendRes = await request(app.getHttpServer())
        .post(`/api/v1/coaching/relationships/${relationshipId}/messages`)
        .set(authHeader("trainer-1"))
        .send({ content: "Olá, vamos treinar hoje?" })
        .expect(201);

      expect(sendRes.body.data).toMatchObject({
        relationshipId,
        senderId: "trainer-1",
        content: "Olá, vamos treinar hoje?",
      });
      expect(sendRes.body.data).toHaveProperty("id");
      expect(sendRes.body.data).toHaveProperty("createdAt");

      // 2. Aluno lista o histórico de mensagens do vínculo.
      const listRes = await request(app.getHttpServer())
        .get(`/api/v1/coaching/relationships/${relationshipId}/messages`)
        .set(authHeader("student-1"))
        .expect(200);
      expect(listRes.body.data.total).toBe(1);
      expect(listRes.body.data.items).toHaveLength(1);
      expect(listRes.body.data.items[0].content).toBe("Olá, vamos treinar hoje?");

      // 3. Notificação NEW_MESSAGE aparece para o aluno (processada de forma
      // assíncrona pelo worker BullMQ) — aguarda via polling curto.
      const notification = await waitForNotification("student-1");
      expect(notification.type).toBe("NEW_MESSAGE");
      expect(notification.read).toBe(false);
      expect(notification.payload).toMatchObject({
        relationshipId,
        senderId: "trainer-1",
      });

      // 4. Aluno marca a notificação como lida.
      const markNotificationRes = await request(app.getHttpServer())
        .patch(`/api/v1/notifications/${notification.id}/read`)
        .set(authHeader("student-1"))
        .expect(200);
      expect(markNotificationRes.body.data.read).toBe(true);

      // 5. Aluno marca as mensagens do vínculo como lidas.
      const markMessagesRes = await request(app.getHttpServer())
        .patch(`/api/v1/coaching/relationships/${relationshipId}/messages/read`)
        .set(authHeader("student-1"))
        .expect(200);
      expect(markMessagesRes.body.data).toHaveProperty("lastReadAt");

      // 6. GET /notifications?unread=true não retorna mais a notificação lida.
      const unreadRes = await request(app.getHttpServer())
        .get("/api/v1/notifications?unread=true")
        .set(authHeader("student-1"))
        .expect(200);
      expect(unreadRes.body.data).toHaveLength(0);
    }, 10000);

    it("POST messages with prohibited content returns 422 and does not persist or notify", async () => {
      const relationshipId = await createActiveRelationship();

      await request(app.getHttpServer())
        .post(`/api/v1/coaching/relationships/${relationshipId}/messages`)
        .set(authHeader("trainer-1"))
        .send({ content: "Isso é uma porra de treino" })
        .expect(422);

      const listRes = await request(app.getHttpServer())
        .get(`/api/v1/coaching/relationships/${relationshipId}/messages`)
        .set(authHeader("trainer-1"))
        .expect(200);
      expect(listRes.body.data.total).toBe(0);

      const notificationsRes = await request(app.getHttpServer())
        .get("/api/v1/notifications")
        .set(authHeader("student-1"))
        .expect(200);
      expect(notificationsRes.body.data).toHaveLength(0);
    });

    it("messages endpoints return 404 without an ACTIVE relationship", async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/coaching/relationships/unknown-rel/messages`)
        .set(authHeader("trainer-1"))
        .send({ content: "oi" })
        .expect(404);

      await request(app.getHttpServer())
        .get(`/api/v1/coaching/relationships/unknown-rel/messages`)
        .set(authHeader("trainer-1"))
        .expect(404);

      await request(app.getHttpServer())
        .patch(`/api/v1/coaching/relationships/unknown-rel/messages/read`)
        .set(authHeader("trainer-1"))
        .expect(404);
    });

    it("PATCH /notifications/:id/read returns 404 for a notification of another user", async () => {
      await notificationsRepo.create({
        userId: "trainer-1",
        type: NotificationType.NEW_MESSAGE,
        payload: { relationshipId: "rel-x", messageId: "message-x", senderId: "student-1" },
      });

      await request(app.getHttpServer())
        .get("/api/v1/notifications")
        .set(authHeader("trainer-1"))
        .expect(200)
        .then((res) => expect(res.body.data).toHaveLength(1));

      const [trainerNotification] = await notificationsRepo.findByUser("trainer-1");

      await request(app.getHttpServer())
        .patch(`/api/v1/notifications/${trainerNotification.id}/read`)
        .set(authHeader("student-1"))
        .expect(404);
    });

    it("PATCH /notifications/read-all marks all unread notifications as read", async () => {
      await notificationsRepo.create({
        userId: "student-1",
        type: NotificationType.NEW_MESSAGE,
        payload: { relationshipId: "rel-x", messageId: "message-x", senderId: "trainer-1" },
      });
      await notificationsRepo.create({
        userId: "student-1",
        type: NotificationType.NEW_MESSAGE,
        payload: { relationshipId: "rel-y", messageId: "message-y", senderId: "trainer-1" },
      });

      const res = await request(app.getHttpServer())
        .patch("/api/v1/notifications/read-all")
        .set(authHeader("student-1"))
        .expect(200);
      expect(res.body.data.updated).toBe(2);

      const unreadRes = await request(app.getHttpServer())
        .get("/api/v1/notifications?unread=true")
        .set(authHeader("student-1"))
        .expect(200);
      expect(unreadRes.body.data).toHaveLength(0);
    });
  });
});
