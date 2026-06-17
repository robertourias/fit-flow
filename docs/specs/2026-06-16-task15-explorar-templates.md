# Spec & Plan: TASK15 — Explorar (Templates)

**Status:** approved
**Data:** 2026-06-16
**Autor:** Claude (Planner)

---

## 1. Problema e Visão Geral

O item "Explorar" da sidebar existe desde a UI estática mas não tem rota nem conteúdo. Usuários novos se deparam com um produto vazio — sem estratégias, sem treinos, sem dados. TASK15 resolve os dois problemas simultâneos: (a) seed do catálogo de exercícios (ainda vazio em dev) e (b) uma biblioteca de templates de programas pré-configurados que o usuário importa para sua conta com um clique.

O modelo `Strategy` receberá dois campos: `isTemplate Boolean` e `tenantId` se tornará nullable — templates globais têm `tenantId = null`. O catálogo (grupos musculares, equipamentos, exercícios compostos) é semeado via `packages/db/prisma/seed.ts`. Quatro programas templates (PPL, Upper/Lower, ABC, Full Body) são semeados como `Strategy { isTemplate: true, tenantId: null }` + seus `Workout`s e `WorkoutExercise`s.

---

## 2. Cenários de Usuário

- **P1 (crítico):** Como usuário novo, quero explorar programas pré-montados e importar um com um clique, para não precisar criar tudo do zero.
- **P1 (crítico):** Como usuário do plano gratuito, quero ser informado se não posso importar um template por causa do limite de treinos, para entender que preciso fazer upgrade ou remover treinos.
- **P2 (importante):** Como usuário, quero ver um resumo de cada template (nome, split, número de treinos, grupos musculares) antes de importar, para escolher o mais adequado ao meu objetivo.
- **P3 (nice-to-have):** Como usuário, quero filtrar templates por tipo de split (PPL, Upper/Lower, etc.), para encontrar o estilo de treino que prefiro.

---

## 3. Requisitos Funcionais

- **FR-001:** `Strategy.tenantId` passa a ser nullable (`String?`) e recebe nova coluna `isTemplate Boolean @default(false)`. Migration: `make_strategy_tenant_nullable_add_is_template`. Queries existentes em `PrismaStrategiesRepository.findByTenant` e `findById` adicionam filtro `isTemplate: false` para não retornar templates para o usuário.
- **FR-002:** Seed (`packages/db/prisma/seed.ts`) popula:
  - 6 grupos musculares: Peito, Costas, Ombros, Bíceps, Tríceps, Pernas.
  - 3 equipamentos: Barra, Halteres, Máquina.
  - ~15 exercícios compostos (Supino Reto, Agachamento, Levantamento Terra, Desenvolvimento com Barra, Remada Curvada, Puxada Frontal, Rosca Direta, Tríceps Testa, Leg Press, Stiff, Afundo, Crucifixo, Elevação Lateral, Barra Fixa, Mergulho).
  - 4 templates: PPL Iniciante (6 treinos), Upper/Lower (4 treinos), ABC Intermediário (3 treinos), Full Body (3 treinos). Cada template é `Strategy { isTemplate: true, tenantId: null }` com seus `Workout`s e `WorkoutExercise`s + `PlannedSet`s referenciando os exercícios do catálogo.
  - Seed é idempotente: usa `upsert` ou `createIfNotExists` (evita duplicatas em re-execuções).
- **FR-003:** `ExploreModule` em `apps/api/src/explore/`. Importa `TrainingModule` (para repositórios) e `IdentityModule` (para plano do usuário). Dois use cases:
  - `ListTemplatesUseCase`: busca `Strategy { isTemplate: true }` com seus `Workout`s e conta de exercises. Responde com `StrategyTemplateDto[]`.
  - `ImportTemplateUseCase`: valida que o template existe; checa limite de treinos do tenant (plan FREE: existingCount + template.workoutsCount ≤ 6, senão lança `ForbiddenException` com mensagem clara); executa transação Prisma que cria cópia de Strategy + Workouts + WorkoutExercises + PlannedSets para `tenantId = user.id, isTemplate = false`; retorna `StrategySummaryDto` (tipo já exportado por `TrainingModule`).
- **FR-004:** `ExploreController` em `apps/api/src/explore/presentation/explore.controller.ts`:
  - `GET /explore/templates` — público (sem guard), retorna `StrategyTemplateDto[]`.
  - `POST /explore/templates/:id/import` — protegido por `JwtAuthGuard`, retorna `StrategySummaryDto` (201).
- **FR-005:** `@fitflow/types` exporta `StrategyTemplateDto` (com campos: `id`, `name`, `type`, `description`, `workoutsCount`, `workoutNames: string[]`, `muscleGroups: string[]`).
- **FR-006:** Navegação — `nav-content.tsx`: `explorar` ganha `href: "/explore"`. `AppShell.tsx`: `getActiveItem` mapeia `/explore` → `"explorar"` (já está no sectionTitles). Novo `apps/web/src/app/explore/layout.tsx`.
- **FR-007:** Hooks em `apps/web/src/lib/api/hooks/`:
  - `useTemplates()` — `useQuery`, `GET /explore/templates`, queryKey `["templates"]`, sem auth (acesso público).
  - `useImportTemplate()` — `useMutation`, `POST /explore/templates/:id/import`, invalida `["strategies"]` e `["workouts-limit"]` on success.
- **FR-008:** `apps/web/src/app/explore/page.tsx` renderiza `ExploreListPage` (`"use client"`). A página:
  - Grid de cards `TemplateCard` (2 col em md+, 1 col mobile): nome, tipo, badge de número de treinos, lista de workout names, grupos musculares.
  - Botão "Importar" em cada card: chama `useImportTemplate()`. Ao sucesso, toast/mensagem de sucesso + link para `/library`.
  - Se erro `403` (plano FREE, limite atingido): mostra banner de upgrade em vez de toast de erro.
  - Estado de loading: skeleton de 4 cards.
  - `useUserMe()` para checar plano no badge "Upgrade necessário" inline no botão (desabilitado + tooltip explicativo).

---

## 4. Fora do Escopo & Riscos

- **Fora do Escopo:** Filtros/busca de templates por tipo, nível ou objetivo (TASK16+).
- **Fora do Escopo:** Templates criados por preparadores (TASK17).
- **Fora do Escopo:** Preview detalhado dos exercícios antes de importar.
- **Premissa:** O catálogo de exercícios precisa ser semeado antes dos templates — incluído em T2.
- **Premissa:** `TrainingModule` exporta `STRATEGIES_REPOSITORY` e `WORKOUTS_REPOSITORY` — já confirmado no código.
- **Risco:** `tenantId` nullable quebra queries existentes que assumem NOT NULL → Mitigação: adicionar `isTemplate: false` explícito no filtro de `findByTenant` / `findById`.
- **Risco:** Re-execução do seed duplica dados → Mitigação: upsert por `name` ou by `slug` único; transação atômica.
- **Risco:** `GET /explore/templates` é público — responde sem auth. O `APP_GUARD` global (`JwtAuthGuard`) bloquearia → Mitigação: decorar o handler com `@Public()` (decorator já existe no projeto ou criar um simples).

---

## 5. Contratos de API

- `GET /explore/templates`
  - **Auth:** Público (`@Public()`)
  - **Response:** `StrategyTemplateDto[]` (200)

- `POST /explore/templates/:id/import`
  - **Auth:** Bearer JWT
  - **Response:** `StrategySummaryDto` (201) | 403 (limite FREE) | 404 (template não existe)

**`StrategyTemplateDto` shape:**
```json
{
  "id": "clx...",
  "name": "PPL — Iniciante",
  "type": "PPL",
  "description": "6 treinos por semana focado em push/pull/legs.",
  "workoutsCount": 6,
  "workoutNames": ["Push A", "Pull A", "Legs A", "Push B", "Pull B", "Legs B"],
  "muscleGroups": ["Peito", "Dorsal", "Ombro", "Bíceps", "Tríceps", "Quadríceps"]
}
```

---

## 6. Plano de Implementação (Tarefas)

### Ordem de Execução & Dependências

| Onda | Tarefas (paralelas) | Agente(s) | Pré-requisito |
|------|---------------------|-----------|---------------|
| 1 | T1, T5 | backend, frontend | — |
| 2 | T2, T4, T6 | backend, backend, frontend | T1 |
| 3 | T7 | frontend | T4, T6 |
| 4 | T8 | ambos | T2, T7 |

```
Onda 1: T1 (schema migration + update repo) | T5 (nav+layout)   ← paralelo
Onda 2: T2 (seed catalog+templates) | T4 (ExploreModule) | T6 (hooks+types)  ← paralelo
Onda 3: T7 (ExploreListPage + TemplateCard)
Onda 4: T8 (testes + fechamento)
```

---

### Tarefa T1: Schema Prisma — tenantId nullable + isTemplate
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** —
- **Paralelizável com:** T5
- **Descrição:**
  - `packages/db/prisma/schema.prisma`:
    - `Strategy.tenantId String?` (nullable)
    - `Strategy.isTemplate Boolean @default(false)`
    - `Strategy.tenant User?` (relação opcional)
    - Index: `@@index([isTemplate])` (além do `@@index([tenantId])` existente)
  - `apps/api/src/training/infra/repositories/prisma-strategies.repository.ts`: adicionar `isTemplate: false` nos filtros de `findByTenant` e `findById` (para não expor templates nas queries do usuário).
  - `apps/api/src/training/domain/strategy.entity.ts`: campo `tenantId` passa a ser `string | null`.
  - Migration: `pnpm --filter @fitflow/db db:migrate:dev --name make_strategy_tenant_nullable_add_is_template` (exige Docker up).
- **Critérios de Aceite:**
  - [x] `packages/db/prisma/schema.prisma` tem `tenantId String?` e `isTemplate Boolean @default(false)` em `Strategy`.
  - [x] Queries de `PrismaStrategiesRepository` filtram `isTemplate: false`.
  - [x] Entidade `Strategy.tenantId` é `string | null`.
  - [x] Migration aplicada; tabela `strategies` tem as colunas novas.

---

### Tarefa T5: Navegação + layout `/explore`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T1
- **Descrição:**
  - `nav-content.tsx`: adicionar `href: "/explore"` ao item `explorar` existente em `mainNavItems`.
  - `AppShell.tsx`: `getActiveItem` já retorna `"explorar"` para pathname `/explore` se o fallback `return "rotina"` for precedido de `if (pathname.startsWith("/explore")) return "explorar"`. Adicionar esse caso.
  - `apps/web/src/app/explore/layout.tsx`: `export default function ExploreLayout({ children }) { return <AppShell>{children}</AppShell>; }`.
- **Critérios de Aceite:**
  - [x] Item "Explorar" na sidebar navega para `/explore` e fica destacado com título "Explorar" no TopHeader.

---

### Tarefa T2: Seed — catálogo + templates
- **Tipo:** chore
- **Agente:** backend
- **Depende de:** T1
- **Paralelizável com:** T4, T6
- **Descrição:**
  - Criar ou atualizar `packages/db/prisma/seed.ts` (registrado em `packages/db/package.json` como `"db:seed": "ts-node prisma/seed.ts"` ou `"prisma": { "seed": "ts-node prisma/seed.ts" }`).
  - O seed usa `prisma.upsert` ou `createMany` com `skipDuplicates` para ser idempotente.
  - Semear grupos musculares (6), equipamentos (3), exercícios (~15) como dados globais (`tenantId = null` nos exercícios já suportados pelo schema existente).
  - Semear 4 estratégias template. Cada uma:
    - `isTemplate: true, tenantId: null`
    - Seus `Workout`s com `tenantId: null`
    - Seus `WorkoutExercise`s com exerciseId dos exercícios semeados
    - `PlannedSet`s com `targetReps` e `targetKg` representativos
  - Templates sugeridos:
    - **PPL Iniciante** (type: `PPL`): Push A (Supino, Desenvolvimento, Tríceps Testa), Pull A (Puxada Frontal, Remada Curvada, Rosca Direta), Legs A (Agachamento, Leg Press, Stiff), Push B, Pull B, Legs B
    - **Upper/Lower** (type: `UPPER_LOWER`): Upper A (Supino, Desenvolvimento, Remada, Rosca), Lower A (Agachamento, Stiff, Afundo, Leg Press), Upper B, Lower B
    - **ABC Intermediário** (type: `ABC`): A — Peito/Tríceps, B — Costas/Bíceps, C — Pernas/Ombros
    - **Full Body Iniciante** (type: `FULL_BODY`): Full A (Supino, Agachamento, Remada Curvada), Full B (Desenvolvimento, Levantamento Terra, Puxada), Full C (variação)
  - Rodar seed: `pnpm --filter @fitflow/db db:seed`.
- **Critérios de Aceite:**
  - [x] `packages/db/prisma/seed.ts` existe e é idempotente (execução dupla não duplica dados).
  - [x] Após `db:seed`: tabelas `muscle_groups`, `equipment`, `exercises` populadas.
  - [x] 4 registros em `strategies` com `isTemplate = true, tenantId = null`.
  - [x] Cada template tem seus `workouts` com `workout_exercises` e `planned_sets`.

---

### Tarefa T4: Backend — ExploreModule
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** T1
- **Paralelizável com:** T2, T6
- **Descrição:**
  - `apps/api/src/explore/explore.tokens.ts` (se necessário — pode reutilizar tokens de TrainingModule).
  - `apps/api/src/explore/application/dto/strategy-template.dto.ts`: `StrategyTemplateDto` com campos descritos no contrato de API. Método `fromPrismaRow(row)`.
  - `apps/api/src/explore/application/use-cases/list-templates.use-case.ts`: injeta `STRATEGIES_REPOSITORY` (de `TrainingModule`); consulta `prisma.strategy.findMany({ where: { isTemplate: true }, include: { workouts: { include: { workoutExercises: { include: { exercise: { include: { exerciseMuscleGroups: { include: { muscleGroup: true } } } } } } } } })`; mapeia para `StrategyTemplateDto`.
    - Alternativamente, como a estrutura é somente leitura, pode usar `prisma` diretamente (sem repositório intermediário) para simplificar.
  - `apps/api/src/explore/application/use-cases/import-template.use-case.ts`: injeta `STRATEGIES_REPOSITORY`, `WORKOUTS_REPOSITORY`, `USERS_REPOSITORY`.
    - Busca template (isTemplate = true, id = ?); lança `NotFoundException` se não encontrar.
    - Conta workouts existentes do tenant; checa limite FREE: `existingCount + templateWorkoutsCount > 6` → `ForbiddenException("Limite de treinos atingido. Faça upgrade para PRO.")`.
    - Transação: cria Strategy (tenantId = user, isTemplate = false, nome = template.nome) → para cada Workout do template, cria Workout (tenantId = user, strategyId = new) → para cada WorkoutExercise, cria com mesmo exerciseId → para cada PlannedSet, cria cópia.
    - Retorna `StrategySummaryDto` (tipo já em `TrainingModule` exports).
  - `apps/api/src/explore/presentation/explore.controller.ts`: `@Controller("explore")`, `@ApiTags("explore")`. `GET /explore/templates` com `@Public()` decorator; `POST /explore/templates/:id/import` com `@JwtAuthGuard()`.
  - `apps/api/src/explore/explore.module.ts`: imports `[TrainingModule, IdentityModule]`; providers `[ListTemplatesUseCase, ImportTemplateUseCase]`; controllers `[ExploreController]`.
  - `apps/api/src/app.module.ts`: adicionar `ExploreModule`.
  - **`@Public()` decorator:** verificar se existe em `apps/api/src/common/auth/`. Se não existir, criar `public.decorator.ts` que define `SetMetadata("isPublic", true)`, e atualizar `JwtAuthGuard` para `if (this.reflector.get("isPublic", context.getHandler())) return true`.
- **Critérios de Aceite:**
  - [x] `GET /explore/templates` retorna `StrategyTemplateDto[]` sem autenticação (200).
  - [x] `POST /explore/templates/:id/import` retorna `StrategySummaryDto` (201) para usuário autenticado.
  - [x] `POST /explore/templates/:id/import` retorna 403 quando FREE user já tem 6 workouts.
  - [x] `POST /explore/templates/:id/import` retorna 404 para template inexistente.
  - [x] `tsc` limpo em `apps/api`.
  - [x] Testes unitários: `ListTemplatesUseCase` retorna lista; `ImportTemplateUseCase` (sucesso, limite FREE, template não encontrado).

---

### Tarefa T6: Frontend — hooks + `@fitflow/types`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T1
- **Paralelizável com:** T2, T4
- **Descrição:**
  - `packages/types/src/index.ts`: adicionar `StrategyTemplateDto` (campos: `id`, `name`, `type: string | null`, `description: string | null`, `workoutsCount: number`, `workoutNames: string[]`, `muscleGroups: string[]`). Rebuild `@fitflow/types`.
  - `apps/web/src/lib/api/hooks/use-templates.ts`: `useTemplates()` via `useQuery`, queryKey `["templates"]`, `GET /explore/templates`, sem credenciais obrigatórias mas funcionando com `apiFetch` existente.
  - `apps/web/src/lib/api/hooks/use-import-template.ts`: `useImportTemplate()` via `useMutation`, `POST /explore/templates/:id/import`, invalida `["strategies"]` e `["workouts-limit"]` on success.
- **Critérios de Aceite:**
  - [x] `StrategyTemplateDto` exportado por `@fitflow/types`; `tsc` limpo em `packages/types`.
  - [x] Testes (jest.mock `apiFetch`): `useTemplates` retorna lista; `useImportTemplate` invoca POST e invalida cache.

---

### Tarefa T7: Frontend — `/explore` page + `ExploreListPage`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T4, T6
- **Paralelizável com:** —
- **Descrição:**
  - `apps/web/src/app/explore/page.tsx`: `"use client"`, renderiza `ExploreListPage`.
  - `apps/web/src/components/explore/ExploreListPage.tsx`: usa `useTemplates()` + `useUserMe()` + `useImportTemplate()`.
    - Loading: grid de 4 skeleton cards.
    - Grid de `TemplateCard` (1 col mobile, 2 col md+).
    - Cada card: nome (heading), badge de tipo (PPL, ABC, etc.), badge de `workoutsCount` treinos, lista de `workoutNames` (max 4 + "e mais X" se >4), chips de `muscleGroups`.
    - Botão "Importar" no card:
      - PRO ou FREE com capacidade: botão primário ativo.
      - FREE sem capacidade (`count >= 6`): botão desabilitado com texto "Limite atingido" + link "Upgrade".
      - Loading state: spinner no botão durante `isPending`.
    - On success: toast/alerta "Programa importado! Veja em [Biblioteca](/library)." (link navegável).
    - On 403: banner de upgrade.
  - `apps/web/src/components/explore/__tests__/ExploreListPage.test.tsx`: testes RTL cobrindo lista populada, skeleton, botão import desabilitado (FREE limit), success state.
- **Critérios de Aceite:**
  - [x] Grid renderiza `TemplateCard` com nome, tipo, treinos e grupos musculares.
  - [x] Botão "Importar" chama `useImportTemplate` e mostra mensagem de sucesso.
  - [x] Usuário FREE com 6 workouts vê botão desabilitado.
  - [x] Loading: 4 skeleton cards.
  - [x] Testes RTL passando.

---

### Tarefa T8: Testes finais + fechamento
- **Tipo:** chore
- **Agente:** ambos
- **Depende de:** T2, T7
- **Paralelizável com:** —
- **Descrição:**
  - `tsc`/lint/jest limpos em `apps/api` e `apps/web`.
  - `docs/context/product-backlog.md`: TASK15 → `done`, coluna Spec preenchida.
- **Critérios de Aceite:**
  - [x] `tsc`/lint/jest limpos em ambos os apps.
  - [x] Backlog atualizado.

---

<!--
GATE DE APROVAÇÃO
Revise as regras de negócio e as tarefas técnicas.
Se tudo estiver correto, altere o Status acima de "review" para "approved" para liberar os agentes de frontend/backend para iniciar a implementação.
-->
