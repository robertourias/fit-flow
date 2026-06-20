import { BadRequestException, NotFoundException } from "@nestjs/common";
import { CreateBodyMeasurementUseCase } from "../create-body-measurement.use-case";
import { ListBodyMeasurementsUseCase } from "../list-body-measurements.use-case";
import { GetBodyMeasurementUseCase } from "../get-body-measurement.use-case";
import { UpdateBodyMeasurementUseCase } from "../update-body-measurement.use-case";
import { DeleteBodyMeasurementUseCase } from "../delete-body-measurement.use-case";
import { BodyMeasurement } from "../../../domain/body-measurement.entity";
import { User } from "../../../../identity/domain/user.entity";
import { Plan } from "../../../../identity/domain/plan.enum";
import type { IBodyMeasurementsRepository } from "../../../domain/repositories/body-measurements.repository.interface";
import type { IUsersRepository } from "../../../../identity/domain/repositories/users.repository.interface";
import type { CreateBodyMeasurementDto, UpdateBodyMeasurementDto } from "../../dto/body-measurement.dto";

function makeMeasurement(overrides: Partial<ConstructorParameters<typeof BodyMeasurement>[0]> = {}): BodyMeasurement {
  return new BodyMeasurement({
    id: "m-1",
    tenantId: "tenant-1",
    measuredAt: new Date("2026-06-01"),
    weight: 80,
    neck: null,
    chest: null,
    waist: 85,
    hip: null,
    leftArm: null,
    rightArm: null,
    leftThigh: null,
    rightThigh: null,
    calf: null,
    bodyFatPct: null,
    muscleMassPct: null,
    visceralFat: null,
    notes: null,
    createdAt: new Date("2026-06-01"),
    updatedAt: new Date("2026-06-01"),
    ...overrides,
  });
}

function makeUser(plan: Plan): User {
  return new User({
    id: "tenant-1",
    email: "u@test.com",
    name: "U",
    avatarUrl: null,
    bio: null,
    age: 30,
    goals: [],
    isTrainer: false,
    plan,
    hasOnboarded: true,
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeRepo(overrides: Partial<IBodyMeasurementsRepository> = {}): IBodyMeasurementsRepository {
  return {
    findById: jest.fn().mockResolvedValue(null),
    findManyByTenant: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeUsersRepo(user: User | null = null): IUsersRepository {
  return {
    findById: jest.fn().mockResolvedValue(user),
  } as unknown as IUsersRepository;
}

describe("CreateBodyMeasurementUseCase", () => {
  it("creates measurement and returns dto", async () => {
    const measurement = makeMeasurement();
    const repo = makeRepo({ create: jest.fn().mockResolvedValue(measurement) });
    const uc = new CreateBodyMeasurementUseCase(repo);

    const dto: CreateBodyMeasurementDto = { measuredAt: "2026-06-01", weight: 80, waist: 85 };
    const result = await uc.execute("tenant-1", dto);

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ tenantId: "tenant-1", weight: 80 }));
    expect(result.id).toBe("m-1");
  });

  it("throws BadRequestException when no measurement field provided", async () => {
    const repo = makeRepo();
    const uc = new CreateBodyMeasurementUseCase(repo);
    const dto: CreateBodyMeasurementDto = { measuredAt: "2026-06-01" };
    await expect(uc.execute("tenant-1", dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(repo.create).not.toHaveBeenCalled();
  });
});

describe("ListBodyMeasurementsUseCase", () => {
  it("PRO user: no measuredAfter filter applied", async () => {
    const repo = makeRepo({ findManyByTenant: jest.fn().mockResolvedValue([makeMeasurement()]) });
    const usersRepo = makeUsersRepo(makeUser(Plan.PRO));
    const uc = new ListBodyMeasurementsUseCase(repo, usersRepo);

    await uc.execute("tenant-1", { limit: 20 });

    const call = (repo.findManyByTenant as jest.Mock).mock.calls[0][0];
    expect(call.measuredAfter).toBeUndefined();
  });

  it("FREE user: measuredAfter is ~60 days ago", async () => {
    const repo = makeRepo({ findManyByTenant: jest.fn().mockResolvedValue([]) });
    const usersRepo = makeUsersRepo(makeUser(Plan.FREE));
    const uc = new ListBodyMeasurementsUseCase(repo, usersRepo);

    await uc.execute("tenant-1", { limit: 20 });

    const call = (repo.findManyByTenant as jest.Mock).mock.calls[0][0];
    expect(call.measuredAfter).toBeDefined();
    const diffDays = (Date.now() - call.measuredAfter.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(60, 0);
  });
});

describe("GetBodyMeasurementUseCase", () => {
  it("returns dto for own measurement", async () => {
    const measurement = makeMeasurement();
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(measurement) });
    const uc = new GetBodyMeasurementUseCase(repo);
    const result = await uc.execute("m-1", "tenant-1");
    expect(result.id).toBe("m-1");
  });

  it("throws NotFoundException for non-existent id", async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    const uc = new GetBodyMeasurementUseCase(repo);
    await expect(uc.execute("bad-id", "tenant-1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("throws NotFoundException for different tenant", async () => {
    const measurement = makeMeasurement({ tenantId: "other-tenant" });
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(measurement) });
    const uc = new GetBodyMeasurementUseCase(repo);
    await expect(uc.execute("m-1", "tenant-1")).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe("UpdateBodyMeasurementUseCase", () => {
  it("updates own measurement with only provided fields", async () => {
    const measurement = makeMeasurement();
    const updated = makeMeasurement({ weight: 82 });
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(measurement),
      update: jest.fn().mockResolvedValue(updated),
    });
    const uc = new UpdateBodyMeasurementUseCase(repo);
    const dto: UpdateBodyMeasurementDto = { weight: 82 };

    const result = await uc.execute("m-1", "tenant-1", dto);

    expect(repo.update).toHaveBeenCalledWith("m-1", { weight: 82 });
    expect(result.weight).toBe(82);
  });

  it("converts measuredAt string to Date when provided", async () => {
    const measurement = makeMeasurement();
    const repo = makeRepo({
      findById: jest.fn().mockResolvedValue(measurement),
      update: jest.fn().mockResolvedValue(measurement),
    });
    const uc = new UpdateBodyMeasurementUseCase(repo);
    const dto: UpdateBodyMeasurementDto = { measuredAt: "2026-07-01" };

    await uc.execute("m-1", "tenant-1", dto);

    const call = (repo.update as jest.Mock).mock.calls[0][1];
    expect(call.measuredAt).toBeInstanceOf(Date);
  });

  it("throws NotFoundException for non-existent id", async () => {
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(null) });
    const uc = new UpdateBodyMeasurementUseCase(repo);
    await expect(uc.execute("bad-id", "tenant-1", { weight: 80 })).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it("throws NotFoundException for different tenant", async () => {
    const measurement = makeMeasurement({ tenantId: "other-tenant" });
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(measurement) });
    const uc = new UpdateBodyMeasurementUseCase(repo);
    await expect(uc.execute("m-1", "tenant-1", { weight: 80 })).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.update).not.toHaveBeenCalled();
  });
});

describe("DeleteBodyMeasurementUseCase", () => {
  it("deletes own measurement", async () => {
    const measurement = makeMeasurement();
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(measurement) });
    const uc = new DeleteBodyMeasurementUseCase(repo);
    await uc.execute("m-1", "tenant-1");
    expect(repo.delete).toHaveBeenCalledWith("m-1");
  });

  it("throws NotFoundException for different tenant", async () => {
    const measurement = makeMeasurement({ tenantId: "other-tenant" });
    const repo = makeRepo({ findById: jest.fn().mockResolvedValue(measurement) });
    const uc = new DeleteBodyMeasurementUseCase(repo);
    await expect(uc.execute("m-1", "tenant-1")).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});
