import request from "supertest";
import type { INestApplication } from "@nestjs/common";
import { ApiErrorCode } from "@fitflow/types";
import { createTestApp, authHeader, fakeDecode } from "./e2e-utils";
import { EQUIPMENT_REPOSITORY, MUSCLE_GROUPS_REPOSITORY } from "../src/catalog/catalog.tokens";
import { MuscleGroup } from "../src/catalog/domain/muscle-group.entity";
import { Equipment } from "../src/catalog/domain/equipment.entity";
import type { IMuscleGroupsRepository } from "../src/catalog/domain/repositories/muscle-groups.repository.interface";
import type { IEquipmentRepository } from "../src/catalog/domain/repositories/equipment.repository.interface";

jest.mock("@auth/core/jwt", () => ({
  decode: jest.fn((args: { token: string }) => fakeDecode(args)),
}));

const muscleGroups: IMuscleGroupsRepository = {
  // Ordenação por name é responsabilidade do repositório (orderBy no Prisma)
  findAll: async () => [
    new MuscleGroup("mg-1", "Costas", "costas"),
    new MuscleGroup("mg-2", "Peito", "peito"),
  ],
};

const equipment: IEquipmentRepository = {
  findAll: async () => [
    new Equipment("eq-1", "Barra", "barra"),
    new Equipment("eq-2", "Halteres", "halteres"),
  ],
};

describe("Catalog reference data (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp([
      { token: MUSCLE_GROUPS_REPOSITORY, value: muscleGroups },
      { token: EQUIPMENT_REPOSITORY, value: equipment },
    ]);
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /muscle-groups without token returns 401", async () => {
    const res = await request(app.getHttpServer()).get("/api/v1/muscle-groups").expect(401);
    expect(res.body.error.code).toBe(ApiErrorCode.UNAUTHORIZED);
  });

  it("GET /muscle-groups returns full list with id/name/slug", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/muscle-groups")
      .set(authHeader("tenant-a"))
      .expect(200);

    expect(res.body.error).toBeNull();
    expect(res.body.data).toEqual([
      { id: "mg-1", name: "Costas", slug: "costas" },
      { id: "mg-2", name: "Peito", slug: "peito" },
    ]);
  });

  it("GET /equipment returns full list with id/name/slug", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/equipment")
      .set(authHeader("tenant-a"))
      .expect(200);

    expect(res.body.data).toEqual([
      { id: "eq-1", name: "Barra", slug: "barra" },
      { id: "eq-2", name: "Halteres", slug: "halteres" },
    ]);
  });
});
