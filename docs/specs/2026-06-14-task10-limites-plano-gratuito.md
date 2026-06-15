# Spec & Plan: TASK10 — Limites do plano gratuito

**Status:** approved
**Data:** 2026-06-14
**Autor:** Claude (Planner)

---

## 1. Problema e Visão Geral

O backend (`CreateWorkoutUseCase`, TASK03) já aplica um limite fixo de **6 treinos por tenant** (`FREE_PLAN_WORKOUT_LIMIT = 6`), retornando `422 PLAN_LIMIT_EXCEEDED` ao tentar criar o 7º. Porém esse limite é aplicado **incondicionalmente a qualquer plano** — inclusive `PRO`, que segundo `User.isFreePlan()`/`Plan` (já existentes em `apps/api/src/identity/domain/`) não deveria ter limite. Esse é um bug de regra de negócio.

No frontend, TASK09 (T5) já trata esse erro 422 **reativamente**: o usuário só descobre o limite depois de preencher todo o formulário e tentar salvar. A própria spec da TASK09 registrou isso como fora de escopo: *"Banner/UX proativa de limite do plano free (TASK10) — esta spec só trata o erro 422 já lançado pelo CreateWorkoutUseCase"*.

TASK10 corrige a regra de negócio (limite só para FREE) e adiciona feedback proativo no frontend: contador "X/6 treinos" e bloqueio da ação "Adicionar treino" **antes** de abrir o formulário, quando o limite já foi atingido.

---

## 2. Cenários de Usuário

- **P1 (crítico):** Como usuário do plano FREE que já tem 6 treinos cadastrados, ao acessar `/program/[id]/workout/novo`, vejo uma mensagem de limite atingido em vez do formulário — não preencho nada para descobrir depois que não pode salvar.
- **P1 (crítico):** Como usuário do plano FREE, na página `/program/[id]` vejo quantos treinos já usei do limite (ex: "4/6 treinos"), para entender minha margem antes de planejar mais um.
- **P2 (importante):** Como usuário do plano PRO, crio quantos treinos eu quiser — nenhum contador ou bloqueio aparece, e o backend nunca retorna `PLAN_LIMIT_EXCEEDED` para mim.
- **P3 (nice-to-have):** A mensagem de limite atingido menciona o plano gratuito, mas não precisa linkar para um fluxo de upgrade real (não existe ainda).

> P1 = sem isso o produto não funciona. P2 = valor claro mas contornável. P3 = melhoria futura.

---

## 3. Requisitos Funcionais

- **FR-001:** `CreateWorkoutUseCase` só aplica `FREE_PLAN_WORKOUT_LIMIT` (6) quando `user.isFreePlan()` é `true`. Usuários `PRO` podem criar treinos sem limite (sem checar `countByTenant`).
- **FR-002:** Novo endpoint `GET /workouts/limit` retorna `{ count, limit, plan }`:
  - `plan: "FREE"` → `limit: 6`
  - `plan: "PRO"` → `limit: null` (sem limite)
  - `count` = total de workouts do tenant (todas as estratégias), via `countByTenant` existente.
- **FR-003:** `@fitflow/types` exporta `WorkoutsLimitDto { count: number; limit: number | null; plan: "FREE" | "PRO" }`. Novo hook `useWorkoutsLimit()` (`apps/web/src/lib/api/hooks/use-workouts-limit.ts`) consome `GET /workouts/limit` via React Query (`queryKey: ["workouts-limit"]`).
- **FR-004:** Novo componente `WorkoutLimitBadge` (presentational, props `{ count: number; limit: number | null }`): renderiza pill `"{count}/{limit} treinos"` quando `limit !== null`; renderiza `null` quando `limit === null` (plano PRO).
- **FR-005:** Em `/program/[id]` (Server Component): busca `GET /workouts/limit` via `apiFetch` junto de `GET /strategies/:id`. Renderiza `WorkoutLimitBadge` ao lado do título "Treinos" quando `limit !== null`. Quando `count >= limit`, o botão "Adicionar treino" é substituído por um estado desabilitado com mensagem "Limite de {limit} treinos do plano gratuito atingido" (sem link de upgrade).
- **FR-006:** Em `/program/[id]/workout/novo` (Client Component, TASK09 T5): usa `useWorkoutsLimit()`. Enquanto carrega, mantém o skeleton existente. Quando `limit !== null && count >= limit`, renderiza mensagem de limite atingido + link "Voltar" para `/program/[id]` **em vez de** `WorkoutBuilder`. Caso contrário, comportamento inalterado (inclui o tratamento reativo de 422 já existente, mantido como fallback de concorrência).

> Cada FR deve ser independente e testável.

---

## 4. Fora do Escopo & Riscos

- **Fora do Escopo:** Fluxo de upgrade/billing real — o badge "Upgrade" estático no sidebar (`nav-content.tsx`) permanece sem destino; a mensagem de limite atingido é apenas informativa.
- **Fora do Escopo:** Limite de "2 programas ativos" / "4 treinos por programa" citado em `docs/context/domains/plans.md` — esse documento está desatualizado em relação à implementação real (6 treinos/tenant total, plano FREE). Esta tarefa corrige apenas a linha sobre limite de treinos nesse arquivo (ver T1); o limite de programas ativos fica para tarefa futura.
- **Fora do Escopo:** Qualquer alteração em `/strategies`, `CreateStrategyUseCase` ou schema Prisma.
- **Premissa:** `Plan` enum (`FREE`/`PRO`), `User.isFreePlan()`, `IUsersRepository.findById(tenantId)` e `IWorkoutsRepository.countByTenant(tenantId)` já existem e funcionam — confirmado em `apps/api/src/identity/domain/user.entity.ts` e reutilizado pelo padrão de `ListWorkoutSessionsUseCase` (retenção 60 dias FREE). `TrainingModule` já importa `IdentityModule` (mesmo padrão).
- **Risco:** Confundir "treinos" (workouts) por tenant com "treinos por programa/estratégia" → Mitigação: `count`/`limit` de `GET /workouts/limit` são **globais do tenant** (todas as estratégias), igual ao `countByTenant` já usado em `CreateWorkoutUseCase`. Frontend não soma por estratégia.
- **Risco:** Nest/Express faz match de rotas por ordem de declaração — `GET /workouts/:id` pode "engolir" `GET /workouts/limit` se declarada depois → Mitigação: declarar `@Get("limit")` **antes** de `@Get(":id")` em `WorkoutsController` (critério de aceite explícito em T1).

---

## 5. Contratos de API

- `GET /workouts/limit` (NOVO)
  - **Auth:** Bearer (igual aos demais endpoints de `/workouts`)
  - **Response 200:** `WorkoutsLimitDto`
    ```json
    { "count": 4, "limit": 6, "plan": "FREE" }
    ```
    ou, para plano PRO:
    ```json
    { "count": 11, "limit": null, "plan": "PRO" }
    ```

- `POST /workouts` (existente, TASK03 — sem mudança de contrato)
  - **Response 422** `PLAN_LIMIT_EXCEEDED`: agora só ocorre quando `plan === "FREE"` **e** `count >= 6` (antes: para qualquer plano).

---

## 6. Plano de Implementação (Tarefas)

### Ordem de Execução & Dependências

| Onda | Tarefas (paralelas) | Pré-requisito |
|------|---------------------|----------------|
| 1    | T1                  | —              |
| 2    | T2                  | T1             |
| 3    | T3                  | T2             |

> Tarefa estritamente sequencial: T2 depende do tipo `WorkoutsLimitDto` exportado e
> buildado em `@fitflow/types` (T1); T3 depende do hook/componente de T2. Sem
> oportunidade real de paralelismo nesta tarefa (feature pequena, cadeia linear).

---

### Tarefa 1: Plan limit enforcement + endpoint de uso
- **Tipo:** fix + feature
- **Agente:** backend
- **Depende de:** — (nenhuma)
- **Paralelizável com:** nenhuma
- **Descrição:**
  1. Extrair `FREE_PLAN_WORKOUT_LIMIT = 6` de `create-workout.use-case.ts` para um módulo compartilhado `apps/api/src/training/application/use-cases/plan-limits.constants.ts` (`export const FREE_PLAN_WORKOUT_LIMIT = 6;`).
  2. Corrigir `CreateWorkoutUseCase` (`apps/api/src/training/application/use-cases/create-workout.use-case.ts`): injetar `@Inject(USERS_REPOSITORY) private readonly _usersRepository: IUsersRepository` (de `../../../identity/domain/repositories/users.repository.interface` / token de `../../../identity/identity.tokens`, mesmo padrão de `ListWorkoutSessionsUseCase`). Buscar `const user = await this._usersRepository.findById(tenantId)`. O bloco `countByTenant`/`PLAN_LIMIT_EXCEEDED` só executa quando `user?.isFreePlan()` é `true`. Usuários `PRO` (ou sem registro — defensivo) seguem sem checagem de limite.
  3. Criar `GetWorkoutsLimitUseCase` em `apps/api/src/training/application/use-cases/get-workouts-limit.use-case.ts`, injetando `WORKOUTS_REPOSITORY` e `USERS_REPOSITORY`. `execute(tenantId)` retorna `{ count: number; limit: number | null; plan: Plan }`:
     - `count = await workoutsRepository.countByTenant(tenantId)`
     - `plan = user?.plan ?? Plan.FREE`
     - `limit = (user?.isFreePlan() ?? true) ? FREE_PLAN_WORKOUT_LIMIT : null`
  4. Criar DTO `WorkoutsLimitDto` em `apps/api/src/training/application/dto/workouts-limit.dto.ts` (classe com `@ApiProperty`, igual padrão de `UserMeDto`) + factory estático `from({ count, limit, plan })`.
  5. Adicionar endpoint em `WorkoutsController` (`apps/api/src/training/presentation/workouts.controller.ts`): `@Get("limit")` retornando `WorkoutsLimitDto`, **declarado antes** do método `get(":id")` (evita route shadowing). Registrar `GetWorkoutsLimitUseCase` nos `providers` de `training.module.ts`.
  6. Adicionar `WorkoutsLimitDto` em `packages/types/src/index.ts`:
     ```ts
     export interface WorkoutsLimitDto {
       count: number;
       limit: number | null;
       plan: "FREE" | "PRO";
     }
     ```
     Rodar `pnpm --filter @fitflow/types build`.
  7. Atualizar `docs/context/domains/plans.md`: a linha "Máximo de **4 treinos por programa**" deve refletir a implementação real: "Máximo de **6 treinos** por usuário (tenant), plano gratuito — sem limite no plano PRO". Não alterar a linha sobre "2 programas ativos" (fora de escopo).
- **Critérios de Aceite:**
  - [ ] `CreateWorkoutUseCase`: usuário `FREE` com 6 treinos → `422 PLAN_LIMIT_EXCEEDED` (comportamento existente preservado).
  - [ ] `CreateWorkoutUseCase`: usuário `PRO` com 6 (ou mais) treinos → cria normalmente, sem erro (teste novo — cobre o bug corrigido).
  - [ ] Testes existentes em `workout.use-cases.spec.ts` atualizados para mockar `usersRepository.findById` (novo 4º construtor arg) retornando usuário `FREE` onde aplicável.
  - [ ] `GET /workouts/limit`: usuário `FREE` com 4 treinos → `{ count: 4, limit: 6, plan: "FREE" }`.
  - [ ] `GET /workouts/limit`: usuário `PRO` → `{ count: <N>, limit: null, plan: "PRO" }`.
  - [ ] Rota `GET /workouts/limit` resolve corretamente (não cai em `GET /workouts/:id` com `id="limit"`).
  - [ ] `WorkoutsLimitDto` exportado de `@fitflow/types`, pacote buildado.
  - [ ] `docs/context/domains/plans.md` atualizado conforme item 7.
  - [ ] Cobertura de `create-workout.use-case.ts` e `get-workouts-limit.use-case.ts` ≥ 90% (use cases, `decisions.md`).
  - [ ] `tsc`/`lint`/`jest` limpos em `@fitflow/api` e `@fitflow/types`.
- **Notas:** `TrainingModule` já importa `IdentityModule` (usado por `ListWorkoutSessionsUseCase` para retenção 60d) — `USERS_REPOSITORY` já está disponível para DI, sem mudança de módulo além de registrar `GetWorkoutsLimitUseCase`.

---

### Tarefa 2: Hook `useWorkoutsLimit` + `WorkoutLimitBadge`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T1
- **Paralelizável com:** nenhuma
- **Descrição:**
  1. Criar `apps/web/src/lib/api/hooks/use-workouts-limit.ts`:
     ```ts
     "use client";
     import { useQuery } from "@tanstack/react-query";
     import { apiFetch } from "../client";
     import type { WorkoutsLimitDto } from "@fitflow/types";

     export function useWorkoutsLimit() {
       return useQuery({
         queryKey: ["workouts-limit"],
         queryFn: () => apiFetch<WorkoutsLimitDto>("/workouts/limit"),
       });
     }
     ```
  2. Criar `apps/web/src/components/library/WorkoutLimitBadge.tsx` (presentational, sem `"use client"` necessário a menos que use hooks — recebe `count`/`limit` como props): props `{ count: number; limit: number | null }`. Se `limit === null`, retorna `null`. Caso contrário, renderiza pill no estilo das já usadas no projeto (`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground border border-border`), texto `"{count}/{limit} treinos"`.
- **Critérios de Aceite:**
  - [ ] `useWorkoutsLimit` segue o padrão de `use-exercise.ts`/`use-workout.ts` (query key array, `apiFetch` tipado).
  - [ ] Teste do hook (`__tests__/use-workouts-limit.test.tsx`, padrão `renderHook` + `QueryClientProvider` + `apiFetch` mockado): cobre resposta FREE (`limit: 6`) e PRO (`limit: null`).
  - [ ] `WorkoutLimitBadge`: testes cobrindo `limit !== null` (renderiza `"4/6 treinos"`) e `limit === null` (não renderiza nada).
  - [ ] Cobertura: hook ≥ 90%, componente ≥ 70% (`decisions.md`).
  - [ ] `tsc`/`lint`/`jest` limpos em `@fitflow/web`.

---

### Tarefa 3: Integração em `/program/[id]` e `/program/[id]/workout/novo`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T2
- **Paralelizável com:** nenhuma
- **Descrição:**
  1. `apps/web/src/app/program/[id]/page.tsx` (Server Component): adicionar `const limitInfo = await apiFetch<WorkoutsLimitDto>("/workouts/limit")` ao lado do fetch de `strategy`. Renderizar `<WorkoutLimitBadge count={limitInfo.count} limit={limitInfo.limit} />` ao lado do título "Treinos" (mesma `<div className="flex items-center justify-between">` do botão "Adicionar treino", introduzida em TASK09 T6). Calcular `atLimit = limitInfo.limit !== null && limitInfo.count >= limitInfo.limit`. Quando `atLimit`, substituir o `<Button asChild>` "Adicionar treino" por um `<Button disabled size="sm">` (mesmo ícone `Plus`) seguido de `<p className="text-xs text-muted-foreground">Limite de {limitInfo.limit} treinos do plano gratuito atingido.</p>` (ou tooltip — decisão de implementação, manter simples). Quando não `atLimit`, manter o `<Link>` para `/program/${strategy.id}/workout/novo` como hoje.
  2. `apps/web/src/app/program/[id]/workout/novo/page.tsx` (Client Component, TASK09 T5): adicionar `const { data: limitInfo, isLoading: limitLoading } = useWorkoutsLimit()`. Manter o skeleton existente enquanto `strategyLoading || limitLoading`. Após carregar, se `limitInfo && limitInfo.limit !== null && limitInfo.count >= limitInfo.limit`, renderizar bloco de "limite atingido" (mensagem + `<Link href={\`/program/${strategyId}\`}>Voltar</Link>`, reaproveitando o header com `ArrowLeft` já existente) **em vez de** `<WorkoutBuilder>`. Caso contrário, fluxo inalterado (incluindo o tratamento de 422 `PLAN_LIMIT_EXCEEDED` reativo do `handleSubmit`, mantido como fallback).
- **Critérios de Aceite:**
  - [ ] `/program/[id]`: com `count < limit` (ou `limit === null`), badge mostra contador (se FREE) e botão "Adicionar treino" funciona como hoje.
  - [ ] `/program/[id]`: com `count >= limit` (FREE), botão "Adicionar treino" vira estado desabilitado com mensagem de limite — não há `<Link>` para `/workout/novo`.
  - [ ] `/program/[id]/workout/novo`: com `count >= limit` (FREE), exibe mensagem de limite + link "Voltar", **não** renderiza `WorkoutBuilder`.
  - [ ] `/program/[id]/workout/novo`: com `count < limit` ou `limit === null` (PRO), renderiza `WorkoutBuilder` normalmente (regressão de TASK09 T5 não introduzida).
  - [ ] Tratamento reativo de 422 (TASK09 T5) preservado e testado (cenário de corrida: limite muda entre o carregamento da página e o submit).
  - [ ] Testes RTL para os 4 cenários acima (2 por página), seguindo padrão dos testes existentes de `program/[id]/workout/novo/__tests__/page.test.tsx`.
  - [ ] Cobertura de componentes ≥ 70% (`decisions.md`).
  - [ ] `tsc`/`lint`/`jest` limpos em `@fitflow/web`.
- **Notas:** Após esta tarefa, atualizar `docs/context/product-backlog.md`: TASK10 `backlog` → `done`, coluna "Spec" preenchida com `docs/specs/2026-06-14-task10-limites-plano-gratuito.md` (mesmo padrão usado para TASK09).

---

<!--
GATE DE APROVAÇÃO
Revise as regras de negócio e as tarefas técnicas.
Se tudo estiver correto, altere o Status acima de "review" para "approved" para liberar os agentes de frontend/backend para iniciar a implementação.
-->
