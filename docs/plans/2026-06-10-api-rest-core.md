# Plano Técnico: API REST Core — Identity, Catalog, Training

**Spec:** `docs/specs/2026-06-10-api-rest-core.md`
**Data:** 2026-06-10
**Escopo:** monorepo global (`apps/api` principalmente, `packages/types`, `packages/db`, `docs/`)
**Stack envolvida:** NestJS, Prisma, class-validator, @nestjs/swagger, next-auth/jwt (decode), Jest + Supertest

---

## Estado atual

- `apps/api/src/app.module.ts` só importa `HealthModule` — `IdentityModule`, `CatalogModule`, `TrainingModule` existem mas não estão registrados no app.
- Nenhum guard, ValidationPipe, exception filter, interceptor ou Swagger configurados em `apps/api/src/main.ts`.
- Entidades de domínio + repositórios Prisma já existem para: `User`, `TrainerStudentRelationship` (Identity); `Exercise`, `MuscleGroup`, `Equipment` (Catalog — `MuscleGroup`/`Equipment` sem repo interface ainda); `Strategy`, `Workout`, `WorkoutExercise`, `PlannedSet`, `WorkoutSession`, `SessionExercise`, `ExecutedSet` (Training).
- `packages/types/src/index.ts` já define `ApiResponse<T>` e `PaginatedResponse<T>`.
- `apps/web` usa NextAuth v5 (`next-auth@^5.0.0-beta.29`, `@auth/core@^0.41.0`), JWT strategy, `AUTH_SECRET` em `.env`. `apps/web/src/lib/auth.ts` callback `jwt` seta `token.id = user.id` e `token.hasOnboarded`.
- Sem schema changes necessárias — todas as FRs da spec são cobertas pelo schema Prisma atual (`packages/db/prisma/schema.prisma`).

---

## Decisões técnicas adicionais (resolvendo "Riscos e Premissas" da spec)

### 1. Autenticação — validação do JWT do NextAuth

A API valida o **mesmo token JWE** emitido pelo NextAuth v5, usando a função `decode` de `next-auth/jwt` (re-export de `@auth/core/jwt`, sem dependências de runtime Next/React) com o `AUTH_SECRET` compartilhado.

```ts
import { decode } from "next-auth/jwt";

const payload = await decode({
  token,                         // string do header Authorization: Bearer <token>
  secret: process.env.AUTH_SECRET!,
  salt: process.env.AUTH_COOKIE_NAME ?? "authjs.session-token",
});
// payload.id (setado no callback jwt de apps/web/src/lib/auth.ts) = tenantId
```

- Adicionar `next-auth@^5.0.0-beta.29` e `@auth/core@^0.41.0` como dependências de `apps/api` (mesma versão de `apps/web`, só usamos `next-auth/jwt`).
- Nova env var `AUTH_COOKIE_NAME` (default `authjs.session-token`; em produção HTTPS o NextAuth usa `__Secure-authjs.session-token` — documentar em `.env`/`.env.local`).
- **Nota de integração (Fase 2, fora deste plano):** `apps/web` (Server Actions/RSC) deve obter o token bruto via `getToken({ req, secret, salt, raw: true })` de `next-auth/jwt` e enviá-lo como `Authorization: Bearer <token>` para a API.

### 2. Formato de resposta e códigos de erro

`packages/types/src/index.ts` ganha um enum compartilhado:

```ts
export enum ApiErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNAUTHORIZED = "UNAUTHORIZED",
  NOT_FOUND = "NOT_FOUND",
  PLAN_LIMIT_EXCEEDED = "PLAN_LIMIT_EXCEEDED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}
```

- Sucesso: interceptor global envolve o retorno do controller em `{ data, error: null }`. Respostas `204 No Content` não têm body (sem wrapping).
- Erro: filtro global converte qualquer exceção em `{ data: null, error: { code, message } }`:
  - `BadRequestException` (inclui erros do `ValidationPipe`) → `400`, `VALIDATION_ERROR`, `message` = mensagens de validação por campo.
  - `UnauthorizedException` → `401`, `UNAUTHORIZED`.
  - `NotFoundException` → `404`, `NOT_FOUND`.
  - `UnprocessableEntityException({ code: 'PLAN_LIMIT_EXCEEDED', message })` → `422`, código preservado.
  - Qualquer outro erro → `500`, `INTERNAL_ERROR`, mensagem genérica (sem stack trace).

### 3. Paginação cursor-based

Usa o **cursor nativo do Prisma** (não cursor opaco custom): o `id` (cuid) do último item da página anterior.

```ts
export class PaginationQueryDto {
  @IsOptional() @IsString() cursor?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number = 20;
}

// helper apps/api/src/common/pagination/paginate.ts
export async function paginate<T extends { id: string }>(opts: {
  findPage: (args: { take: number; cursor?: { id: string }; skip?: number }) => Promise<T[]>;
  count: () => Promise<number>;
  cursor?: string;
  limit: number;
}): Promise<PaginatedResponse<T>> {
  const take = opts.limit + 1;
  const items = await opts.findPage({
    take,
    cursor: opts.cursor ? { id: opts.cursor } : undefined,
    skip: opts.cursor ? 1 : 0,
  });
  const hasMore = items.length > opts.limit;
  const page = hasMore ? items.slice(0, opts.limit) : items;
  return { items: page, total: await opts.count(), nextCursor: hasMore ? page[page.length - 1].id : null };
}
```

Aplica-se apenas a `GET /exercises` (orderBy `createdAt asc, id asc`) e `GET /workout-sessions` (orderBy `startedAt desc, id desc`).

### 4. Isolamento de tenant

Todo método de repositório que recebe `:id` recebe também `tenantId` e filtra na query (`WHERE id = ? AND tenantId = ?`). Se não encontrado → `NotFoundException` (`404`) no use case/controller — nunca `403`.

### 5. Limite plano FREE (resolvendo conflito da spec)

Regra adotada: **máx. 6 `Workout` por `tenantId` (total, sem limite de `Strategy` ativas)**. `docs/context/product.md` será atualizado na Tarefa 10.

---

## Contratos de API

> Todos os endpoints abaixo ficam sob prefixo global `/api/v1`, exigem `Authorization: Bearer <token>` (exceto `/health`), e seguem os formatos de resposta da seção 2.

### Identity

| Método | Path | Body / Query | Resposta | Erros |
|---|---|---|---|---|
| GET | `/users/me` | — | `200 UserMeDto` | `401` |
| PATCH | `/users/me` | `UpdateUserMeDto` | `200 UserMeDto` | `400`, `401` |
| DELETE | `/users/me` | — | `204` | `401` |

```ts
interface UserMeDto {
  id: string; email: string; name: string;
  avatarUrl: string | null; bio: string | null; age: number | null;
  goals: string[]; isTrainer: boolean; plan: "FREE" | "PRO";
  hasOnboarded: boolean; createdAt: string;
}
interface UpdateUserMeDto {
  name?: string;                    // @IsString @IsNotEmpty
  avatarUrl?: string | null;        // @IsString
  bio?: string | null;              // @IsString @MaxLength(300)
  age?: number | null;              // @IsInt @Min(1) @Max(120)
  goals?: string[];                 // @IsArray @IsString({each:true})
}
```
`isTrainer`/`plan` não fazem parte do DTO de entrada (whitelist do `ValidationPipe` os descarta se enviados).

### Catalog — referência

| Método | Path | Resposta |
|---|---|---|
| GET | `/muscle-groups` | `200 MuscleGroupDto[]` |
| GET | `/equipment` | `200 EquipmentDto[]` |

```ts
interface MuscleGroupDto { id: string; name: string; slug: string }
interface EquipmentDto { id: string; name: string; slug: string }
```

### Catalog — Exercise

| Método | Path | Body / Query | Resposta | Erros |
|---|---|---|---|---|
| GET | `/exercises` | `PaginationQueryDto & { search?, muscleGroupSlug?, equipmentSlug?, category?, includeArchived? }` | `200 PaginatedResponse<ExerciseDto>` | `401` |
| GET | `/exercises/:id` | — | `200 ExerciseDto` | `401`, `404` |
| POST | `/exercises` | `CreateExerciseDto` | `201 ExerciseDto` | `400`, `401` |
| PATCH | `/exercises/:id` | `UpdateExerciseDto` | `200 ExerciseDto` | `400`, `401`, `404` |
| DELETE | `/exercises/:id` | — | `204` | `401`, `404` |

```ts
interface ExerciseDto {
  id: string; name: string; description: string | null;
  imageUrl: string | null; videoUrl: string | null;
  category: "STRENGTH" | "CARDIO" | "FLEXIBILITY" | "BALANCE";
  isArchived: boolean; tenantId: string | null;
  muscleGroups: Array<MuscleGroupDto & { isPrimary: boolean }>;
  equipment: EquipmentDto[];
  createdAt: string; updatedAt: string;
}
interface CreateExerciseDto {
  name: string;                      // @IsString @IsNotEmpty
  description?: string;              // @IsString
  imageUrl?: string;                 // @IsString
  videoUrl?: string;                 // @IsString
  category: ExerciseCategory;        // @IsEnum(ExerciseCategory)
  muscleGroupIds: Array<{ id: string; isPrimary: boolean }>; // @ValidateNested @ArrayMinSize(1)
  equipmentIds: string[];            // @IsArray @IsString({each:true})
}
type UpdateExerciseDto = Partial<CreateExerciseDto>; // todos campos @IsOptional
```
`GET /exercises` retorna global (`tenantId=null`) + custom do tenant; `GET/PATCH/DELETE /exercises/:id` retornam `404` se o exercício for global ou de outro tenant (PATCH/DELETE) ou de outro tenant (GET).

### Training — Strategy

| Método | Path | Body | Resposta | Erros |
|---|---|---|---|---|
| GET | `/strategies` | — | `200 StrategySummaryDto[]` | `401` |
| GET | `/strategies/:id` | — | `200 StrategyDetailDto` | `401`, `404` |
| POST | `/strategies` | `CreateStrategyDto` | `201 StrategySummaryDto` | `400`, `401` |
| PATCH | `/strategies/:id` | `UpdateStrategyDto` | `200 StrategySummaryDto` | `400`, `401`, `404` |
| DELETE | `/strategies/:id` | — | `204` | `401`, `404` |

```ts
interface WorkoutSummaryDto { id: string; name: string; order: number }
interface StrategySummaryDto {
  id: string; name: string; type: string | null; description: string | null;
  isActive: boolean; workouts: WorkoutSummaryDto[];
  createdAt: string; updatedAt: string;
}
interface StrategyDetailDto extends Omit<StrategySummaryDto, "workouts"> {
  workouts: WorkoutDetailDto[]; // ver seção Workout
}
interface CreateStrategyDto { name: string; type?: string; description?: string }
interface UpdateStrategyDto { name?: string; type?: string; description?: string; isActive?: boolean }
```
`PATCH` com `isActive: true` desativa as demais estratégias do tenant (transação).

### Training — Workout (aninhado)

| Método | Path | Body | Resposta | Erros |
|---|---|---|---|---|
| POST | `/workouts` | `CreateWorkoutDto` | `201 WorkoutDetailDto` | `400`, `401`, `404` (strategy de outro tenant), `422 PLAN_LIMIT_EXCEEDED` |
| GET | `/workouts/:id` | — | `200 WorkoutDetailDto` | `401`, `404` |
| PATCH | `/workouts/:id` | `UpdateWorkoutDto` | `200 WorkoutDetailDto` | `400`, `401`, `404` |
| DELETE | `/workouts/:id` | — | `204` | `401`, `404` |

```ts
interface PlannedSetDto { id: string; setNumber: number; targetReps: string; targetKg: string | null }
interface WorkoutExerciseDto {
  id: string; exerciseId: string; order: number; restSeconds: number;
  notes: string | null; plannedSets: PlannedSetDto[];
}
interface WorkoutDetailDto {
  id: string; strategyId: string; name: string; description: string | null;
  order: number; exercises: WorkoutExerciseDto[];
  createdAt: string; updatedAt: string;
}
interface CreatePlannedSetDto { setNumber: number; targetReps: string; targetKg?: string }
interface CreateWorkoutExerciseDto {
  exerciseId: string; order: number; restSeconds?: number; notes?: string;
  plannedSets: CreatePlannedSetDto[];
}
interface CreateWorkoutDto {
  strategyId: string; name: string; description?: string; order: number;
  exercises: CreateWorkoutExerciseDto[];
}
type UpdateWorkoutDto = Partial<Omit<CreateWorkoutDto, "strategyId">>;
```
`PATCH` com `exercises` informado substitui integralmente `exercises[]`/`plannedSets[]` (delete + recreate dos filhos). `exerciseId` deve ser visível ao tenant (global ou próprio) — senão `400 VALIDATION_ERROR`.

### Training — WorkoutSession (aninhado)

| Método | Path | Body / Query | Resposta | Erros |
|---|---|---|---|---|
| POST | `/workout-sessions` | `CreateWorkoutSessionDto` | `201 WorkoutSessionDetailDto` | `400`, `401`, `404` (workout de outro tenant) |
| GET | `/workout-sessions` | `PaginationQueryDto` | `200 PaginatedResponse<WorkoutSessionSummaryDto>` | `401` |
| GET | `/workout-sessions/:id` | — | `200 WorkoutSessionDetailDto` | `401`, `404` |
| PATCH | `/workout-sessions/:id` | `UpdateWorkoutSessionDto` | `200 WorkoutSessionDetailDto` | `400`, `401`, `404` |
| DELETE | `/workout-sessions/:id` | — | `204` | `401`, `404` |

```ts
interface ExecutedSetDto { id: string; setNumber: number; kg: number | null; reps: number | null; completedAt: string | null }
interface SessionExerciseDto { id: string; exerciseId: string; order: number; notes: string | null; executedSets: ExecutedSetDto[] }
interface WorkoutSessionSummaryDto {
  id: string; workoutId: string; startedAt: string; endedAt: string | null;
  status: "ACTIVE" | "FINISHED" | "ABANDONED"; comment: string | null; difficulty: number | null; createdAt: string;
}
interface WorkoutSessionDetailDto extends WorkoutSessionSummaryDto { exercises: SessionExerciseDto[] }

interface CreateExecutedSetDto { setNumber: number; kg?: number; reps?: number; completedAt?: string }
interface CreateSessionExerciseDto { exerciseId: string; order: number; notes?: string; executedSets: CreateExecutedSetDto[] }
interface CreateWorkoutSessionDto {
  workoutId: string; startedAt: string; endedAt?: string;
  status?: "ACTIVE" | "FINISHED" | "ABANDONED"; comment?: string; difficulty?: number;
  exercises: CreateSessionExerciseDto[];
}
type UpdateWorkoutSessionDto = Partial<Omit<CreateWorkoutSessionDto, "workoutId">>;
```
`status` default: `FINISHED` se `endedAt` informado, senão `ACTIVE`. `GET /workout-sessions` filtra `startedAt >= now-60d` se `user.plan === "FREE"`.

---

## Ordem de Execução

```
Fase 1 (sequencial, bloqueia tudo):  T1 (auth guard + infra cross-cutting)
Fase 2 (paralelo):                   T2 (pagination util) + T3 (Identity: users/me)
                                      + T4 (Catalog: reference data) + T6 (Training: Strategy)
Fase 3 (sequencial, após T1+T2):     T5 (Catalog: Exercise CRUD)
Fase 4 (sequencial, após T5+T6):     T7 (Training: Workout CRUD aninhado)
Fase 5 (sequencial, após T7):        T8 (Training: WorkoutSession CRUD aninhado)
Fase 6 (paralelo, opcional/chore):   T9 (seed Catalog) + T10 (reconciliação docs)
```

---

## Tarefas

---

### Tarefa 1: Auth guard, validação, error handling, Swagger (infra cross-cutting)
Tipo: chore
Agente: backend

Implementar toda a infraestrutura transversal da API: autenticação via JWT do NextAuth, validação global de DTOs, formato padronizado de respostas/erros e documentação Swagger. **Bloqueia todas as outras tarefas** — nenhum endpoint funcional deve ser exposto sem isso.

**Dependências a adicionar em `apps/api/package.json`:**
```json
"next-auth": "^5.0.0-beta.29",
"@auth/core": "^0.41.0",
"@nestjs/swagger": "^7.4.0",
"class-validator": "^0.14.0",
"class-transformer": "^0.5.1"
```

**Arquivos a criar:**
- `apps/api/src/common/auth/jwt-auth.guard.ts` — `JwtAuthGuard implements CanActivate`. Lê `Authorization: Bearer <token>`, decodifica via `decode()` de `next-auth/jwt` com `process.env.AUTH_SECRET` e `salt: process.env.AUTH_COOKIE_NAME ?? "authjs.session-token"`. Sem header ou `payload?.id` ausente → `UnauthorizedException`. Seta `request.user = { id: payload.id, plan: payload.plan }` (ver nota abaixo sobre `plan`).
- `apps/api/src/common/auth/public.decorator.ts` — `@Public()` (seta metadata `IS_PUBLIC_KEY`), usado pelo guard via `Reflector` para liberar `/health`.
- `apps/api/src/common/auth/current-user.decorator.ts` — `@CurrentUser()` param decorator retornando `request.user`.
- `apps/api/src/common/filters/http-exception.filter.ts` — `@Catch()` global, mapeia exceções para `{data:null, error:{code,message}}` conforme seção "Decisões técnicas — 2".
- `apps/api/src/common/interceptors/response.interceptor.ts` — envolve respostas não-204 em `{data, error:null}`.

**Arquivos a modificar:**
- `apps/api/src/main.ts` — `app.useGlobalPipes(new ValidationPipe({whitelist:true, forbidNonWhitelisted:true, transform:true}))`; configurar Swagger (`SwaggerModule.setup('api/v1/docs', app, document)` com `DocumentBuilder().addBearerAuth()`).
- `apps/api/src/app.module.ts` — registrar `IdentityModule`, `CatalogModule`, `TrainingModule` (atualmente ausentes) + providers globais `{provide: APP_GUARD, useClass: JwtAuthGuard}`, `{provide: APP_FILTER, useClass: HttpExceptionFilter}`, `{provide: APP_INTERCEPTOR, useClass: ResponseInterceptor}`.
- `apps/api/src/health/health.controller.ts` — adicionar `@Public()` no controller/endpoint.
- `packages/types/src/index.ts` — adicionar `enum ApiErrorCode` (seção "Decisões técnicas — 2").
- `.env` / `apps/web/.env.local` — adicionar `AUTH_COOKIE_NAME=authjs.session-token` (documentar default).

**Nota sobre `payload.plan`:** o callback `jwt` em `apps/web/src/lib/auth.ts` hoje seta `token.id` e `token.hasOnboarded`, mas **não** `token.plan`. A Tarefa 8 (`GET /workout-sessions`, filtro 60 dias) precisa do `plan` do usuário — resolver buscando via `IUsersRepository.findById(tenantId)` dentro do use case (não depender do JWT para isso), evitando alterar `apps/web` nesta fase.

Critérios de Aceite:
- [ ] `GET /api/v1/health` responde `200` sem header `Authorization`.
- [ ] Qualquer outra rota sem `Authorization` ou com token inválido/expirado → `401 {data:null, error:{code:"UNAUTHORIZED", message:...}}`.
- [ ] Token válido (gerado com `encode()` de `next-auth/jwt` + `AUTH_SECRET` nos testes) → request prossegue com `request.user.id` correto.
- [ ] Endpoint de teste retornando objeto simples é envolvido em `{data:{...}, error:null}`.
- [ ] Endpoint de teste com `@HttpCode(204)` retorna corpo vazio (sem wrapping).
- [ ] DTO de teste com campo obrigatório ausente → `400 {data:null, error:{code:"VALIDATION_ERROR", message:[...]}}`.
- [ ] Exceção não tratada (ex: erro de Prisma) → `500 {data:null, error:{code:"INTERNAL_ERROR", message:"Internal server error"}}` (sem stack).
- [ ] `/api/v1/docs` carrega Swagger UI com esquema Bearer configurado.
- [ ] Testes unitários: guard (sem token / token inválido / token válido), filter (cada tipo de exceção → status+code).

Notas: usar `jose` (dependência transitiva de `@auth/core`) apenas via `next-auth/jwt`, não importar diretamente. `AUTH_SECRET` já existe em `.env`/`apps/web/.env.local` — reusar (não duplicar).

---

### Tarefa 2: Utilitário de paginação cursor-based
Tipo: chore
Agente: backend

Criar DTO de query e helper reutilizável de paginação cursor-based (cursor = `id` do último item), usados pelas Tarefas 5 e 8.

**Arquivos a criar:**
- `apps/api/src/common/dto/pagination-query.dto.ts` — `PaginationQueryDto` (ver seção "Decisões técnicas — 3", com decorators `class-validator`/`class-transformer` e `@ApiPropertyOptional` do Swagger).
- `apps/api/src/common/pagination/paginate.ts` — função `paginate<T extends {id:string}>()` (ver seção "Decisões técnicas — 3").

Critérios de Aceite:
- [ ] `paginate()` com `findPage` retornando `limit` itens (sem extra) → `nextCursor: null`.
- [ ] `findPage` retornando `limit+1` itens → `items` truncado em `limit`, `nextCursor = items[last].id`.
- [ ] `findPage` retornando `0` itens → `{items:[], total:0, nextCursor:null}`.
- [ ] `cursor` recebido é repassado como `{id: cursor}` + `skip:1` para `findPage`.
- [ ] Testes unitários cobrindo os 4 cenários acima.

Notas: depende apenas de `packages/types` (`PaginatedResponse<T>`), sem dependência de T1.

---

### Tarefa 3: Identity — `GET/PATCH/DELETE /users/me`
Tipo: feature
Agente: backend

Expor o perfil do usuário autenticado. Reusa `IUsersRepository` existente (`apps/api/src/identity/domain/repositories/users.repository.interface.ts`) — **sem alterações de repositório** (`update` e `softDelete` já existem com os campos necessários).

**Arquivos a criar:**
- `apps/api/src/identity/application/dto/user-me.dto.ts` — `UserMeDto` (response, `@ApiProperty` em cada campo).
- `apps/api/src/identity/application/dto/update-user-me.dto.ts` — `UpdateUserMeDto` (ver contrato).
- `apps/api/src/identity/application/use-cases/get-me.use-case.ts` — `execute(tenantId): Promise<User>`, lança `NotFoundException` se `findById` retornar `null` ou `user.isDeleted()`.
- `apps/api/src/identity/application/use-cases/update-me.use-case.ts` — `execute(tenantId, dto): Promise<User>`.
- `apps/api/src/identity/application/use-cases/delete-me.use-case.ts` — `execute(tenantId): Promise<void>` chamando `softDelete`.
- `apps/api/src/identity/presentation/users.controller.ts` — `@Controller("users")`, rotas `GET /me`, `PATCH /me`, `DELETE /me` (`@HttpCode(204)`), mapeando `User` → `UserMeDto`.
- `apps/api/test/users.e2e-spec.ts` — Supertest.

**Arquivos a modificar:**
- `apps/api/src/identity/identity.module.ts` — registrar controller + use cases.

Critérios de Aceite:
- [ ] `GET /users/me` sem token → `401` (via T1).
- [ ] `GET /users/me` com token válido retorna os dados do **próprio** usuário (`id` do JWT), nunca de outro.
- [ ] `PATCH /users/me` com `bio` de 301 caracteres → `400 VALIDATION_ERROR`.
- [ ] `PATCH /users/me` com `isTrainer`/`plan` no body → campos ignorados (whitelist), resposta reflete valores antigos no banco.
- [ ] `PATCH /users/me` com `goals: ["hipertrofia","emagrecimento"]` persiste e retorna o array.
- [ ] `DELETE /users/me` → `204`, `User.deletedAt` preenchido no banco.
- [ ] Testes unitários dos 3 use cases com `IUsersRepository` mockado + Supertest cobrindo os pontos acima.

Notas: depende apenas de T1 (guard/pipe/filter). Pode rodar em paralelo com T4 e T6.

---

### Tarefa 4: Catalog — dados de referência (`/muscle-groups`, `/equipment`)
Tipo: feature
Agente: backend

Endpoints somente leitura para `MuscleGroup` e `Equipment`. Não existem repositórios para essas entidades ainda — criar interfaces + implementações Prisma simples.

**Arquivos a criar:**
- `apps/api/src/catalog/domain/repositories/muscle-groups.repository.interface.ts` — `interface IMuscleGroupsRepository { findAll(): Promise<MuscleGroup[]> }`.
- `apps/api/src/catalog/domain/repositories/equipment.repository.interface.ts` — `interface IEquipmentRepository { findAll(): Promise<Equipment[]> }`.
- `apps/api/src/catalog/infra/repositories/prisma-muscle-groups.repository.ts` — `prisma.muscleGroup.findMany({orderBy:{name:"asc"}})`.
- `apps/api/src/catalog/infra/repositories/prisma-equipment.repository.ts` — `prisma.equipment.findMany({orderBy:{name:"asc"}})`.
- `apps/api/src/catalog/application/dto/muscle-group.dto.ts` / `equipment.dto.ts` — `MuscleGroupDto`/`EquipmentDto` (ver contrato).
- `apps/api/src/catalog/presentation/catalog-reference.controller.ts` — `@Controller()`, rotas `GET /muscle-groups`, `GET /equipment`.
- `apps/api/test/catalog-reference.e2e-spec.ts` — Supertest.

**Arquivos a modificar:**
- `apps/api/src/catalog/catalog.module.ts` — registrar providers (tokens `IMuscleGroupsRepository`/`IEquipmentRepository` → impls Prisma) + controller.

Critérios de Aceite:
- [ ] `GET /muscle-groups` → `200`, array ordenado por `name` (vazio se sem seed — ok).
- [ ] `GET /equipment` → `200`, array ordenado por `name`.
- [ ] Sem token → `401`.
- [ ] Supertest cria 2-3 registros via Prisma direto no setup e confere ordenação/shape.

Notas: depende apenas de T1. Pode rodar em paralelo com T3 e T6.

---

### Tarefa 5: Catalog — Exercise CRUD + paginação + filtros
Tipo: feature
Agente: backend

CRUD de `Exercise`: leitura paginada (global + custom do tenant) com filtros, e escrita restrita a exercícios customizados do próprio tenant.

**Repositório — `apps/api/src/catalog/domain/repositories/exercises.repository.interface.ts` (modificar):**
```ts
export interface IFindExercisesOptions {
  tenantId: string;
  search?: string;
  muscleGroupSlug?: string;
  equipmentSlug?: string;
  category?: string;
  includeArchived?: boolean;
}

export interface IExercisesRepository {
  findMany(options: IFindExercisesOptions & { take: number; cursor?: string }): Promise<Exercise[]>; // MODIFICADO: +take, +cursor
  count(options: IFindExercisesOptions): Promise<number>; // NOVO
  findById(id: string): Promise<Exercise | null>;
  create(data: { /* igual ao atual */ }): Promise<Exercise>;
  update(id: string, tenantId: string, data: Partial<{
    name: string; description: string | null; imageUrl: string | null; videoUrl: string | null;
    category: string; muscleGroupIds: Array<{ id: string; isPrimary: boolean }>; equipmentIds: string[];
  }>): Promise<Exercise>; // NOVO — 404 (retorna null) se não for exercício custom do tenant
  archive(id: string): Promise<void>;
}
```
- `findMany`: filtro de visibilidade `OR: [{tenantId: null}, {tenantId: options.tenantId}]`; `isArchived: options.includeArchived ? undefined : false`; `orderBy: [{createdAt:"asc"},{id:"asc"}]`; `take`, `cursor`/`skip` conforme `paginate()` (Tarefa 2).
- `update`: `findUnique` primeiro — se `tenantId !== options.tenantId` (incl. `null`), retornar `null` (controller mapeia para `404`). Atualiza campos simples + recria relações `ExerciseMuscleGroup`/`ExerciseEquipment` (delete + createMany) em transação.

**Arquivos a criar:**
- `apps/api/src/catalog/application/dto/exercise.dto.ts` — `ExerciseDto`, `CreateExerciseDto`, `UpdateExerciseDto` (ver contrato; `category` valida via `@IsEnum(ExerciseCategory)`).
- `apps/api/src/catalog/application/dto/find-exercises-query.dto.ts` — extends `PaginationQueryDto` + `search?, muscleGroupSlug?, equipmentSlug?, category?, includeArchived?` (todos `@IsOptional`).
- `apps/api/src/catalog/application/use-cases/{list,get,create,update,archive}-exercise.use-case.ts`.
- `apps/api/src/catalog/presentation/exercises.controller.ts` — `@Controller("exercises")`: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id` (`204`, chama `archive`).
- `apps/api/test/exercises.e2e-spec.ts`.

**Arquivos a modificar:**
- `apps/api/src/catalog/infra/repositories/prisma-exercises.repository.ts` — implementar `findMany`/`count`/`update` conforme acima.
- `apps/api/src/catalog/catalog.module.ts` — registrar novos use cases/controller.

Critérios de Aceite:
- [ ] `GET /exercises` sem filtros retorna globais + custom do tenant, paginado (`limit` default 20).
- [ ] Criar 21 exercícios custom de teste → `GET /exercises?limit=20` retorna `nextCursor` não-nulo; segunda página com `cursor=<nextCursor>` retorna o restante e `nextCursor:null`.
- [ ] Filtros `search`, `muscleGroupSlug`, `equipmentSlug`, `category` reduzem corretamente os resultados (fixtures via Prisma).
- [ ] `GET /exercises/:id` de exercício custom de **outro** tenant → `404`.
- [ ] `POST /exercises` cria com `tenantId = req.user.id`; aparece em `GET /exercises` subsequente.
- [ ] `PATCH /exercises/:id` em exercício global (`tenantId=null`) → `404`.
- [ ] `PATCH /exercises/:id` em exercício custom de outro tenant → `404`.
- [ ] `DELETE /exercises/:id` seta `isArchived=true`; some de `GET /exercises` default; aparece com `?includeArchived=true`.
- [ ] Testes unitários dos use cases (repo mockado) + Supertest dos pontos acima.

Notas: depende de T1 (guard/pipe) e T2 (`paginate`). Pode rodar em paralelo com T3/T4/T6, mas é pré-requisito de T7 (validação de `exerciseId`).

---

### Tarefa 6: Training — Strategy CRUD
Tipo: feature
Agente: backend

CRUD de `Strategy`, com regra de exclusividade de `isActive`.

**Repositório — `apps/api/src/training/domain/repositories/strategies.repository.interface.ts` (modificar):**
```ts
export interface IStrategiesRepository {
  findByTenant(tenantId: string): Promise<Strategy[]>;
  findById(id: string, tenantId: string): Promise<Strategy | null>;
  findActiveByTenant(tenantId: string): Promise<Strategy | null>;
  create(data: { tenantId: string; name: string; type?: string; description?: string }): Promise<Strategy>;
  update(id: string, tenantId: string, data: Partial<{
    name: string; type: string | null; description: string | null; isActive: boolean;
  }>): Promise<Strategy | null>; // NOVO — substitui `setActive`; null se não pertence ao tenant
  delete(id: string, tenantId: string): Promise<void>;
}
```
- `update`: se `data.isActive === true`, em `$transaction`: (1) `updateMany({where:{tenantId, NOT:{id}}, data:{isActive:false}})`, (2) `update` do registro alvo com todos os campos fornecidos. Se `data.isActive` ausente/`false`, apenas `update` direto. Retorna `null` se `findFirst({id, tenantId})` não existir.

**Arquivos a criar:**
- `apps/api/src/training/application/dto/strategy.dto.ts` — `StrategySummaryDto`, `StrategyDetailDto`, `CreateStrategyDto`, `UpdateStrategyDto` (ver contrato; `WorkoutSummaryDto`/`WorkoutDetailDto` ficam em `workout.dto.ts` da Tarefa 7, mas a interface `WorkoutSummaryDto` mínima — `{id,name,order}` — pode ser declarada aqui e reexportada).
- `apps/api/src/training/application/use-cases/{list,get,create,update,delete}-strategy.use-case.ts`.
- `apps/api/src/training/presentation/strategies.controller.ts` — `@Controller("strategies")`: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`.
- `apps/api/test/strategies.e2e-spec.ts`.

**Arquivos a modificar:**
- `apps/api/src/training/infra/repositories/prisma-strategies.repository.ts` — substituir `setActive` por `update` (acima); ajustar `delete` para `deleteMany({where:{id,tenantId}})` (idempotente, sem lançar se não existir — controller decide 404 via `findById` prévio ou checagem de `count`).
- `apps/api/src/training/training.module.ts` — registrar novos use cases/controller.

Critérios de Aceite:
- [ ] `GET /strategies` retorna todas as estratégias do tenant com `workouts` resumidos (`{id,name,order}`), sem `exercises`/`plannedSets`.
- [ ] `GET /strategies/:id` de outro tenant → `404`.
- [ ] `POST /strategies` cria com `isActive=true` (default do schema).
- [ ] Criar Strategy A (isActive=true por default) e Strategy B; `PATCH /strategies/:B/id {isActive:true}` → A passa a `isActive=false`, B vira `true` (`findActiveByTenant` retorna só B).
- [ ] `DELETE /strategies/:id` remove a estratégia e seus `workouts` em cascata (verificado via Prisma direto no teste).
- [ ] `DELETE /strategies/:id` de outro tenant → `404`.
- [ ] Testes unitários dos use cases + Supertest dos pontos acima.

Notas: depende apenas de T1. Pode rodar em paralelo com T3/T4/T5. **Pré-requisito de T7** (validação de `strategyId`).

---

### Tarefa 7: Training — Workout CRUD aninhado (exercises + plannedSets)
Tipo: feature
Agente: backend

CRUD de `Workout` com escrita aninhada de `WorkoutExercise`/`PlannedSet` em payload único, validação de propriedade da `Strategy`, validação de `exerciseId` visível ao tenant, e enforcement do limite de 6 workouts/tenant.

**Repositório — `apps/api/src/training/domain/repositories/workouts.repository.interface.ts` (modificar):**
```ts
export interface IPlannedSetInput { setNumber: number; targetReps: string; targetKg?: string | null }
export interface IWorkoutExerciseInput {
  exerciseId: string; order: number; restSeconds?: number; notes?: string | null;
  plannedSets: IPlannedSetInput[];
}

export interface IWorkoutsRepository {
  findByStrategy(strategyId: string, tenantId: string): Promise<Workout[]>;
  findById(id: string, tenantId: string): Promise<Workout | null>;
  countByTenant(tenantId: string): Promise<number>;
  create(data: {
    strategyId: string; tenantId: string; name: string; description?: string; order: number;
    exercises: IWorkoutExerciseInput[];
  }): Promise<Workout>; // MODIFICADO: +exercises
  update(id: string, tenantId: string, data: Partial<{
    name: string; description: string | null; order: number; exercises: IWorkoutExerciseInput[];
  }>): Promise<Workout | null>; // MODIFICADO: +exercises (substitui filhos), null se não pertence ao tenant
  delete(id: string, tenantId: string): Promise<void>;
}
```
- `create`/`update` (quando `exercises` informado) em `$transaction`: para cada `WorkoutExercise`, `prisma.workoutExercise.create({data:{..., plannedSets:{create:[...]}}})`. No `update`, antes recriar: `prisma.workoutExercise.deleteMany({where:{workoutId:id}})` (cascata remove `plannedSets`).

**Arquivos a criar:**
- `apps/api/src/training/application/dto/workout.dto.ts` — `PlannedSetDto`, `WorkoutExerciseDto`, `WorkoutDetailDto`, `WorkoutSummaryDto`, `CreatePlannedSetDto`, `CreateWorkoutExerciseDto`, `CreateWorkoutDto`, `UpdateWorkoutDto` (ver contrato; usar `@ValidateNested({each:true}) @Type(() => ...)` para arrays aninhados).
- `apps/api/src/training/application/use-cases/{create,get,update,delete}-workout.use-case.ts`.
  - `CreateWorkoutUseCase`: 1) `strategiesRepo.findById(dto.strategyId, tenantId)` → `null` ⇒ `NotFoundException`; 2) `workoutsRepo.countByTenant(tenantId) >= 6` ⇒ `UnprocessableEntityException({code:"PLAN_LIMIT_EXCEEDED", message:"Limite de 6 treinos atingido"})`; 3) validar cada `exercises[].exerciseId` via `exercisesRepo.findById` (existe e é global ou do tenant) ⇒ senão `BadRequestException({code:"VALIDATION_ERROR", message:"exerciseId inválido: <id>"})`; 4) `workoutsRepo.create(...)`.
  - `UpdateWorkoutUseCase`: mesma validação de `exerciseId` se `exercises` informado; `null` do repo ⇒ `NotFoundException`.
- `apps/api/src/training/presentation/workouts.controller.ts` — `@Controller("workouts")`: `POST /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`.
- `apps/api/test/workouts.e2e-spec.ts`.

**Arquivos a modificar:**
- `apps/api/src/training/infra/repositories/prisma-workouts.repository.ts` — implementar `create`/`update` aninhados acima.
- `apps/api/src/training/training.module.ts` — registrar novos use cases/controller; injetar `IExercisesRepository` (de `CatalogModule` — exportar provider lá se necessário) e `IStrategiesRepository`.

Critérios de Aceite:
- [ ] `POST /workouts` com `strategyId` de outro tenant → `404`.
- [ ] Criar 6 workouts no tenant; 7º `POST /workouts` → `422 {code:"PLAN_LIMIT_EXCEEDED"}`.
- [ ] `POST /workouts` com `exercises[0].exerciseId` inexistente → `400 VALIDATION_ERROR`.
- [ ] `POST /workouts` com payload válido → `201`, `GET /workouts/:id` retorna `exercises` ordenados por `order` e `plannedSets` ordenados por `setNumber`.
- [ ] `PATCH /workouts/:id` com novo array `exercises` → filhos antigos (`PlannedSet`/`WorkoutExercise`) deixam de existir (verificado via Prisma), novos persistidos.
- [ ] `PATCH/GET/DELETE /workouts/:id` de outro tenant → `404`.
- [ ] `DELETE /workouts/:id` remove `workoutExercises`, `plannedSets` e `sessions` associadas em cascata.
- [ ] Testes unitários dos use cases (repos mockados, incluindo cenário de limite e exerciseId inválido) + Supertest.

Notas: depende de T5 (Exercise — validação de `exerciseId`) e T6 (Strategy — ownership). **Pré-requisito de T8** (workoutId ownership).

---

### Tarefa 8: Training — WorkoutSession CRUD aninhado (sessionExercises + executedSets) + histórico
Tipo: feature
Agente: backend

CRUD de `WorkoutSession` com escrita aninhada de `SessionExercise`/`ExecutedSet`, listagem paginada com filtro de retenção de 60 dias para plano FREE.

**Repositório — `apps/api/src/training/domain/repositories/workout-sessions.repository.interface.ts` (reescrever):**
```ts
export interface IExecutedSetInput { setNumber: number; kg?: number | null; reps?: number | null; completedAt?: Date | null }
export interface ISessionExerciseInput { exerciseId: string; order: number; notes?: string | null; executedSets: IExecutedSetInput[] }

export interface IWorkoutSessionsRepository {
  findById(id: string, tenantId: string): Promise<WorkoutSession | null>;
  findManyByTenant(opts: {
    tenantId: string; take: number; cursor?: string; startedAfter?: Date;
  }): Promise<WorkoutSession[]>; // NOVO — orderBy [{startedAt:"desc"},{id:"desc"}]
  count(opts: { tenantId: string; startedAfter?: Date }): Promise<number>; // NOVO
  create(data: {
    workoutId: string; tenantId: string; startedAt: Date; endedAt?: Date | null;
    status?: WorkoutSessionStatus; comment?: string | null; difficulty?: number | null;
    exercises: ISessionExerciseInput[];
  }): Promise<WorkoutSession>; // MODIFICADO: payload completo aninhado
  update(id: string, tenantId: string, data: Partial<{
    endedAt: Date | null; status: WorkoutSessionStatus; comment: string | null; difficulty: number | null;
    exercises: ISessionExerciseInput[];
  }>): Promise<WorkoutSession | null>; // NOVO — substitui `finish`/`updateStatus`; null se não pertence ao tenant
  delete(id: string, tenantId: string): Promise<void>; // NOVO
}
```
> `findByWorkout`/`findLastByWorkout` da interface atual não são usados por nenhum controller ainda — podem ser removidos (YAGNI) ou mantidos a critério do implementador; não fazem parte do contrato desta spec.

- `create`/`update` (com `exercises`) em `$transaction`, mesmo padrão de delete+recreate da Tarefa 7 (`sessionExercise.deleteMany` cascata `executedSets`).
- `status` default no use case (não no repo): `endedAt` informado → `FINISHED`; senão `ACTIVE`.

**Arquivos a criar:**
- `apps/api/src/training/application/dto/workout-session.dto.ts` — `ExecutedSetDto`, `SessionExerciseDto`, `WorkoutSessionSummaryDto`, `WorkoutSessionDetailDto`, `CreateExecutedSetDto`, `CreateSessionExerciseDto`, `CreateWorkoutSessionDto`, `UpdateWorkoutSessionDto` (ver contrato).
- `apps/api/src/training/application/dto/find-workout-sessions-query.dto.ts` — extends `PaginationQueryDto`.
- `apps/api/src/training/application/use-cases/{create,list,get,update,delete}-workout-session.use-case.ts`.
  - `CreateWorkoutSessionUseCase`: 1) `workoutsRepo.findById(dto.workoutId, tenantId)` → `null` ⇒ `NotFoundException`; 2) validar `exercises[].exerciseId` (igual T7); 3) calcular `status` default; 4) `repo.create(...)`.
  - `ListWorkoutSessionsUseCase`: busca `usersRepo.findById(tenantId)` para `plan`; se `FREE`, `startedAfter = new Date(Date.now() - 60*24*60*60*1000)`; chama `paginate()` (T2) com `findManyByTenant`/`count`.
- `apps/api/src/training/presentation/workout-sessions.controller.ts` — `@Controller("workout-sessions")`: `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`.
- `apps/api/test/workout-sessions.e2e-spec.ts`.

**Arquivos a modificar:**
- `apps/api/src/training/infra/repositories/prisma-workout-sessions.repository.ts` — reescrever conforme interface acima.
- `apps/api/src/training/training.module.ts` — registrar novos use cases/controller; injetar `IUsersRepository` (de `IdentityModule` — exportar provider se necessário).

Critérios de Aceite:
- [ ] `POST /workout-sessions` com `workoutId` de outro tenant → `404`.
- [ ] `POST /workout-sessions` com payload aninhado válido (sem `endedAt`) → `201`, `status: "ACTIVE"`.
- [ ] `POST /workout-sessions` com `endedAt` → `status: "FINISHED"`.
- [ ] `GET /workout-sessions/:id` retorna `exercises[].executedSets[]` completos.
- [ ] Criar 25 sessões de teste (tenant PRO) → `GET /workout-sessions?limit=20` pagina corretamente (`nextCursor`).
- [ ] Tenant com `plan=FREE`: sessão com `startedAt` = hoje−61 dias **não** aparece em `GET /workout-sessions`; sessão de hoje−10 dias aparece.
- [ ] Tenant com `plan=PRO`: sessão de hoje−61 dias aparece normalmente.
- [ ] `PATCH /workout-sessions/:id` com novo `exercises` substitui `executedSets`/`sessionExercises` antigos.
- [ ] `GET/PATCH/DELETE /workout-sessions/:id` de outro tenant → `404`.
- [ ] Testes unitários dos use cases (repos mockados, incl. cenário FREE vs PRO) + Supertest.

Notas: depende de T7 (Workout — ownership) e T5 (Exercise — validação `exerciseId`). Última tarefa funcional da spec.

---

### Tarefa 9: Seed de dados de referência (Catalog)
Tipo: chore
Agente: backend

Popular `MuscleGroup`, `Equipment` e exercícios globais (`Exercise.tenantId = null`) para que `GET /muscle-groups`, `/equipment` e `/exercises` retornem dados utilizáveis em dev/staging (mitigação do risco de seed ausente apontado na spec).

**Arquivos a criar:**
- `packages/db/prisma/seed.ts` — script idempotente (`upsert` por `slug`):
  - ~10 `MuscleGroup` (peito, costas, ombros, bíceps, tríceps, quadríceps, posterior de coxa, glúteos, panturrilha, abdômen).
  - ~8 `Equipment` (barra, halteres, máquina, cabo, peso corporal, kettlebell, elástico, banco).
  - ~12-15 `Exercise` globais (`tenantId: null`) cobrindo as 4 categorias (`STRENGTH`, `CARDIO`, `FLEXIBILITY`, `BALANCE`) com `muscleGroups`/`equipment` relacionados.

**Arquivos a modificar:**
- `packages/db/package.json` — adicionar `"prisma": {"seed": "tsx prisma/seed.ts"}` e script `"db:seed": "prisma db seed"`; adicionar `tsx` como devDependency se ausente.

Critérios de Aceite:
- [ ] `pnpm --filter @fitflow/db db:seed` roda sem erro e é idempotente (rodar 2x não duplica registros).
- [ ] Após seed, `GET /muscle-groups`, `GET /equipment`, `GET /exercises` retornam os dados populados.

Notas: não bloqueia nem é bloqueado por T3-T8 (pode rodar em paralelo); útil para QA manual via Swagger.

---

### Tarefa 10: Reconciliação de documentação
Tipo: chore
Agente: ambos

Atualizar `docs/` para refletir as decisões tomadas nesta spec/plano (rastreabilidade exigida pelo `CLAUDE.md`).

**Arquivos a modificar:**
- `docs/context/product.md` — seção "Business Rules": substituir "Máximo de 2 programas ativos simultaneamente / Máximo de 4 treinos por programa" por "Máximo de 6 treinos (Workouts) por usuário no plano FREE (sem limite de Estratégias; apenas uma pode estar `isActive` por vez)".
- `docs/architecture/overview.md`:
  - Seção "Bounded Contexts": preencher com Identity (`User`, `TrainerStudentRelationship`*), Catalog (`Exercise`, `MuscleGroup`, `Equipment`), Training (`Strategy`, `Workout`, `WorkoutSession` + entidades filhas). *TrainerStudentRelationship anotado como "Fase 8 — Coaching, fora desta API".
  - Seção "Decisões registradas": adicionar linhas para "Auth API" (validação JWT NextAuth via `next-auth/jwt` decode), "Paginação" (cursor nativo Prisma por `id`), "Formato de resposta" (`ApiResponse<T>`/`PaginatedResponse<T>`/`ApiErrorCode` em `packages/types`).
- `docs/context/current-state.md` — marcar item "4. Spec + plano de API REST" como concluído; atualizar "Próximos passos" para apontar Fase 2 (integração frontend).

Critérios de Aceite:
- [ ] Nenhuma referência a "2 estratégias ativas" / "4 treinos por programa" permanece em `docs/`.
- [ ] `docs/architecture/overview.md` Bounded Contexts preenchido para os 3 contexts desta spec.

Notas: pode ser feito a qualquer momento após T1-T8 estarem definidas (não bloqueia implementação); idealmente como último commit da feature.

---

<!-- Plano gerado a partir de docs/specs/2026-06-10-api-rest-core.md (Status: approved) -->
