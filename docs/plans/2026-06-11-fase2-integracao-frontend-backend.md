# Plano Técnico: Fase 2 — Integração Frontend ↔ Backend (TASK04-07)

**Spec:** `docs/specs/2026-06-11-fase2-integracao-frontend-backend.md`
**Data:** 2026-06-11
**Escopo:** monorepo global (`apps/web`, `apps/api`, `packages/types`)
**Stack envolvida:** Next.js 15 (App Router) + NextAuth v5 (beta) + `@tanstack/react-query` v5, NestJS + Prisma (Identity/Catalog/Training já implementados — TASK01-03)

---

## Estado atual

- API REST (TASK01-03) completa e testada: `/users/me`, `/muscle-groups`, `/equipment`, `/exercises`, `/strategies`, `/workouts`, `/workout-sessions`, todas `tenantId`-scoped, resposta `{data,error}` (`ApiResponse<T>`/`PaginatedResponse<T>`/`ApiErrorCode` em `@fitflow/types`).
- `apps/web` **não** tem `@tanstack/react-query`, nem cliente HTTP para a API NestJS, nem provider em `apps/web/src/app/layout.tsx` (hoje só `ThemeProvider`).
- `NEXT_PUBLIC_API_URL=http://localhost:3001` já existe em `apps/web/.env.local.example`.
- `apps/web/src/lib/auth.ts`: NextAuth v5, `session.strategy: "jwt"`. Callback `jwt` seta `token.id`/`token.hasOnboarded` apenas em sign-in (`if (user)`); **sem** tratamento de `trigger === "update"`. Tem workaround documentado para TS2742 nos exports `auth`/`signIn`/`signOut`.
- `apps/web/src/middleware.ts`: protege rotas não-públicas redirecionando para `/login`; **sem** lógica de `hasOnboarded`.
- `UpdateUserMeDto` / `UpdateMeUseCase` / `IUsersRepository.update` **não** aceitam `hasOnboarded`.
- `CreateWorkoutDto.exercises` (e `UpdateWorkoutDto.exercises`) tem `@ArrayMinSize(1)` — bloqueia Workouts "vazios".
- `IWorkoutSessionsRepository` não tem métodos de agregação por período/streak nem contagem por `Strategy`.
- `apps/web/src/components/ui/` tem `button`, `badge`, `avatar`, `separator`, `sheet`, `theme-toggle`. **Não** existe `dropdown-menu`/`alert-dialog`; `@radix-ui/react-dropdown-menu` e `@radix-ui/react-alert-dialog` não estão em `apps/web/package.json` (`@radix-ui/react-dialog` está instalado mas não usado).
- Telas-alvo (`/dashboard`, `/exercises`, `/exercises/[id]`, `/library`, `/program/[id]`, `/onboarding`) usam dados 100% mockados de `apps/web/src/lib/mock/*`. Props/contratos atuais dos componentes já mapeados (ver Tarefas 7-9).

---

## Decisões técnicas adicionais (resolvendo "Riscos e Premissas" da spec)

### 1. Cliente HTTP + autenticação (FR-002): proxy BFF same-origin

`session.strategy: "jwt"` faz o cookie de sessão (`authjs.session-token` em dev / `__Secure-authjs.session-token` em produção) **ser** o JWE bruto que `apps/api`'s `JwtAuthGuard` decodifica via `next-auth/jwt` `decode()`. Esse cookie é `httpOnly` — **não** pode ser lido por JS no browser. Logo:

- **Server Components / Server Actions** (`typeof window === "undefined"`): leem o cookie via `cookies()` de `next/headers` e chamam a API NestJS **diretamente** em `NEXT_PUBLIC_API_URL`, enviando `Authorization: Bearer <cookie>`.
- **Client Components** (hooks TanStack Query): chamam um **route handler proxy same-origin** (`/api/proxy/...`) que roda no servidor Next, lê o mesmo cookie e repassa para a API com o header `Authorization`. Evita expor o token ao JS do browser e evita CORS.

`apps/web/src/app/api/proxy/[...path]/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const COOKIE_NAMES = ["__Secure-authjs.session-token", "authjs.session-token"];

async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  for (const name of COOKIE_NAMES) {
    const value = store.get(name)?.value;
    if (value) return value;
  }
  return null;
}

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const token = await getSessionToken();
  if (!token) {
    return NextResponse.json(
      { data: null, error: { code: "UNAUTHORIZED", message: "Não autenticado" } },
      { status: 401 },
    );
  }

  const { path } = await params;
  const url = new URL(`/api/v1/${path.join("/")}${req.nextUrl.search}`, process.env.NEXT_PUBLIC_API_URL);
  const hasBody = !["GET", "HEAD", "DELETE"].includes(req.method);

  const res = await fetch(url, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(hasBody ? { "content-type": req.headers.get("content-type") ?? "application/json" } : {}),
    },
    body: hasBody ? await req.text() : undefined,
  });

  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: { "content-type": res.headers.get("content-type") ?? "application/json" },
  });
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
```

`apps/web/src/lib/api/client.ts`:
```ts
import type { ApiResponse } from "@fitflow/types";

export class ApiClientError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiClientError";
  }
}

const COOKIE_NAMES = ["__Secure-authjs.session-token", "authjs.session-token"];

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  let url: string;
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");

  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const store = await cookies();
    const token = COOKIE_NAMES.map((n) => store.get(n)?.value).find(Boolean);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    url = new URL(`/api/v1${path}`, process.env.NEXT_PUBLIC_API_URL).toString();
  } else {
    url = `/api/proxy${path}`;
  }

  const res = await fetch(url, { ...init, headers });
  if (res.status === 204) return undefined as T;

  const json = (await res.json()) as ApiResponse<T>;
  if (json.error) {
    const message = Array.isArray(json.error.message) ? json.error.message.join(", ") : json.error.message;
    throw new ApiClientError(res.status, message);
  }
  return json.data as T;
}
```

### 2. TanStack Query (FR-001)

`apps/web/src/components/providers/query-provider.tsx` (`"use client"`):
```tsx
"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```
Envolve `{children}` em `apps/web/src/app/layout.tsx` (pode ficar dentro do `ThemeProvider` existente, sem alterar atributos de `<html>`/fontes).

### 3. DTOs compartilhados (FR-003)

Replicar em `packages/types/src/index.ts` como **interfaces simples** (sem decorators `class-validator`), espelhando os DTOs de resposta da API após `fromEntity`/serialização (datas como `string` ISO):

```ts
export interface UserMeDto {
  id: string; email: string; name: string;
  avatarUrl: string | null; bio: string | null; age: number | null;
  goals: string[]; isTrainer: boolean; plan: "FREE" | "PRO";
  hasOnboarded: boolean; createdAt: string;
}
export interface UpdateUserMeDto {
  name?: string; avatarUrl?: string | null; bio?: string | null;
  age?: number | null; goals?: string[]; hasOnboarded?: boolean;
}

export interface MuscleGroupDto { id: string; name: string; slug: string }
export interface EquipmentDto { id: string; name: string; slug: string }

export interface ExerciseDto {
  id: string; name: string; description: string | null;
  imageUrl: string | null; videoUrl: string | null;
  category: "STRENGTH" | "CARDIO" | "FLEXIBILITY" | "BALANCE";
  isArchived: boolean; tenantId: string | null;
  muscleGroups: Array<MuscleGroupDto & { isPrimary: boolean }>;
  equipment: EquipmentDto[];
  createdAt: string; updatedAt: string;
}

export interface PlannedSetDto { id: string; setNumber: number; targetReps: string; targetKg: string | null }
export interface WorkoutExerciseDto {
  id: string; exerciseId: string; order: number; restSeconds: number;
  notes: string | null; plannedSets: PlannedSetDto[];
}
export interface WorkoutSummaryDto { id: string; name: string; order: number }
export interface WorkoutDetailDto {
  id: string; strategyId: string; name: string; description: string | null;
  order: number; exercises: WorkoutExerciseDto[]; createdAt: string; updatedAt: string;
}
export interface CreatePlannedSetDto { setNumber: number; targetReps: string; targetKg?: string }
export interface CreateWorkoutExerciseDto {
  exerciseId: string; order: number; restSeconds?: number; notes?: string;
  plannedSets: CreatePlannedSetDto[];
}
export interface CreateWorkoutDto {
  strategyId: string; name: string; description?: string; order: number;
  exercises: CreateWorkoutExerciseDto[]; // pode ser [] (Tarefa 2)
}

export interface StrategySummaryDto {
  id: string; name: string; type: string | null; description: string | null;
  isActive: boolean; workouts: WorkoutSummaryDto[]; createdAt: string; updatedAt: string;
}
export interface StrategyDetailDto extends Omit<StrategySummaryDto, "workouts"> {
  workouts: WorkoutDetailDto[];
}
export interface CreateStrategyDto { name: string; type?: string; description?: string }
export interface UpdateStrategyDto { name?: string; type?: string; description?: string; isActive?: boolean }

// Novos (Tarefas 3 e 4)
export interface DashboardSummaryDto { /* ver Contratos de API */ }
export interface ActiveWorkoutDto { /* ver Contratos de API */ }
```

### 4. `GET /strategies/active-workout` — algoritmo de rotação (FR-005)

```ts
const strategy = await strategiesRepo.findActiveByTenant(tenantId); // workouts já ordenados por `order` asc
if (!strategy || strategy.workouts.length === 0) return null;

const total = await workoutSessionsRepo.countFinishedByStrategy(strategy.id, tenantId);
const idx = total % strategy.workouts.length;
const today = strategy.workouts[idx];

const exercicios = await Promise.all(
  today.exercises.map(async (we) => (await exercisesRepo.findById(we.exerciseId))?.name ?? "Exercício"),
);

const proximos = strategy.workouts.length > 1
  ? [1, 2].map((offset) => strategy.workouts[(idx + offset) % strategy.workouts.length])
      .map((w) => ({ id: w.id, nome: w.name, numExercicios: w.exercises.length, order: w.order }))
  : [];

return { estrategiaNome: strategy.name, workout: { id: today.id, nome: today.name, exercicios, order: today.order }, proximos };
```

Edge cases: sem Strategy `isActive` ou Strategy ativa sem `workouts` → `null` (200). Strategy com 1 único Workout → `proximos: []` (não há outro workout para "rotacionar").

### 5. `GET /workout-sessions/summary` — algoritmo de agregação (FR-004/FR-007)

Busca uma única vez `findFinishedSince(tenantId, startOfMonth(now, -1))` — cobre mês atual + mês anterior **e** a semana corrente (mesmo que ela cruze a virada de mês), e processa tudo em memória (volume baixo: app pessoal, retenção 60 dias no FREE).

```ts
const WEEKDAY_LABELS = ["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"] as const;

function startOfWeekMonday(d: Date): Date {
  const date = new Date(d); date.setHours(0,0,0,0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7)); // getDay: 0=Dom..6=Sáb -> 0=Seg..6=Dom
  return date;
}
function startOfMonth(d: Date, offset = 0): Date {
  return new Date(d.getFullYear(), d.getMonth() + offset, 1);
}
function dateKey(d: Date): string { return d.toISOString().slice(0, 10); }

const now = new Date();
const weekStart = startOfWeekMonday(now);
const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7); // exclusivo
const monthStart = startOfMonth(now);
const prevMonthStart = startOfMonth(now, -1);

const sessions = await workoutSessionsRepo.findFinishedSince(tenantId, prevMonthStart);

const volumeData = WEEKDAY_LABELS.map((dia) => ({ dia, volume: 0 }));
const trainDatesSet = new Set<number>();
const weekDaysSet = new Set<string>();
let treinosNoMes = 0, treinosMesAnterior = 0, volumeSemanal = 0;
const muscleSetCounts = new Map<string, number>();
let totalSets = 0;
const exerciseCache = new Map<string, Exercise | null>();

for (const session of sessions) {
  const started = session.startedAt;
  const inMonth = started >= monthStart;
  const inWeek = started >= weekStart && started < weekEnd;

  if (inMonth) { treinosNoMes++; trainDatesSet.add(started.getDate()); }
  else treinosMesAnterior++;

  if (inWeek) {
    weekDaysSet.add(dateKey(started));
    const dayIdx = (started.getDay() + 6) % 7;
    for (const ex of session.exercises) {
      for (const set of ex.executedSets) {
        const setVolume = (set.kg ?? 0) * (set.reps ?? 0);
        volumeData[dayIdx].volume += setVolume;
        volumeSemanal += setVolume;

        totalSets++;
        if (!exerciseCache.has(ex.exerciseId)) {
          exerciseCache.set(ex.exerciseId, await exercisesRepo.findById(ex.exerciseId));
        }
        const exercise = exerciseCache.get(ex.exerciseId);
        for (const mg of exercise?.muscleGroups.filter((m) => m.isPrimary) ?? []) {
          muscleSetCounts.set(mg.muscleGroup.name, (muscleSetCounts.get(mg.muscleGroup.name) ?? 0) + 1);
        }
      }
    }
  }
}

// streak: dias consecutivos terminando hoje (ou ontem, se hoje ainda sem sessão)
const trainedDays = new Set(sessions.map((s) => dateKey(s.startedAt)));
let diasSequencia = 0;
const cursor = new Date(now); cursor.setHours(0,0,0,0);
if (!trainedDays.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
while (trainedDays.has(dateKey(cursor))) { diasSequencia++; cursor.setDate(cursor.getDate() - 1); }

const muscleGroups = [...muscleSetCounts.entries()]
  .map(([nome, count]) => ({ nome, percentual: totalSets ? Math.round((count / totalSets) * 100) : 0 }))
  .sort((a, b) => b.percentual - a.percentual);

return {
  diasEstaSemana: weekDaysSet.size,
  treinosNoMes,
  treinosNoMesDelta: treinosNoMes - treinosMesAnterior,
  diasSequencia,
  volumeSemanal,
  volumeData,
  muscleGroups,
  trainDates: [...trainDatesSet].sort((a, b) => a - b),
  workoutsCount: await workoutsRepo.countByTenant(tenantId),
};
```

Notas sobre o algoritmo:
- `muscleGroups[].percentual` é relativo ao total de `executedSets` da semana e **pode somar >100%** se um exercício tiver múltiplos grupos musculares primários — é uma distribuição por grupo, não uma partição.
- `diasSequencia` considera apenas sessões dentro de `[prevMonthStart, now]`; um streak real mais longo seria subestimado — aceitável dado a retenção de 60 dias do plano FREE (`prevMonthStart` está sempre entre 28 e 62 dias atrás).
- Datas calculadas com `Date` nativo (timezone do processo Node — mesma convenção já usada pelo restante de `apps/api`).

### 6. Cor determinística de "programa" (FR-021/FR-022)

`apps/web/src/lib/utils/program-color.ts`:
```ts
const PALETTE = ["#0D3B6E", "#6D28D9", "#7C3AED", "#0F766E", "#B45309", "#BE185D", "#1D4ED8", "#15803D"];

export function programColor(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
```
`StrategySummaryDto`/`StrategyDetailDto` não têm `image`. Onde os componentes hoje usam `<Image src={program.image}>` (`ProgramCard`, `ProgramHeader`, `WorkoutCard`), passar a renderizar uma `<div style={{ backgroundColor: programColor(id) }}>` quando não há imagem real — ajuste pontual de cada componente na Tarefa 9 (sem introduzir prop `image` obrigatória nova).

### 7. NextAuth `session.update()` + middleware (FR-018/019/020)

`apps/web/src/lib/auth.ts` — callback `jwt` ganha tratamento de `trigger`/`session` (mantém o bloco `if (user)` existente):
```ts
async jwt({ token, user, trigger, session }) {
  if (user) {
    (token as any).id = user.id;
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { hasOnboarded: true } });
    (token as any).hasOnboarded = dbUser?.hasOnboarded ?? false;
  }
  if (trigger === "update" && session?.hasOnboarded !== undefined) {
    (token as any).hasOnboarded = session.hasOnboarded;
  }
  return token;
},
```
Frontend (Tarefa 6), após `PATCH /users/me {hasOnboarded:true}` ter sucesso: `await update({ hasOnboarded: true })` (de `useSession()`), **antes** de `router.push("/dashboard")`.

`apps/web/src/middleware.ts` — após o check existente `if (!session?.user) return NextResponse.redirect(.../login)`:
```ts
const hasOnboarded = (session.user as any).hasOnboarded ?? false;
if (!hasOnboarded && pathname !== "/onboarding") {
  return NextResponse.redirect(new URL("/onboarding", req.url));
}
if (hasOnboarded && pathname === "/onboarding") {
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
```

### 8. Onboarding — presets de split e objetivos (FR-014)

`apps/web/src/lib/onboarding/split-presets.ts`:
```ts
export const SPLIT_PRESETS = {
  ABC: ["Treino A", "Treino B", "Treino C"],
  "Upper/Lower": ["Upper A", "Lower A", "Upper B", "Lower B"],
  PPL: ["Push", "Pull", "Legs"],
  "Full Body": ["Full Body A", "Full Body B", "Full Body C"],
} as const;
export type SplitType = keyof typeof SPLIT_PRESETS;

export const GOAL_OPTIONS = ["Hipertrofia", "Emagrecimento", "Performance", "Saúde/Condicionamento"] as const;
```

### 9. Componentes UI faltantes para "Mais opções" (FR-023)

`/program/[id]` precisa de um menu de ações e um diálogo de confirmação de exclusão. Não existem `DropdownMenu`/`AlertDialog` em `apps/web/src/components/ui/`. Adicionar `@radix-ui/react-dropdown-menu` e `@radix-ui/react-alert-dialog` a `apps/web/package.json` e criar `dropdown-menu.tsx`/`alert-dialog.tsx` seguindo o padrão shadcn/ui já usado em `apps/web/src/components/ui/sheet.tsx` (primitivos Radix + `cn()`).

---

## Contratos de API (novos/alterados)

> Prefixo `/api/v1`, `Authorization: Bearer <token>`, formato `{data,error}` (sem mudanças nas convenções já estabelecidas em `2026-06-10-api-rest-core.md`).

### Identity

| Método | Path | Body | Resposta | Erros |
|---|---|---|---|---|
| PATCH | `/users/me` | `UpdateUserMeDto` (+ `hasOnboarded?: boolean`) | `200 UserMeDto` | `400`, `401` |

### Training — Strategy

| Método | Path | Resposta | Erros |
|---|---|---|---|
| GET | `/strategies/active-workout` **(novo, registrado antes de `/strategies/:id`)** | `200 ActiveWorkoutDto \| null` | `401` |

```ts
interface ActiveWorkoutDto {
  estrategiaNome: string;
  workout: { id: string; nome: string; exercicios: string[]; order: number };
  proximos: Array<{ id: string; nome: string; numExercicios: number; order: number }>;
}
```

### Training — Workout

| Método | Path | Body | Resposta | Erros |
|---|---|---|---|---|
| POST | `/workouts` | `CreateWorkoutDto` (`exercises` agora aceita `[]`) | `201 WorkoutDetailDto` | `400`, `401`, `404`, `422 PLAN_LIMIT_EXCEEDED` |

### Training — WorkoutSession

| Método | Path | Resposta | Erros |
|---|---|---|---|
| GET | `/workout-sessions/summary` **(novo, registrado antes de `/workout-sessions/:id`)** | `200 DashboardSummaryDto` | `401` |

```ts
interface DashboardSummaryDto {
  diasEstaSemana: number;
  treinosNoMes: number;
  treinosNoMesDelta: number;
  diasSequencia: number;
  volumeSemanal: number;
  volumeData: Array<{ dia: "Seg"|"Ter"|"Qua"|"Qui"|"Sex"|"Sáb"|"Dom"; volume: number }>; // sempre 7 itens
  muscleGroups: Array<{ nome: string; percentual: number }>;
  trainDates: number[]; // 1-31
  workoutsCount: number;
}
```

### Frontend — proxy + cliente

| Rota | Descrição |
|---|---|
| `ALL /api/proxy/[...path]` | Route handler same-origin, repassa para `${NEXT_PUBLIC_API_URL}/api/v1/[...path]` com `Authorization: Bearer <cookie de sessão>` |
| `apiFetch<T>(path, init?): Promise<T>` | `apps/web/src/lib/api/client.ts` — server: chama API direto; client: chama `/api/proxy`. Lança `ApiClientError {status, message}` se `error !== null` |

---

## Ordem de Execução

```
Fase 1 (paralelo, sem dependências):
  T1 (fix: hasOnboarded em /users/me)
  T2 (fix: CreateWorkoutDto.exercises aceita [])
  T3 (feature: GET /workout-sessions/summary)
  T4 (feature: GET /strategies/active-workout)
  T5 (chore: TanStack Query + apiFetch + proxy + DTOs compartilhados)

Fase 2 (paralelo, após T5):
  T8 (Exercícios/Catálogo — depende só de T5)
  T9 (/library + /program/[id] — depende só de T5)

Fase 3 (após T1 + T2 + T5):
  T6 (Onboarding wizard + sessão + middleware)

Fase 4 (após T3 + T4 + T5):
  T7 (Dashboard real)
```

---

## Tarefas

---

### Tarefa 1: Backend — `hasOnboarded` em `/users/me`
Tipo: fix
Agente: backend

`PATCH /users/me` precisa aceitar `hasOnboarded: boolean` para o onboarding (FR-015/016) marcar a conclusão do wizard.

**Arquivos a modificar:**
- `apps/api/src/identity/domain/repositories/users.repository.interface.ts` — adicionar `hasOnboarded: boolean` ao `Partial<{...}>` de `update(...)`.
- `apps/api/src/identity/application/dto/update-user-me.dto.ts` — adicionar:
  ```ts
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasOnboarded?: boolean;
  ```
- `apps/api/src/identity/application/use-cases/update-me.use-case.ts` — adicionar ao objeto retornado por `update(...)`:
  ```ts
  ...(dto.hasOnboarded !== undefined && { hasOnboarded: dto.hasOnboarded }),
  ```

Critérios de Aceite:
- [x] `PATCH /users/me {"hasOnboarded": true}` → `200`, `UserMeDto.hasOnboarded === true`, persistido no banco.
- [x] `PATCH /users/me` sem `hasOnboarded` não altera o valor existente.
- [x] Teste unitário de `UpdateMeUseCase` cobrindo o novo campo (`IUsersRepository` mockado).

✅ **TASK01 CONCLUÍDO** — Implementação verificada em 2026-06-11, todos os testes passam.

Notas: `User.hasOnboarded` já existe no schema Prisma — sem migration. `PrismaUsersRepository.update` já faz `data as Prisma.UserUpdateInput` (sem mapeamento campo a campo) — nenhuma mudança necessária no repositório Prisma. Pré-requisito de Tarefa 6.

---

### Tarefa 2: Backend — permitir `Workout` sem exercícios na criação
Tipo: fix
Agente: backend

Relaxar `CreateWorkoutDto.exercises` para aceitar `[]`, suportando Workouts "vazios" criados no onboarding (FR-017).

**Arquivos a modificar:**
- `apps/api/src/training/application/dto/workout.dto.ts` — em `CreateWorkoutDto`, remover `@ArrayMinSize(1)` da propriedade `exercises` (mantém `@IsArray() @ValidateNested({ each: true }) @Type(() => CreateWorkoutExerciseDto) exercises!: CreateWorkoutExerciseDto[]`).

Critérios de Aceite:
- [x] `POST /workouts {strategyId, name, order, exercises: []}` → `201`, `WorkoutDetailDto.exercises === []`.
- [x] `GET /workouts/:id` do workout criado retorna `exercises: []` sem erro.
- [x] Teste unitário de `CreateWorkoutUseCase` cobrindo `exercises: []` (loop de `validateExerciseIds`/criação aninhada com array vazio é no-op).

✅ **TASK02 CONCLUÍDO** — Implementação verificada em 2026-06-11, todos os testes passam.

Notas: `UpdateWorkoutDto.exercises` mantém `@ArrayMinSize(1)` — fora do escopo (FR-017 é específico de `CreateWorkoutDto`, e o onboarding só usa `POST /workouts`). `PrismaWorkoutsRepository.create`/`CreateWorkoutUseCase` já lidam com `exercises: []` sem mudança adicional. Pré-requisito de Tarefa 6.

---

### Tarefa 3: Backend — `GET /workout-sessions/summary` (Dashboard)
Tipo: feature
Agente: backend

Endpoint agregado para o Dashboard (FR-004, FR-007). Algoritmo completo na **Decisão 5**.

**Repositório — `apps/api/src/training/domain/repositories/workout-sessions.repository.interface.ts` (adicionar):**
```ts
/** Sessões FINISHED do tenant com startedAt >= since, com exercises/executedSets, orderBy startedAt asc. */
findFinishedSince(tenantId: string, since: Date): Promise<WorkoutSession[]>;
```

**Implementação — `apps/api/src/training/infra/repositories/prisma-workout-sessions.repository.ts`:**
```ts
async findFinishedSince(tenantId: string, since: Date): Promise<WorkoutSession[]> {
  const rows = await prisma.workoutSession.findMany({
    where: { tenantId, status: "FINISHED", startedAt: { gte: since } },
    include: SESSION_INCLUDE,
    orderBy: [{ startedAt: "asc" }],
  });
  return rows.map((r) => this.toDomain(r));
}
```

**Arquivos a criar:**
- `apps/api/src/training/application/dto/dashboard-summary.dto.ts` — `DashboardSummaryDto` (ver Contratos de API), com `@ApiProperty` em cada campo.
- `apps/api/src/training/application/use-cases/get-dashboard-summary.use-case.ts` — `execute(tenantId): Promise<DashboardSummaryDto>`, implementa o algoritmo da Decisão 5. Injeta `WORKOUT_SESSIONS_REPOSITORY`, `WORKOUTS_REPOSITORY` (para `countByTenant`) e `EXERCISES_REPOSITORY` (de `CatalogModule`, para resolver `muscleGroups` por `exerciseId`, com cache em `Map`).
- `apps/api/src/training/application/use-cases/__tests__/get-dashboard-summary.use-case.spec.ts` — unit tests (repos mockados): sem sessões → tudo zerado; streak contínuo vs. com gap; `volumeData` distribuído por dia da semana; `muscleGroups` com exercício de 1 e de 2 grupos primários; `treinosNoMesDelta` com sessões em mês atual e anterior.

**Arquivos a modificar:**
- `apps/api/src/training/presentation/workout-sessions.controller.ts` — adicionar, **entre** `@Get()` (list) e `@Get(":id")`:
  ```ts
  @Get("summary")
  @ApiOkResponse({ type: DashboardSummaryDto })
  async getSummary(@CurrentUser() user: AuthenticatedUser): Promise<DashboardSummaryDto> {
    return this._getDashboardSummary.execute(user.id);
  }
  ```
  Injetar `GetDashboardSummaryUseCase` no construtor.
- `apps/api/src/training/training.module.ts` — registrar `GetDashboardSummaryUseCase` (já tem `CatalogModule` importado para `EXERCISES_REPOSITORY`).
- `apps/api/test/workout-sessions.e2e-spec.ts` — casos de `GET /workout-sessions/summary`.

Critérios de Aceite:
- [x] Sem sessões → todos os campos numéricos `0`; `volumeData` com 7 entradas `volume:0`; `muscleGroups: []`; `trainDates: []`; `workoutsCount` reflete Workouts existentes do tenant.
- [x] Sessão `FINISHED` hoje com `executedSets` (kg/reps) → contabiliza em `diasEstaSemana`, `volumeSemanal`, `volumeData[diaDaSemana].volume`, `trainDates`, `muscleGroups`.
- [x] Sessões `FINISHED` em 3 dias consecutivos terminando hoje → `diasSequencia === 3`; gap de 1 dia quebra o streak.
- [x] Sessões `FINISHED` no mês atual e no mês anterior → `treinosNoMesDelta = treinosNoMes - <count mês anterior>`.
- [x] `GET /workout-sessions/summary` **não** é capturado pelo handler `GET /workout-sessions/:id` (registrado antes).
- [x] Sem token → `401`.
- [x] Testes unitários do use case + Supertest.

✅ **TASK03 CONCLUÍDO** — Implementação verificada em 2026-06-11 (8 testes unitários + 3 testes e2e passam). Algoritmo completo de agregação de sessões implementado.

Notas: pode rodar em paralelo com Tarefas 1, 2, 4, 5.

---

### Tarefa 4: Backend — `GET /strategies/active-workout` ("treino de hoje")
Tipo: feature
Agente: backend

Endpoint do "treino de hoje" + "próximos treinos" da Strategy ativa (FR-005). Algoritmo completo na **Decisão 4**.

**Repositório — `apps/api/src/training/domain/repositories/workout-sessions.repository.interface.ts` (adicionar):**
```ts
/** Total de sessões FINISHED cujo Workout pertence a strategyId, no tenant. */
countFinishedByStrategy(strategyId: string, tenantId: string): Promise<number>;
```

**Implementação — `apps/api/src/training/infra/repositories/prisma-workout-sessions.repository.ts`:**
```ts
async countFinishedByStrategy(strategyId: string, tenantId: string): Promise<number> {
  return prisma.workoutSession.count({
    where: { tenantId, status: "FINISHED", workout: { strategyId } },
  });
}
```

**Arquivos a criar:**
- `apps/api/src/training/application/dto/active-workout.dto.ts` — `ActiveWorkoutDto` (ver Contratos de API), `@ApiProperty` em cada campo.
- `apps/api/src/training/application/use-cases/get-active-workout.use-case.ts` — `execute(tenantId): Promise<ActiveWorkoutDto | null>`, algoritmo da Decisão 4. Injeta `STRATEGIES_REPOSITORY`, `WORKOUT_SESSIONS_REPOSITORY`, `EXERCISES_REPOSITORY`.
- `apps/api/src/training/application/use-cases/__tests__/get-active-workout.use-case.spec.ts` — unit tests: sem strategy ativa → `null`; strategy ativa sem `workouts` → `null`; rotação para `total = 0,1,2,...,N`; `workouts.length === 1` → `proximos: []`.

**Arquivos a modificar:**
- `apps/api/src/training/presentation/strategies.controller.ts` — adicionar, **antes** de `@Get(":id")`:
  ```ts
  @Get("active-workout")
  @ApiOkResponse({ type: ActiveWorkoutDto })
  async getActiveWorkout(@CurrentUser() user: AuthenticatedUser): Promise<ActiveWorkoutDto | null> {
    return this._getActiveWorkout.execute(user.id);
  }
  ```
  Injetar `GetActiveWorkoutUseCase` no construtor.
- `apps/api/src/training/training.module.ts` — registrar `GetActiveWorkoutUseCase`.
- `apps/api/test/strategies.e2e-spec.ts` — casos de `GET /strategies/active-workout`.

Critérios de Aceite:
- [x] Sem Strategy `isActive=true` → `200`, `data: null`.
- [x] Strategy ativa sem `workouts` → `200`, `data: null`.
- [x] Strategy ativa com 3 workouts (`order` 0,1,2): `0` sessões `FINISHED` → `workout.order === 0`; após 1 sessão `FINISHED` do Workout 0 → `workout.order === 1`.
- [x] Strategy ativa com 1 workout → `proximos: []`.
- [x] `workout.exercicios` contém **nomes** (não ids) dos exercícios.
- [x] `GET /strategies/active-workout` **não** é capturado por `GET /strategies/:id`.
- [x] Sem token → `401`.
- [x] Testes unitários + Supertest.

✅ **TASK04 CONCLUÍDO** — Implementação verificada em 2026-06-11 (6 testes unitários + 4 testes e2e passam). Rotação dinâmica de workouts implementada.

Notas: pode rodar em paralelo com Tarefas 1, 2, 3, 5.

---

### Tarefa 5: Frontend — TanStack Query + cliente API + DTOs compartilhados
Tipo: chore
Agente: frontend

Infra compartilhada por todas as telas (FR-001/002/003). **Bloqueia Tarefas 6, 7, 8, 9.** Arquitetura completa nas Decisões 1-3.

**Arquivos a criar:**
- `apps/web/src/app/api/proxy/[...path]/route.ts` — proxy BFF (código completo na Decisão 1).
- `apps/web/src/lib/api/client.ts` — `apiFetch<T>()` + `ApiClientError` (código completo na Decisão 1).
- `apps/web/src/components/providers/query-provider.tsx` — `QueryProvider` (código completo na Decisão 2).
- `apps/web/src/lib/api/__tests__/client.test.ts` — unit tests de `apiFetch` (mock de `fetch` global): sucesso retorna `data`; `error !== null` lança `ApiClientError` com `status`/`message`; `message` array vira string `join(", ")`; `status === 204` retorna `undefined`.

**Arquivos a modificar:**
- `apps/web/package.json` — adicionar `@tanstack/react-query` `^5.x`.
- `apps/web/src/app/layout.tsx` — envolver `{children}` com `<QueryProvider>` (compatível com `ThemeProvider`/fontes existentes).
- `packages/types/src/index.ts` — adicionar as interfaces da Decisão 3 (`UserMeDto`, `UpdateUserMeDto`, `MuscleGroupDto`, `EquipmentDto`, `ExerciseDto`, `PlannedSetDto`, `WorkoutExerciseDto`, `WorkoutSummaryDto`, `WorkoutDetailDto`, `CreatePlannedSetDto`, `CreateWorkoutExerciseDto`, `CreateWorkoutDto`, `StrategySummaryDto`, `StrategyDetailDto`, `CreateStrategyDto`, `UpdateStrategyDto`, `DashboardSummaryDto`, `ActiveWorkoutDto`).

Critérios de Aceite:
- [x] `apiFetch` em Server Component usa `NEXT_PUBLIC_API_URL` direto + cookie de sessão como `Authorization: Bearer`.
- [x] `apiFetch` em Client Component usa `/api/proxy/...` (mesma origem, sem CORS).
- [x] Proxy sem cookie de sessão → `401 {data:null,error:{code:"UNAUTHORIZED",...}}` sem chamar a API NestJS.
- [x] `<QueryProvider>` ativo em `apps/web/src/app/layout.tsx`; `pnpm --filter web dev` renderiza sem erro de hidratação.
- [x] `pnpm --filter @fitflow/types build` (ou type-check) passa com os novos tipos.
- [x] Testes unitários de `apiFetch`.

✅ **TASK05 CONCLUÍDO** — Infraestrutura TanStack Query + proxy BFF + apiFetch verificada em 2026-06-11. 6 testes unitários passam, tipos compilam, layout integrado.

Notas: pré-requisito de Tarefas 6, 7, 8, 9.

---

### Tarefa 6: Frontend — Onboarding wizard + sessão + middleware
Tipo: feature
Agente: frontend

Substitui `/onboarding` (placeholder) pelo wizard de 3 passos (FR-014/015), `session.update()` (FR-018/019) e gate de `hasOnboarded` no middleware (FR-020). Depende de Tarefas 1, 2, 5.

**Arquivos a criar:**
- `apps/web/src/lib/onboarding/split-presets.ts` — `SPLIT_PRESETS`, `GOAL_OPTIONS` (Decisão 8).
- `apps/web/src/components/onboarding/OnboardingWizard.tsx` — `"use client"`, estado via `useReducer` com 3 passos:
  1. **Perfil**: `name` (default = `session.user.name`, recebido via prop do Server Component pai), `age?: number`, `bio?: string`.
  2. **Objetivo**: multi-select de `GOAL_OPTIONS` → `goals: string[]`.
  3. **Primeiro programa**: seletor de `SplitType` (`SPLIT_PRESETS`) + input de nome do programa (default = nome do split escolhido).
  Navegação Voltar/Avançar; último passo mostra "Concluir" (chama a mutation abaixo).
- `apps/web/src/components/onboarding/{ProfileStep,GoalsStep,SplitStep}.tsx` — um componente por passo, recebem estado + setters via props.
- `apps/web/src/lib/api/hooks/use-complete-onboarding.ts` — `useMutation` que executa, em sequência (FR-015):
  1. `apiFetch("/users/me", { method: "PATCH", body: JSON.stringify({ name, age, bio, goals, hasOnboarded: true }) })`
  2. `apiFetch<StrategySummaryDto>("/strategies", { method: "POST", body: JSON.stringify({ name: programName, type: splitType }) })` → `strategy.id`
  3. `Promise.all` de `apiFetch("/workouts", { method: "POST", body: JSON.stringify({ strategyId, name, order, exercises: [] }) })` para cada nome em `SPLIT_PRESETS[splitType]` (com `order` = índice).
  Erro em qualquer etapa propaga via `onError` (mutation falha; wizard mostra erro e permite retry, sem navegar).

**Arquivos a modificar:**
- `apps/web/src/app/onboarding/page.tsx` — Server Component: `const session = await auth()`, renderiza `<OnboardingWizard userName={session.user.name} />`.
- `apps/web/src/lib/auth.ts` — callback `jwt`: tratar `trigger === "update"` (Decisão 7, código completo).
- `apps/web/src/middleware.ts` — gate de `hasOnboarded` (Decisão 7, código completo), aplicado **após** `if (!session?.user) return NextResponse.redirect(...)`.

Critérios de Aceite:
- [ ] Usuário com `hasOnboarded=false` acessando `/dashboard` (ou outra rota protegida) → redirecionado para `/onboarding`.
- [ ] Usuário com `hasOnboarded=true` acessando `/onboarding` → redirecionado para `/dashboard`.
- [ ] Completar wizard executa `PATCH /users/me {hasOnboarded:true,...}` + `POST /strategies` + N×`POST /workouts`; `GET /strategies` subsequente retorna 1 Strategy com os Workouts do split escolhido, `exercises: []`.
- [ ] Falha em qualquer etapa → wizard exibe erro, permanece em `/onboarding`, permite retry sem duplicar a Strategy já criada com sucesso (documentar comportamento: retry reexecuta a sequência completa — aceitável pois plano FREE permite múltiplas Strategies).
- [ ] Sucesso → `update({hasOnboarded:true})` chamado **antes** de `router.push("/dashboard")`; sem loop de redirect.
- [ ] Testes unitários: shape de `SPLIT_PRESETS`/`GOAL_OPTIONS`; reducer/transições do wizard; callback `jwt` com `trigger==="update"` (mock de `prisma`).

Notas: validar que o workaround TS2742 documentado em `apps/web/src/lib/auth.ts` continua funcionando (`pnpm --filter web type-check`).

---

### Tarefa 7: Frontend — Dashboard real
Tipo: feature
Agente: frontend

Substitui todos os mocks de `/dashboard` por dados reais (FR-006/007/008). Depende de Tarefas 3, 4, 5.

**Arquivos a modificar:**
- `apps/web/src/app/dashboard/page.tsx` — vira Server Component `async`, busca em paralelo (`Promise.all`):
  - `apiFetch<UserMeDto>("/users/me")`
  - `apiFetch<DashboardSummaryDto>("/workout-sessions/summary")`
  - `apiFetch<ActiveWorkoutDto | null>("/strategies/active-workout")`

  Mapeamento para os shapes **atuais** dos componentes (sem alterar props):
  - `DashboardUser`: `{ name, initials: <iniciais de name>, email, plan, planUsed: summary.workoutsCount, planLimit: 6 }`.
  - `DashboardMetrics`: `{ diasEstaSemana, treinosNoMes, treinosNoMesDelta, diasSequencia, volumeSemanal }` ← campos homônimos de `summary`.
  - `VolumeData[]` ← `summary.volumeData` (já `{dia,volume}`).
  - `trainDates: number[]` ← `summary.trainDates`.
  - `MuscleGroup[]` ← `summary.muscleGroups` (já `{nome,percentual}`).
  - `TreinoHoje` / `TreinoCard`: se `activeWorkout === null` → estado vazio (CTA `/onboarding`, ver abaixo); senão `{ estrategia: activeWorkout.estrategiaNome, nome: activeWorkout.workout.nome, exercicios: activeWorkout.workout.exercicios, diaDaSemana: "—", duracao: "—" }` (`diaDaSemana`/`duracao` placeholders — fora de escopo, ver spec).
  - `UpcomingWorkout[]` ← `activeWorkout?.proximos.map((p, i) => ({ dayAbbr: "—", dayNum: i + 1, treino: p.nome, numExercicios: p.numExercicios, hasWorkout: true })) ?? []`.
- `apps/web/src/components/dashboard/TreinoCard.tsx` — adicionar estado vazio (sem Strategy ativa): mensagem + link para `/onboarding` (FR-008).

Critérios de Aceite:
- [ ] `/dashboard` não importa `apps/web/src/lib/mock/dashboard.ts`.
- [ ] `MetricsStrip`, `ProgressChartClient`, `CalendarSection`, `MuscleCard`, `UpcomingCard` renderizam dados de `GET /workout-sessions/summary`.
- [ ] `TreinoCard` renderiza `GET /strategies/active-workout`; se `data === null`, exibe estado vazio com CTA `/onboarding`.
- [ ] `planUsed`/`planLimit` = `workoutsCount`/`6`.
- [ ] Página renderiza sem erro para usuário recém-onboardado (Strategy com Workouts `exercises: []`).

Notas: implementação **sem** `useQuery` — leitura única por request via `apiFetch` direto (Server Component, cookie). TanStack Query (Tarefa 5) fica reservado para a interatividade client-side das Tarefas 8/9. Pode rodar em paralelo com Tarefas 6, 8, 9.

---

### Tarefa 8: Frontend — Exercícios/Catálogo
Tipo: feature
Agente: frontend

Substitui `/exercises` e `/exercises/[id]` por dados reais (FR-009-013). Depende de Tarefa 5.

**Arquivos a criar:**
- `apps/web/src/lib/api/hooks/use-exercises.ts` — `useExercises(filters)` → `useInfiniteQuery` sobre `PaginatedResponse<ExerciseDto>` (`getNextPageParam` via `nextCursor`), `queryKey: ["exercises", filters]`.
- `apps/web/src/lib/api/hooks/use-exercise.ts` — `useExercise(id)` → `useQuery(["exercise", id], () => apiFetch<ExerciseDto>(`/exercises/${id}`))`.
- `apps/web/src/lib/api/hooks/use-muscle-groups.ts` / `use-equipment.ts` — `useQuery` para `GET /muscle-groups` / `GET /equipment`, `staleTime: Infinity` (dados de referência).

**Arquivos a modificar:**
- `apps/web/src/components/exercises/ExercisesClientPage.tsx`:
  - Filtro de grupo muscular/equipamento passa a usar `slug` (de `useMuscleGroups`/`useEquipment`) em vez de nomes mockados.
  - Filtro de tipo: "Força" → `category=STRENGTH`, "Cardio" → `category=CARDIO`, "Todos" → omitido.
  - `search` (com `useDebounce`, já existe em `apps/web/src/lib/hooks/useDebounce.ts`) → query param `search`.
  - Substitui lista mockada por `useExercises({search, muscleGroupSlug, equipmentSlug, category})`; concatena `pages[].items` para o `react-window` `FixedSizeList`; "carregar mais"/scroll chama `fetchNextPage()` quando `hasNextPage`.
  - Adapta `ExerciseDto` → shape `Exercise` consumido por `ExerciseCard`/`FilterBar`: `primaryMuscles`/`secondaryMuscles` derivados de `muscleGroups[].isPrimary` (FR-012); `bookmarkCount` → `"—"` fixo (FR-013).
- `apps/web/src/components/exercises/FilterBar.tsx` — opções de `muscle`/`equipment` vêm de `useMuscleGroups()`/`useEquipment()` (estado de loading desabilita os selects).
- `apps/web/src/app/exercises/page.tsx` — vira shell simples (`<ExercisesClientPage />`, sem props de mock).
- `apps/web/src/app/exercises/[id]/page.tsx` + `ExerciseDetail.tsx` — usa `useExercise(params.id)`; `error instanceof ApiClientError && error.status === 404` → `notFound()`. Mesmo mapeamento `isPrimary` do item anterior.

Critérios de Aceite:
- [ ] `/exercises` e `/exercises/[id]` não importam `apps/web/src/lib/mock/exercises.ts`.
- [ ] Filtros de grupo muscular/equipamento usam `slug` real.
- [ ] Filtro "Força"/"Cardio"/"Todos" mapeia para `category=STRENGTH`/`CARDIO`/sem filtro.
- [ ] Busca por nome filtra via `search` (debounced).
- [ ] Lista pagina via `nextCursor` ("carregar mais"/scroll incremental).
- [ ] `/exercises/[id]` com id inexistente → página 404 (Next `notFound()`).
- [ ] `primaryMuscles`/`secondaryMuscles` corretos conforme `isPrimary`.
- [ ] `bookmarkCount` exibido como `"—"`.

Notas: pode rodar em paralelo com Tarefas 6, 7, 9.

---

### Tarefa 9: Frontend — `/library` + `/program/[id]`
Tipo: feature
Agente: frontend

Substitui `/library` (aba "Programas") e cria `/program/[id]/page.tsx` real, com ações de ativar/desativar/excluir (FR-021-026). Depende de Tarefa 5.

**Arquivos a criar:**
- `apps/web/src/lib/utils/program-color.ts` — `programColor(id): string` (Decisão 6).
- `apps/web/src/lib/api/hooks/use-strategies.ts` — `useStrategies()` → `useQuery(["strategies"], () => apiFetch<StrategySummaryDto[]>("/strategies"))`.
- `apps/web/src/lib/api/hooks/use-strategy.ts` — `useStrategy(id)` → `useQuery(["strategy", id], () => apiFetch<StrategyDetailDto>(`/strategies/${id}`))`.
- `apps/web/src/lib/api/hooks/use-update-strategy.ts` / `use-delete-strategy.ts` — `useMutation` para `PATCH`/`DELETE /strategies/:id`, invalidando `["strategies"]` e `["strategy", id]` em sucesso.
- `apps/web/src/components/ui/dropdown-menu.tsx` e `apps/web/src/components/ui/alert-dialog.tsx` — primitivos shadcn/ui sobre Radix, seguindo o padrão de `apps/web/src/components/ui/sheet.tsx` (Decisão 9).
- `apps/web/src/components/library/ProgramOptionsMenu.tsx` — `"use client"`, recebe `strategy: StrategyDetailDto`. `DropdownMenu` com itens "Ativar"/"Desativar" (`useUpdateStrategy`, label conforme `strategy.isActive`) e "Excluir" (abre `AlertDialog` de confirmação; em sucesso de `useDeleteStrategy`, `router.push("/library")`).

**Arquivos a modificar:**
- `apps/web/package.json` — adicionar `@radix-ui/react-dropdown-menu`, `@radix-ui/react-alert-dialog`.
- `apps/web/src/components/library/LibraryListPage.tsx` — aba "Programas" usa `useStrategies()`; mapeia `StrategySummaryDto` → `LibraryProgram`: `{ id, name, color: programColor(id), routinesCount: workouts.length }` (sem `image`); remove o item `isFavorites` ("Favoritos") do array renderizado; estado de loading exibe skeleton/placeholder nos cards.
- `apps/web/src/app/program/[id]/page.tsx` — Server Component `async`: `apiFetch<StrategyDetailDto>(`/strategies/${id}`)`; em erro `ApiClientError` com `status === 404` → `notFound()`. Mapeia para `TrainingProgram`: `{ id, name, tags: [`${workouts.length} treinos`, type ?? "Personalizado"], workouts: workouts.map(w => ({ id: w.id, name: w.name, exercises: w.exercises.length })) }` — `image`/cor resolvidos via `programColor(id)` nos componentes (Decisão 6, sem campo `image` no DTO).
- `apps/web/src/components/library/ProgramHeader.tsx` — recebe também `strategy: StrategyDetailDto` (além de `program`); renderiza `<ProgramOptionsMenu strategy={strategy} />` no botão "Mais opções"; onde usa `program.image`, renderiza `<div style={{backgroundColor: programColor(strategy.id)}}>` (Decisão 6).
- `apps/web/src/components/library/WorkoutCard.tsx` / `WorkoutListRow.tsx` — onde usam `workout.image`, mesma substituição por cor determinística; sem mudança nos links `/workout/{id}` (já usam `workout.id` real, FR-024).

Critérios de Aceite:
- [ ] `/library` (aba Programas) não importa `mockLibraryPrograms`; lista `GET /strategies`; sem card "Favoritos".
- [ ] Clicar em um programa abre `/program/[id]` com Workouts reais (`GET /strategies/:id`).
- [ ] `/program/[id]` com id inexistente/de outro tenant → página 404.
- [ ] "Mais opções" → "Ativar"/"Desativar" chama `PATCH /strategies/:id {isActive: !current}`; UI reflete novo estado.
- [ ] "Excluir" abre confirmação; ao confirmar, `DELETE /strategies/:id` + redirect para `/library`.
- [ ] `WorkoutCard`/`WorkoutListRow` linkam `/workout/[id]` com id real.
- [ ] "Criar novo programa"/"Criar nova rotina" permanecem não funcionais (FR-026, sem mudança).

Notas: pode rodar em paralelo com Tarefas 6, 7, 8.

---

<!-- Plano gerado a partir de docs/specs/2026-06-11-fase2-integracao-frontend-backend.md (Status: approved) -->
