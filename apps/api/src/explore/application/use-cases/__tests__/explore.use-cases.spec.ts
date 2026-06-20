import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { ListTemplatesUseCase } from "../list-templates.use-case";
import { ImportTemplateUseCase } from "../import-template.use-case";

// Mock do prisma
const mockFindMany = jest.fn();
const mockFindFirst = jest.fn();
jest.mock("@fitflow/db", () => ({
  prisma: {
    strategy: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findMany: (...args: any[]) => mockFindMany(...args),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      findFirst: (...args: any[]) => mockFindFirst(...args),
    },
  },
}));

describe("ListTemplatesUseCase", () => {
  let useCase: ListTemplatesUseCase;

  beforeEach(() => {
    useCase = new ListTemplatesUseCase();
    mockFindMany.mockReset();
  });

  it("retorna lista de StrategyTemplateDto", async () => {
    mockFindMany.mockResolvedValue([
      {
        id: "t1",
        name: "PPL — Iniciante",
        type: "PPL",
        description: "desc",
        workouts: [
          {
            name: "Push A",
            order: 1,
            workoutExercises: [
              {
                exercise: {
                  muscleGroups: [{ muscleGroup: { name: "Peito" } }],
                },
              },
            ],
          },
        ],
      },
    ]);
    const result = await useCase.execute();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("PPL — Iniciante");
    expect(result[0].workoutsCount).toBe(1);
    expect(result[0].muscleGroups).toContain("Peito");
  });

  it("retorna lista vazia quando não há templates", async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await useCase.execute();
    expect(result).toHaveLength(0);
  });
});

describe("ImportTemplateUseCase", () => {
  const mockStrategiesRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    findByTenant: jest.fn(),
    findActiveByTenant: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockWorkoutsRepo = {
    countByTenant: jest.fn(),
    create: jest.fn(),
    findByStrategy: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockUsersRepo = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    findManyDeletedBefore: jest.fn(),
    countWorkouts: jest.fn(),
  };

  let useCase: ImportTemplateUseCase;

  beforeEach(() => {
    useCase = new ImportTemplateUseCase(
      mockStrategiesRepo as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      mockWorkoutsRepo as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      mockUsersRepo as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );
    mockFindFirst.mockReset();
    mockStrategiesRepo.create.mockReset();
    mockStrategiesRepo.findById.mockReset();
    mockWorkoutsRepo.countByTenant.mockReset();
    mockWorkoutsRepo.create.mockReset();
    mockUsersRepo.findById.mockReset();
  });

  it("importa template com sucesso para usuário PRO", async () => {
    mockFindFirst.mockResolvedValue({
      id: "t1",
      name: "PPL",
      type: "PPL",
      description: null,
      isTemplate: true,
      workouts: [
        {
          name: "Push A",
          order: 1,
          description: null,
          workoutExercises: [
            {
              exerciseId: "e1",
              order: 1,
              restSeconds: 90,
              notes: null,
              plannedSets: [{ setNumber: 1, targetReps: "10", targetKg: "60" }],
            },
          ],
        },
      ],
    });
    mockWorkoutsRepo.countByTenant.mockResolvedValue(3);
    mockUsersRepo.findById.mockResolvedValue({ isFreePlan: () => false });
    mockStrategiesRepo.create.mockResolvedValue({ id: "s-new" });
    mockWorkoutsRepo.create.mockResolvedValue({});
    mockStrategiesRepo.findById.mockResolvedValue({
      id: "s-new",
      name: "PPL",
      type: "PPL",
      description: null,
      isActive: true,
      workouts: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await useCase.execute("t1", "user1");
    expect(result.id).toBe("s-new");
    expect(mockStrategiesRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ tenantId: "user1", name: "PPL" }),
    );
    expect(mockWorkoutsRepo.create).toHaveBeenCalledTimes(1);
  });

  it("lança ForbiddenException quando FREE user atingiu o limite", async () => {
    mockFindFirst.mockResolvedValue({
      id: "t1",
      name: "PPL",
      type: null,
      description: null,
      isTemplate: true,
      workouts: Array.from({ length: 3 }, (_, i) => ({
        name: `Workout ${i}`,
        order: i + 1,
        description: null,
        workoutExercises: [],
      })),
    });
    mockWorkoutsRepo.countByTenant.mockResolvedValue(4); // 4 + 3 > 6
    mockUsersRepo.findById.mockResolvedValue({ isFreePlan: () => true });

    await expect(useCase.execute("t1", "user1")).rejects.toThrow(ForbiddenException);
  });

  it("lança NotFoundException quando template não existe", async () => {
    mockFindFirst.mockResolvedValue(null);

    await expect(useCase.execute("nao-existe", "user1")).rejects.toThrow(NotFoundException);
  });
});
