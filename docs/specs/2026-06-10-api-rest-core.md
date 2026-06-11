# Spec: API REST Core — Identity, Catalog, Training (Fase 1)

**Status:** approved
**Data:** 2026-06-10
**Autor:** Claude (Planner)

---

## Problema

`apps/api` (NestJS) tem hoje apenas um health check. As entidades de domínio, repositórios Prisma e módulos de Identity, Catalog e Training já existem (Fase 0), mas não há camada HTTP: nenhum controller, DTO, guard de autenticação, validação, paginação ou Swagger. O frontend (`apps/web`) ainda roda inteiramente sobre mock data.

Sem essa API REST, a Fase 2 (substituir mock data por chamadas reais via TanStack Query) e todas as fases seguintes do roadmap ficam bloqueadas. Esta spec define o contrato funcional da API REST core para os três bounded contexts já modelados: Identity (perfil de usuário), Catalog (exercícios e dados de referência) e Training (estratégias, treinos e sessões de treino).

---

## Cenários de Usuário

- **P1 (crítico):** Como usuário autenticado, quero que toda requisição à API seja validada via JWT da minha sessão NextAuth e meus dados isolados por `tenantId`, para garantir que ninguém acesse ou altere dados de outra conta.
- **P1 (crítico):** Como usuário autenticado, quero ler e editar meu perfil (nome, avatar, bio, idade, objetivos) via API.
- **P1 (crítico):** Como usuário autenticado, quero listar exercícios (globais + meus customizados) com filtros por grupo muscular, equipamento e categoria, para montar meus treinos.
- **P1 (crítico):** Como usuário autenticado, quero criar, editar e remover minhas estratégias, treinos (com exercícios e séries planejadas) e sessões de treino (com séries executadas), via endpoints REST.
- **P2 (importante):** Como usuário, quero criar exercícios customizados (nome, categoria, grupos musculares, equipamentos) para complementar o catálogo global.
- **P2 (importante):** Como usuário do plano FREE, quero que meu histórico de sessões (`GET /workout-sessions`) mostre apenas os últimos 60 dias, e que a criação de um 7º treino seja bloqueada com mensagem clara.
- **P3 (nice-to-have):** Como dev/QA, quero documentação Swagger de todos os endpoints em `/api/v1/docs`, para integrar o frontend e testar manualmente.
- **P3 (nice-to-have):** Como dev, quero paginação cursor-based em listas que crescem sem limite (exercícios, histórico de sessões), para performance.

---

## Requisitos Funcionais

### Cross-cutting (infra da API)

- **FR-001:** Guard global de autenticação valida o JWT da sessão NextAuth (mesmo `AUTH_SECRET`, decode via `jose`) em toda rota sob `/api/v1` exceto `/health`. Sem token válido → `401`. O `id` (sub) do token vira o `tenantId` da requisição, injetado via decorator (`@CurrentUser()`), nunca lido do payload do client.
- **FR-002:** Toda leitura/escrita em entidade com `tenantId` filtra implicitamente pelo `tenantId` do usuário autenticado. Acesso a recurso de outro tenant retorna `404` (nunca `403`, para não revelar existência).
- **FR-003:** Validação de entrada via `class-validator`/`class-transformer` em todos os DTOs. Payload inválido → `400` com lista de erros por campo.
- **FR-004:** Respostas seguem `ApiResponse<T>` (`packages/types`): sucesso `{ data, error: null }`, erro `{ data: null, error: { message, code } }`. Filtro global de exceções converte erros não tratados para `500` nesse formato.
- **FR-005:** Todos os endpoints documentados via `@nestjs/swagger`, expostos em `/api/v1/docs`.
- **FR-006:** Listas paginadas usam cursor (`?cursor=&limit=`) e retornam `PaginatedResponse<T>` (`items`, `total`, `nextCursor`). Aplica-se **somente** a `GET /exercises` e `GET /workout-sessions`. Demais listas (`muscle-groups`, `equipment`, `strategies`) retornam array completo em `data`.

### Identity — User

- **FR-010:** `GET /users/me` retorna o perfil do usuário autenticado: `id, email, name, avatarUrl, bio, age, goals, isTrainer, plan, hasOnboarded, createdAt`.
- **FR-011:** `PATCH /users/me` atualiza `name, avatarUrl, bio (≤300 chars), age, goals`. `isTrainer` e `plan` são somente leitura neste endpoint (alterados por fluxos fora de escopo).
- **FR-012:** `DELETE /users/me` executa soft-delete (`softDelete`, seta `deletedAt`). Usuário soft-deletado não autentica mais (já garantido pelo check existente em `actions.ts`).

### Catalog — Dados de referência

- **FR-020:** `GET /muscle-groups` retorna lista completa (`id, name, slug`), sem paginação.
- **FR-021:** `GET /equipment` retorna lista completa (`id, name, slug`), sem paginação.

### Catalog — Exercise

- **FR-030:** `GET /exercises` retorna exercícios globais (`tenantId = null`) + customizados do tenant, paginados via cursor. Filtros opcionais: `search`, `muscleGroupSlug`, `equipmentSlug`, `category`, `includeArchived` (default `false`).
- **FR-031:** `GET /exercises/:id` retorna o exercício se for global ou do tenant; senão `404`.
- **FR-032:** `POST /exercises` cria exercício customizado (`tenantId` = usuário autenticado): `name, description?, imageUrl?, videoUrl?, category, muscleGroupIds [{id, isPrimary}], equipmentIds[]`.
- **FR-033:** `PATCH /exercises/:id` edita exercício customizado do próprio tenant. `404` se global ou de outro tenant.
- **FR-034:** `DELETE /exercises/:id` arquiva (`isArchived = true`) exercício customizado do próprio tenant. `404` se global ou de outro tenant. Exercícios arquivados somem de `GET /exercises` por padrão (a menos que `includeArchived=true`).

### Training — Strategy

- **FR-040:** `GET /strategies` lista todas as estratégias do tenant (sem paginação), cada uma com resumo dos `workouts` (`id, name, order`), sem `exercises`/`plannedSets` aninhados.
- **FR-041:** `GET /strategies/:id` retorna a estratégia do tenant com `workouts[]` completos, incluindo `exercises[].plannedSets[]`. `404` se não pertencer ao tenant.
- **FR-042:** `POST /strategies` cria estratégia (`name, type?, description?`) para o tenant.
- **FR-043:** `PATCH /strategies/:id` atualiza `name/type/description/isActive`. Marcar `isActive=true` desativa as demais estratégias do tenant (consistente com `findActiveByTenant` retornando no máximo uma ativa).
- **FR-044:** `DELETE /strategies/:id` remove a estratégia e seus `workouts` em cascata (FK `onDelete: Cascade`). `404` se não pertencer ao tenant.

### Training — Workout (com exercises/plannedSets aninhados)

- **FR-050:** `POST /workouts` cria um workout dentro de uma strategy do tenant, payload aninhado:
  `{ strategyId, name, description?, order, exercises: [{ exerciseId, order, restSeconds, notes?, plannedSets: [{ setNumber, targetReps, targetKg? }] }] }`.
- **FR-051:** Antes de criar, valida `countByTenant(tenantId) < 6` (limite plano FREE); se excedido, retorna `422` com `code: "PLAN_LIMIT_EXCEEDED"`.
- **FR-052:** `GET /workouts/:id` retorna o workout do tenant com `exercises[].plannedSets[]`. `404` se não pertencer ao tenant.
- **FR-053:** `PATCH /workouts/:id` atualiza `name/description/order` e substitui integralmente `exercises[]`/`plannedSets[]` aninhados (delete + recreate dos filhos).
- **FR-054:** `DELETE /workouts/:id` remove o workout e seus filhos em cascata (`workoutExercises`, `plannedSets`, `sessions` associadas). `404` se não pertencer ao tenant.

### Training — WorkoutSession (com sessionExercises/executedSets aninhados)

- **FR-060:** `POST /workout-sessions` cria uma sessão, payload aninhado:
  `{ workoutId, startedAt, endedAt?, status?, comment?, difficulty?, exercises: [{ exerciseId, order, notes?, executedSets: [{ setNumber, kg?, reps?, completedAt? }] }] }`.
  `workoutId` deve pertencer ao tenant (`404` senão). `status` default: `FINISHED` se `endedAt` informado, senão `ACTIVE`.
- **FR-061:** `GET /workout-sessions` lista sessões do tenant, paginado via cursor, ordenado por `startedAt desc`. Se `user.plan === FREE`, filtra `startedAt >= now - 60 dias`.
- **FR-062:** `GET /workout-sessions/:id` retorna a sessão do tenant com `exercises[].executedSets[]`. `404` se não pertencer ao tenant.
- **FR-063:** `PATCH /workout-sessions/:id` atualiza `endedAt/status/comment/difficulty` e substitui `exercises[]`/`executedSets[]` aninhados (delete + recreate).
- **FR-064:** `DELETE /workout-sessions/:id` remove a sessão e seus filhos em cascata. `404` se não pertencer ao tenant.

---

## Critérios de Sucesso

- [ ] Toda rota sob `/api/v1` (exceto `/health`) retorna `401` sem JWT válido.
- [ ] CRUD completo via Swagger UI para User (perfil), MuscleGroup, Equipment, Exercise, Strategy, Workout, WorkoutSession.
- [ ] Acessar/alterar recurso de outro tenant retorna `404` em todos os endpoints com `:id`.
- [ ] `POST /workouts` além do 6º para um tenant retorna `422 PLAN_LIMIT_EXCEEDED`.
- [ ] `GET /workout-sessions` de usuário FREE não retorna sessões com `startedAt` > 60 dias atrás; PRO retorna todas.
- [ ] `GET /exercises` e `GET /workout-sessions` aceitam `?cursor=&limit=` e retornam `nextCursor` correto.
- [ ] Payload inválido em qualquer `POST`/`PATCH` retorna `400` com erros por campo.
- [ ] Suíte Supertest cobre happy-path + isolamento de tenant + validação para Identity, Catalog e Training.
- [ ] Swagger disponível em `/api/v1/docs` documentando todos os endpoints acima.

---

## Fora do Escopo

- Endpoints de `TrainerStudentRelationship` (vínculo aluno↔preparador) — Fase 8 (Coaching).
- Alteração de `plan` (upgrade/downgrade) e `isTrainer` via API — fluxo de billing/admin futuro.
- Seed de dados de referência (MuscleGroups, Equipment, exercícios globais) em produção — tarefa separada (ver Riscos).
- Integração frontend (TanStack Query, substituição de mock data), onboarding, rota `/program/[programId]` — Fase 2.
- Dashboards de progresso (volume, heatmap, etc.) — Fase 5.
- Notificações assíncronas / BullMQ — Fase 9.

---

## Riscos e Premissas

- **Premissa:** NextAuth v5 emite JWT criptografado (JWE, `AUTH_SECRET`). O guard NestJS precisa decodificá-lo via `jose` com o mesmo segredo — requer novas deps (`@nestjs/passport` + estratégia custom, ou guard manual com `jose`).
- **Premissa:** `docs/context/product.md` (atualmente diz "2 estratégias ativas + 4 treinos/estratégia") será atualizado na fase de Plan para refletir a regra adotada aqui (6 workouts/tenant no total, sem limite de estratégias ativas).
- **Risco:** Os repositórios atuais (`IWorkoutsRepository`, `IWorkoutSessionsRepository`, `IStrategiesRepository`, `IExercisesRepository`) não cobrem todas as operações desta spec (nested write de exercises/plannedSets, update genérico de Strategy/Exercise, delete de WorkoutSession). Extensão das interfaces e implementações Prisma faz parte do plano técnico.
- **Risco:** Sem seed de `MuscleGroup`/`Equipment`/`Exercise` globais, `GET /exercises` e seus filtros retornam vazio em dev/staging. Recomenda-se task de seed (chore) no plano técnico, mesmo fora do escopo funcional desta spec.
- **Risco:** `PATCH /workouts/:id` e `/workout-sessions/:id` com substituição total dos filhos aninhados (delete + recreate) gera novos `id`s para `PlannedSet`/`ExecutedSet` a cada update. Aceitável pois nenhuma entidade hoje referencia esses ids externamente.

---

<!--
GATE DE APROVAÇÃO
Para desbloquear a criação do plano técnico, altere o Status acima de "draft" para "approved".
O agente planner NÃO deve criar tasks de implementação enquanto Status for "draft".
-->
