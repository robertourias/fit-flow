import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { ApiErrorCode } from "@fitflow/types";
import { createTestApp, authHeader, fakeDecode } from "./e2e-utils";
import { EXERCISES_REPOSITORY } from "../src/catalog/catalog.tokens";
import { Exercise } from "../src/catalog/domain/exercise.entity";
import { ExerciseCategory } from "../src/catalog/domain/exercise-category.enum";
import { MuscleGroup } from "../src/catalog/domain/muscle-group.entity";
import { Equipment } from "../src/catalog/domain/equipment.entity";
import type {
  IExercisesRepository,
  IExerciseWriteData,
  IFindExercisesOptions,
} from "../src/catalog/domain/repositories/exercises.repository.interface";

jest.mock("@auth/core/jwt", () => ({
  decode: jest.fn((args: { token: string }) => fakeDecode(args)),
}));

type ExerciseProps = ConstructorParameters<typeof Exercise>[0];

class FakeExercisesRepository implements IExercisesRepository {
  private _seq = 0;
  private readonly _exercises: ExerciseProps[] = [];

  seed(props: ExerciseProps): void {
    this._exercises.push(props);
  }

  private _match(props: ExerciseProps, options: IFindExercisesOptions): boolean {
    const visible = props.tenantId == null || props.tenantId === options.tenantId;
    if (!visible) return false;
    if (!options.includeArchived && props.isArchived) return false;
    if (options.search && !props.name.toLowerCase().includes(options.search.toLowerCase())) {
      return false;
    }
    if (options.category && props.category !== options.category) return false;
    if (
      options.muscleGroupSlug &&
      !props.muscleGroups.some((m) => m.muscleGroup.slug === options.muscleGroupSlug)
    ) {
      return false;
    }
    if (
      options.equipmentSlug &&
      !props.equipment.some((e) => e.slug === options.equipmentSlug)
    ) {
      return false;
    }
    return true;
  }

  private _sorted(options: IFindExercisesOptions): ExerciseProps[] {
    return this._exercises
      .filter((p) => this._match(p, options))
      .sort((a, b) => {
        const t = a.createdAt.getTime() - b.createdAt.getTime();
        return t !== 0 ? t : a.id.localeCompare(b.id);
      });
  }

  async findMany(
    options: IFindExercisesOptions & { take: number; cursor?: string; skip?: number },
  ): Promise<Exercise[]> {
    const sorted = this._sorted(options);
    let start = 0;
    if (options.cursor) {
      const idx = sorted.findIndex((p) => p.id === options.cursor);
      start = idx >= 0 ? idx + (options.skip ?? 1) : 0;
    }
    return sorted.slice(start, start + options.take).map((p) => new Exercise(p));
  }

  async count(options: IFindExercisesOptions): Promise<number> {
    return this._sorted(options).length;
  }

  async findById(id: string): Promise<Exercise | null> {
    const props = this._exercises.find((p) => p.id === id);
    return props ? new Exercise(props) : null;
  }

  async create(data: IExerciseWriteData & { tenantId?: string }): Promise<Exercise> {
    const props: ExerciseProps = {
      id: `created-${++this._seq}`,
      name: data.name,
      description: data.description ?? null,
      imageUrl: data.imageUrl ?? null,
      videoUrl: data.videoUrl ?? null,
      category: data.category as ExerciseCategory,
      isArchived: false,
      tenantId: data.tenantId ?? null,
      muscleGroups: [],
      equipment: [],
      createdAt: new Date(Date.now() + this._seq),
      updatedAt: new Date(),
    };
    this._exercises.push(props);
    return new Exercise(props);
  }

  async update(
    id: string,
    tenantId: string,
    data: Partial<IExerciseWriteData>,
  ): Promise<Exercise | null> {
    const idx = this._exercises.findIndex((p) => p.id === id);
    if (idx < 0) return null;
    const props = this._exercises[idx]!;
    if (props.tenantId !== tenantId) return null; // global ou outro tenant
    const updated: ExerciseProps = {
      ...props,
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category !== undefined && { category: data.category as ExerciseCategory }),
      updatedAt: new Date(),
    };
    this._exercises[idx] = updated;
    return new Exercise(updated);
  }

  async archive(id: string, tenantId: string): Promise<boolean> {
    const idx = this._exercises.findIndex((p) => p.id === id);
    if (idx < 0) return false;
    const props = this._exercises[idx]!;
    if (props.tenantId !== tenantId) return false;
    this._exercises[idx] = { ...props, isArchived: true };
    return true;
  }

  rawById(id: string): ExerciseProps | undefined {
    return this._exercises.find((p) => p.id === id);
  }
}

function makeProps(
  id: string,
  tenantId: string | null,
  overrides: Partial<ExerciseProps> = {},
): ExerciseProps {
  return {
    id,
    name: `Exercise ${id}`,
    description: null,
    imageUrl: null,
    videoUrl: null,
    category: ExerciseCategory.STRENGTH,
    isArchived: false,
    tenantId,
    muscleGroups: [],
    equipment: [],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("Exercises CRUD (e2e)", () => {
  let app: INestApplication;
  let repo: FakeExercisesRepository;

  beforeEach(async () => {
    repo = new FakeExercisesRepository();
    app = await createTestApp([{ token: EXERCISES_REPOSITORY, value: repo }]);
  });

  afterEach(async () => {
    await app.close();
  });

  it("GET /exercises without token returns 401", async () => {
    await request(app.getHttpServer()).get("/api/v1/exercises").expect(401);
  });

  it("GET /exercises returns global + own custom exercises (not other tenant's)", async () => {
    repo.seed(makeProps("global-1", null));
    repo.seed(makeProps("a-custom", "tenant-a"));
    repo.seed(makeProps("b-custom", "tenant-b"));

    const res = await request(app.getHttpServer())
      .get("/api/v1/exercises")
      .set(authHeader("tenant-a"))
      .expect(200);

    const ids = res.body.data.items.map((e: { id: string }) => e.id);
    expect(ids).toEqual(expect.arrayContaining(["global-1", "a-custom"]));
    expect(ids).not.toContain("b-custom");
    expect(res.body.data.nextCursor).toBeNull();
  });

  it("paginates 21 custom exercises via cursor", async () => {
    for (let i = 0; i < 21; i++) {
      repo.seed(
        makeProps(`ex-${String(i).padStart(2, "0")}`, "tenant-a", {
          createdAt: new Date(2026, 0, 1, 0, 0, i),
        }),
      );
    }

    const page1 = await request(app.getHttpServer())
      .get("/api/v1/exercises?limit=20")
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(page1.body.data.items).toHaveLength(20);
    expect(page1.body.data.total).toBe(21);
    expect(page1.body.data.nextCursor).not.toBeNull();

    const page2 = await request(app.getHttpServer())
      .get(`/api/v1/exercises?limit=20&cursor=${page1.body.data.nextCursor}`)
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(page2.body.data.items).toHaveLength(1);
    expect(page2.body.data.nextCursor).toBeNull();
  });

  it("filters by search, category, muscleGroupSlug, equipmentSlug", async () => {
    repo.seed(
      makeProps("strength-chest", "tenant-a", {
        name: "Supino reto",
        category: ExerciseCategory.STRENGTH,
        muscleGroups: [{ muscleGroup: new MuscleGroup("mg-1", "Peito", "peito"), isPrimary: true }],
        equipment: [new Equipment("eq-1", "Barra", "barra")],
      }),
    );
    repo.seed(
      makeProps("cardio-run", "tenant-a", {
        name: "Corrida",
        category: ExerciseCategory.CARDIO,
      }),
    );

    const bySearch = await request(app.getHttpServer())
      .get("/api/v1/exercises?search=supino")
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(bySearch.body.data.items.map((e: { id: string }) => e.id)).toEqual(["strength-chest"]);

    const byCategory = await request(app.getHttpServer())
      .get("/api/v1/exercises?category=CARDIO")
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(byCategory.body.data.items.map((e: { id: string }) => e.id)).toEqual(["cardio-run"]);

    const byMuscle = await request(app.getHttpServer())
      .get("/api/v1/exercises?muscleGroupSlug=peito")
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(byMuscle.body.data.items.map((e: { id: string }) => e.id)).toEqual(["strength-chest"]);

    const byEquip = await request(app.getHttpServer())
      .get("/api/v1/exercises?equipmentSlug=barra")
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(byEquip.body.data.items.map((e: { id: string }) => e.id)).toEqual(["strength-chest"]);
  });

  it("GET /exercises/:id of another tenant returns 404", async () => {
    repo.seed(makeProps("b-custom", "tenant-b"));

    const res = await request(app.getHttpServer())
      .get("/api/v1/exercises/b-custom")
      .set(authHeader("tenant-a"))
      .expect(404);
    expect(res.body.error.code).toBe(ApiErrorCode.NOT_FOUND);
  });

  it("POST /exercises creates with authenticated tenantId and shows up in list", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/v1/exercises")
      .set(authHeader("tenant-a"))
      .send({
        name: "Rosca direta",
        category: "STRENGTH",
        muscleGroupIds: [{ id: "mg-1", isPrimary: true }],
        equipmentIds: ["eq-1"],
      })
      .expect(201);

    expect(created.body.data.tenantId).toBe("tenant-a");
    expect(repo.rawById(created.body.data.id)!.tenantId).toBe("tenant-a");

    const list = await request(app.getHttpServer())
      .get("/api/v1/exercises")
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(list.body.data.items.map((e: { id: string }) => e.id)).toContain(created.body.data.id);
  });

  it("POST /exercises without muscleGroupIds returns 400 VALIDATION_ERROR", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/exercises")
      .set(authHeader("tenant-a"))
      .send({ name: "x", category: "STRENGTH", equipmentIds: [] })
      .expect(400);
    expect(res.body.error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
  });

  it("PATCH /exercises/:id on global exercise returns 404", async () => {
    repo.seed(makeProps("global-1", null));

    await request(app.getHttpServer())
      .patch("/api/v1/exercises/global-1")
      .set(authHeader("tenant-a"))
      .send({ name: "hack" })
      .expect(404);
  });

  it("PATCH /exercises/:id on another tenant's exercise returns 404", async () => {
    repo.seed(makeProps("b-custom", "tenant-b"));

    await request(app.getHttpServer())
      .patch("/api/v1/exercises/b-custom")
      .set(authHeader("tenant-a"))
      .send({ name: "hack" })
      .expect(404);
    expect(repo.rawById("b-custom")!.name).toBe("Exercise b-custom");
  });

  it("DELETE /exercises/:id archives; hidden by default, visible with includeArchived", async () => {
    repo.seed(makeProps("a-custom", "tenant-a"));

    await request(app.getHttpServer())
      .delete("/api/v1/exercises/a-custom")
      .set(authHeader("tenant-a"))
      .expect(204);
    expect(repo.rawById("a-custom")!.isArchived).toBe(true);

    const defaultList = await request(app.getHttpServer())
      .get("/api/v1/exercises")
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(defaultList.body.data.items.map((e: { id: string }) => e.id)).not.toContain("a-custom");

    const withArchived = await request(app.getHttpServer())
      .get("/api/v1/exercises?includeArchived=true")
      .set(authHeader("tenant-a"))
      .expect(200);
    expect(withArchived.body.data.items.map((e: { id: string }) => e.id)).toContain("a-custom");
  });
});
