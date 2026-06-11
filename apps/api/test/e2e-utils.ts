import { Test } from "@nestjs/testing";
import type { INestApplication } from "@nestjs/common";
import { AppModule } from "../src/app.module";

export interface IProviderOverride {
  token: symbol;
  value: unknown;
}

/**
 * Sobe o AppModule real (guard, pipe, filter, interceptor globais) com
 * repositórios substituídos por fakes em memória — sem banco de dados.
 * Os specs e2e devem mockar "@auth/core/jwt" (jest.mock) para que
 * "Bearer valid:<tenantId>" autentique como <tenantId>.
 */
export async function createTestApp(overrides: IProviderOverride[]): Promise<INestApplication> {
  process.env["AUTH_SECRET"] = "test-secret";

  let builder = Test.createTestingModule({ imports: [AppModule] });
  for (const override of overrides) {
    builder = builder.overrideProvider(override.token).useValue(override.value);
  }
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix("api/v1");
  await app.init();
  return app;
}

export function authHeader(tenantId: string): { Authorization: string } {
  return { Authorization: `Bearer valid:${tenantId}` };
}

/** Implementação padrão do mock de decode para jest.mock("@auth/core/jwt"). */
export async function fakeDecode({ token }: { token: string }): Promise<Record<string, unknown> | null> {
  if (token.startsWith("valid:")) {
    return { id: token.slice("valid:".length) };
  }
  return null;
}
