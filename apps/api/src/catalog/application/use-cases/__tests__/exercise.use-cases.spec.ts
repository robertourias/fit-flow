import { NotFoundException } from "@nestjs/common";
import { ListExercisesUseCase } from "../list-exercises.use-case";
import { GetExerciseUseCase } from "../get-exercise.use-case";
import { CreateExerciseUseCase } from "../create-exercise.use-case";
import { UpdateExerciseUseCase } from "../update-exercise.use-case";
import { ArchiveExerciseUseCase } from "../archive-exercise.use-case";
import { Exercise } from "../../../domain/exercise.entity";
import { ExerciseCategory } from "../../../domain/exercise-category.enum";
import type { IExercisesRepository } from "../../../domain/repositories/exercises.repository.interface";

function makeExercise(overrides: Partial<ConstructorParameters<typeof Exercise>[0]> = {}): Exercise {
  return new Exercise({
    id: "ex-1",
    name: "Supino",
    description: null,
    imageUrl: null,
    videoUrl: null,
    category: ExerciseCategory.STRENGTH,
    isArchived: false,
    tenantId: "tenant-1",
    muscleGroups: [],
    equipment: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  });
}

function makeRepo(): jest.Mocked<IExercisesRepository> {
  return {
    findMany: jest.fn(),
    count: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    archive: jest.fn(),
  };
}

describe("ListExercisesUseCase", () => {
  it("delegates to paginate with tenant-scoped filters and returns nextCursor", async () => {
    const repo = makeRepo();
    repo.findMany.mockResolvedValue([makeExercise({ id: "a" }), makeExercise({ id: "b" })]);
    repo.count.mockResolvedValue(5);

    const result = await new ListExercisesUseCase(repo).execute("tenant-1", {
      limit: 1,
      search: "sup",
    });

    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBe("a");
    expect(result.total).toBe(5);
    expect(repo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "tenant-1", search: "sup", take: 2 }),
    );
  });
});

describe("GetExerciseUseCase", () => {
  it("returns global exercise", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeExercise({ tenantId: null }));

    await expect(new GetExerciseUseCase(repo).execute("ex-1", "tenant-1")).resolves.toBeDefined();
  });

  it("returns own exercise", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeExercise({ tenantId: "tenant-1" }));

    await expect(new GetExerciseUseCase(repo).execute("ex-1", "tenant-1")).resolves.toBeDefined();
  });

  it("throws NotFound for another tenant's exercise", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(makeExercise({ tenantId: "other" }));

    await expect(new GetExerciseUseCase(repo).execute("ex-1", "tenant-1")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("throws NotFound when missing", async () => {
    const repo = makeRepo();
    repo.findById.mockResolvedValue(null);

    await expect(new GetExerciseUseCase(repo).execute("ghost", "tenant-1")).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe("CreateExerciseUseCase", () => {
  it("creates with authenticated tenantId", async () => {
    const repo = makeRepo();
    repo.create.mockResolvedValue(makeExercise());

    await new CreateExerciseUseCase(repo).execute("tenant-1", {
      name: "Supino",
      category: ExerciseCategory.STRENGTH,
      muscleGroupIds: [{ id: "mg-1", isPrimary: true }],
      equipmentIds: ["eq-1"],
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "tenant-1", name: "Supino" }),
    );
  });
});

describe("UpdateExerciseUseCase", () => {
  it("throws NotFound when repo returns null (global/other tenant)", async () => {
    const repo = makeRepo();
    repo.update.mockResolvedValue(null);

    await expect(
      new UpdateExerciseUseCase(repo).execute("ex-1", "tenant-1", { name: "x" }),
    ).rejects.toThrow(NotFoundException);
  });

  it("passes only provided fields", async () => {
    const repo = makeRepo();
    repo.update.mockResolvedValue(makeExercise({ name: "Novo" }));

    await new UpdateExerciseUseCase(repo).execute("ex-1", "tenant-1", { name: "Novo" });

    expect(repo.update).toHaveBeenCalledWith("ex-1", "tenant-1", { name: "Novo" });
  });
});

describe("ArchiveExerciseUseCase", () => {
  it("throws NotFound when archive returns false", async () => {
    const repo = makeRepo();
    repo.archive.mockResolvedValue(false);

    await expect(new ArchiveExerciseUseCase(repo).execute("ex-1", "tenant-1")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("resolves when archive succeeds", async () => {
    const repo = makeRepo();
    repo.archive.mockResolvedValue(true);

    await expect(new ArchiveExerciseUseCase(repo).execute("ex-1", "tenant-1")).resolves.toBeUndefined();
  });
});
