import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { ApiErrorCode } from "@fitflow/types";
import { createTestApp, authHeader, fakeDecode } from "./e2e-utils";
import { USERS_REPOSITORY } from "../src/identity/identity.tokens";
import { User } from "../src/identity/domain/user.entity";
import { Plan } from "../src/identity/domain/plan.enum";
import type { IUsersRepository } from "../src/identity/domain/repositories/users.repository.interface";

jest.mock("@auth/core/jwt", () => ({
  decode: jest.fn((args: { token: string }) => fakeDecode(args)),
}));

type UserProps = ConstructorParameters<typeof User>[0];

class FakeUsersRepository implements IUsersRepository {
  constructor(private readonly _users: Map<string, UserProps>) {}

  async findById(id: string): Promise<User | null> {
    const props = this._users.get(id);
    if (!props || props.deletedAt) return null;
    return new User(props);
  }

  async findByEmail(email: string): Promise<User | null> {
    const props = [...this._users.values()].find((u) => u.email === email && !u.deletedAt);
    return props ? new User(props) : null;
  }

  async create(): Promise<User> {
    throw new Error("not used");
  }

  async update(id: string, data: Partial<UserProps>): Promise<User> {
    const props = { ...this._users.get(id)!, ...data, updatedAt: new Date() };
    this._users.set(id, props);
    return new User(props);
  }

  async softDelete(id: string): Promise<void> {
    const props = this._users.get(id)!;
    this._users.set(id, { ...props, deletedAt: new Date() });
  }

  async findManyDeletedBefore(): Promise<User[]> {
    return [];
  }

  async countWorkouts(): Promise<number> {
    return 0;
  }

  raw(id: string): UserProps | undefined {
    return this._users.get(id);
  }
}

function makeUserProps(id: string, overrides: Partial<UserProps> = {}): UserProps {
  return {
    id,
    email: `${id}@test.com`,
    name: `User ${id}`,
    avatarUrl: null,
    bio: null,
    age: 30,
    goals: ["hipertrofia"],
    isTrainer: false,
    plan: Plan.FREE,
    hasOnboarded: true,
    deletedAt: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("Users /users/me (e2e)", () => {
  let app: INestApplication;
  let repo: FakeUsersRepository;

  beforeEach(async () => {
    repo = new FakeUsersRepository(
      new Map([
        ["tenant-a", makeUserProps("tenant-a")],
        ["tenant-b", makeUserProps("tenant-b")],
      ]),
    );
    app = await createTestApp([{ token: USERS_REPOSITORY, value: repo }]);
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /users/me without token returns 401 UNAUTHORIZED", async () => {
    const res = await request(app.getHttpServer()).get("/api/v1/users/me").expect(401);
    expect(res.body.error.code).toBe(ApiErrorCode.UNAUTHORIZED);
    expect(res.body.data).toBeNull();
  });

  it("GET /users/me returns only the authenticated user's profile, wrapped in ApiResponse", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set(authHeader("tenant-a"))
      .expect(200);

    expect(res.body.error).toBeNull();
    expect(res.body.data).toMatchObject({
      id: "tenant-a",
      email: "tenant-a@test.com",
      plan: "FREE",
      hasOnboarded: true,
    });
  });

  it("PATCH /users/me with bio over 300 chars returns 400 VALIDATION_ERROR", async () => {
    const res = await request(app.getHttpServer())
      .patch("/api/v1/users/me")
      .set(authHeader("tenant-a"))
      .send({ bio: "x".repeat(301) })
      .expect(400);

    expect(res.body.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
    expect(Array.isArray(res.body.error.message)).toBe(true);
  });

  it("PATCH /users/me rejects read-only fields isTrainer/plan (forbidNonWhitelisted)", async () => {
    const res = await request(app.getHttpServer())
      .patch("/api/v1/users/me")
      .set(authHeader("tenant-a"))
      .send({ isTrainer: true, plan: "PRO" })
      .expect(400);

    expect(res.body.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
    expect(repo.raw("tenant-a")!.isTrainer).toBe(false);
    expect(repo.raw("tenant-a")!.plan).toBe(Plan.FREE);
  });

  it("PATCH /users/me persists goals array and returns updated profile", async () => {
    const res = await request(app.getHttpServer())
      .patch("/api/v1/users/me")
      .set(authHeader("tenant-a"))
      .send({ goals: ["hipertrofia", "emagrecimento"], name: "Novo Nome" })
      .expect(200);

    expect(res.body.data.goals).toEqual(["hipertrofia", "emagrecimento"]);
    expect(res.body.data.name).toBe("Novo Nome");
    expect(repo.raw("tenant-a")!.goals).toEqual(["hipertrofia", "emagrecimento"]);
  });

  it("DELETE /users/me returns 204, soft-deletes, and subsequent GET returns 404", async () => {
    await request(app.getHttpServer())
      .delete("/api/v1/users/me")
      .set(authHeader("tenant-a"))
      .expect(204);

    expect(repo.raw("tenant-a")!.deletedAt).toBeInstanceOf(Date);

    const res = await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set(authHeader("tenant-a"))
      .expect(404);
    expect(res.body.error.code).toBe(ApiErrorCode.NOT_FOUND);
  });
});
