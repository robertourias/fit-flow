import { NotFoundException } from "@nestjs/common";
import { ListStrategiesUseCase } from "../list-strategies.use-case";
import { GetStrategyUseCase } from "../get-strategy.use-case";
import { CreateStrategyUseCase } from "../create-strategy.use-case";
import { UpdateStrategyUseCase } from "../update-strategy.use-case";
import { DeleteStrategyUseCase } from "../delete-strategy.use-case";
import { Strategy } from "../../../domain/strategy.entity";
import type { IStrategiesRepository } from "../../../domain/repositories/strategies.repository.interface";

function makeStrategy(overrides: Partial<ConstructorParameters<typeof Strategy>[0]> = {}): Strategy {
  return new Strategy({
    id: "strategy-1",
    tenantId: "tenant-1",
    name: "ABC",
    type: "ABC",
    description: null,
    isActive: true,
    workouts: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  });
}

function makeRepo(): jest.Mocked<IStrategiesRepository> {
  return {
    findByTenant: jest.fn(),
    findById: jest.fn(),
    findActiveByTenant: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

describe("ListStrategiesUseCase", () => {
  it("lists strategies scoped to tenant", async () => {
    const repo = makeRepo();
    repo.findByTenant.mockResolvedValue([makeStrategy()]);

    const result = await new ListStrategiesUseCase(repo).execute("tenant-1");

    expect(result).toHaveLength(1);
    expect(repo.findByTenant).toHaveBeenCalledWith("tenant-1");
  });
});

describe("GetStrategyUseCase", () => {
  it("returns strategy of the tenant", async () => {
    const repo = makeRepo();
    const strategy = makeStrategy();
    repo.findById.mockResolvedValue(strategy);

    await expect(new GetStrategyUseCase(repo).execute("strategy-1", "tenant-1")).resolves.toBe(
      strategy,
    );
  });

  it("throws NotFound for strategy of another tenant", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);

    await expect(
      new GetStrategyUseCase(repo).execute("strategy-1", "other-tenant"),
    ).rejects.toThrow(NotFoundException);
  });
});

describe("CreateStrategyUseCase", () => {
  it("creates strategy for tenant", async () => {
    const repo = makeRepo();
    repo.create.mockResolvedValue(makeStrategy());

    await new CreateStrategyUseCase(repo).execute("tenant-1", {
      name: "ABC",
      type: "ABC",
    });

    expect(repo.create).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      name: "ABC",
      type: "ABC",
      description: undefined,
    });
  });
});

describe("UpdateStrategyUseCase", () => {
  it("updates provided fields only", async () => {
    const repo = makeRepo();
    repo.update.mockResolvedValue(makeStrategy({ name: "Upper/Lower" }));

    await new UpdateStrategyUseCase(repo).execute("strategy-1", "tenant-1", {
      name: "Upper/Lower",
    });

    expect(repo.update).toHaveBeenCalledWith("strategy-1", "tenant-1", { name: "Upper/Lower" });
  });

  it("passes isActive=true through (repo deactivates the others)", async () => {
    const repo = makeRepo();
    repo.update.mockResolvedValue(makeStrategy({ isActive: true }));

    await new UpdateStrategyUseCase(repo).execute("strategy-1", "tenant-1", { isActive: true });

    expect(repo.update).toHaveBeenCalledWith("strategy-1", "tenant-1", { isActive: true });
  });

  it("throws NotFound when repo returns null (other tenant)", async () => {
    const repo = makeRepo();
    repo.update.mockResolvedValue(null);

    await expect(
      new UpdateStrategyUseCase(repo).execute("strategy-1", "other-tenant", { name: "x" }),
    ).rejects.toThrow(NotFoundException);
  });
});

describe("DeleteStrategyUseCase", () => {
  it("deletes strategy of the tenant", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeStrategy());

    await new DeleteStrategyUseCase(repo).execute("strategy-1", "tenant-1");

    expect(repo.delete).toHaveBeenCalledWith("strategy-1", "tenant-1");
  });

  it("throws NotFound for strategy of another tenant without deleting", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);

    await expect(
      new DeleteStrategyUseCase(repo).execute("strategy-1", "other-tenant"),
    ).rejects.toThrow(NotFoundException);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
