import { NotFoundException } from "@nestjs/common";
import { GetMeUseCase } from "../get-me.use-case";
import { UpdateMeUseCase } from "../update-me.use-case";
import { DeleteMeUseCase } from "../delete-me.use-case";
import { User } from "../../../domain/user.entity";
import { Plan } from "../../../domain/plan.enum";
import type { IUsersRepository } from "../../../domain/repositories/users.repository.interface";

function makeUser(overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User {
  return new User({
    id: "user-1",
    email: "user@test.com",
    name: "User",
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
  });
}

function makeRepo(): jest.Mocked<IUsersRepository> {
  return {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findManyDeletedBefore: jest.fn(),
    countWorkouts: jest.fn(),
  };
}

describe("GetMeUseCase", () => {
  it("returns the user for the tenant", async () => {
    const repo = makeRepo();
    const user = makeUser();
    repo.findById.mockResolvedValue(user);

    const result = await new GetMeUseCase(repo).execute("user-1");

    expect(result).toBe(user);
    expect(repo.findById).toHaveBeenCalledWith("user-1");
  });

  it("throws NotFound when user does not exist", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);

    await expect(new GetMeUseCase(repo).execute("ghost")).rejects.toThrow(NotFoundException);
  });

  it("throws NotFound when user is soft-deleted", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeUser({ deletedAt: new Date() }));

    await expect(new GetMeUseCase(repo).execute("user-1")).rejects.toThrow(NotFoundException);
  });
});

describe("UpdateMeUseCase", () => {
  it("updates only provided fields", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeUser());
    repo.update.mockResolvedValue(makeUser({ name: "Novo Nome" }));

    const result = await new UpdateMeUseCase(repo).execute("user-1", { name: "Novo Nome" });

    expect(repo.update).toHaveBeenCalledWith("user-1", { name: "Novo Nome" });
    expect(result.name).toBe("Novo Nome");
  });

  it("passes goals array through", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeUser());
    repo.update.mockResolvedValue(makeUser({ goals: ["a", "b"] }));

    await new UpdateMeUseCase(repo).execute("user-1", { goals: ["a", "b"] });

    expect(repo.update).toHaveBeenCalledWith("user-1", { goals: ["a", "b"] });
  });

  it("passes hasOnboarded through", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeUser({ hasOnboarded: false }));
    repo.update.mockResolvedValue(makeUser({ hasOnboarded: true }));

    const result = await new UpdateMeUseCase(repo).execute("user-1", { hasOnboarded: true });

    expect(repo.update).toHaveBeenCalledWith("user-1", { hasOnboarded: true });
    expect(result.hasOnboarded).toBe(true);
  });

  it("does not touch hasOnboarded when not provided", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeUser());
    repo.update.mockResolvedValue(makeUser());

    await new UpdateMeUseCase(repo).execute("user-1", { name: "Novo Nome" });

    expect(repo.update).toHaveBeenCalledWith("user-1", { name: "Novo Nome" });
  });

  it("passes isTrainer through when provided", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeUser({ isTrainer: false }));
    repo.update.mockResolvedValue(makeUser({ isTrainer: true }));

    const result = await new UpdateMeUseCase(repo).execute("user-1", { isTrainer: true });

    expect(repo.update).toHaveBeenCalledWith("user-1", { isTrainer: true });
    expect(result.isTrainer).toBe(true);
  });

  it("does not touch isTrainer when not provided", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeUser());
    repo.update.mockResolvedValue(makeUser());

    await new UpdateMeUseCase(repo).execute("user-1", { name: "Novo Nome" });

    expect(repo.update).toHaveBeenCalledWith("user-1", { name: "Novo Nome" });
  });

  it("throws NotFound for missing user", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);

    await expect(new UpdateMeUseCase(repo).execute("ghost", {})).rejects.toThrow(
      NotFoundException,
    );
    expect(repo.update).not.toHaveBeenCalled();
  });
});

describe("DeleteMeUseCase", () => {
  it("soft-deletes the user", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeUser());

    await new DeleteMeUseCase(repo).execute("user-1");

    expect(repo.softDelete).toHaveBeenCalledWith("user-1");
  });

  it("throws NotFound for already-deleted user", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeUser({ deletedAt: new Date() }));

    await expect(new DeleteMeUseCase(repo).execute("user-1")).rejects.toThrow(NotFoundException);
    expect(repo.softDelete).not.toHaveBeenCalled();
  });
});
