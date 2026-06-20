# Spec & Plan: TASK12 — Histórico de Sessões

**Status:** approved
**Data:** 2026-06-15
**Autor:** Claude (Planner)

---

## 1. Problema e Visão Geral

TASK11 já persiste sessões de treino (`POST /workout-sessions`, sempre `status: FINISHED` com `endedAt` preenchido). `GET /workout-sessions` (TASK03, estendido em TASK11) já pagina por tenant, ordena `startedAt desc, id desc` e aplica retenção de 60 dias para o plano FREE (`ListWorkoutSessionsUseCase`). Falta apenas a camada de apresentação: nenhuma tela permite ao usuário consultar esse histórico — não há lista cronológica nem detalhe de sessão passada (séries executadas, comentário, dificuldade).

---

## 2. Cenários de Usuário

- **P1 (crítico):** Como usuário, quero ver uma lista cronológica dos meus treinos concluídos (nome do treino, data, duração, dificuldade) para acompanhar minha consistência.
- **P1 (crítico):** Como usuário, quero abrir o detalhe de uma sessão passada e ver, por exercício, as séries executadas (kg × reps) e meu comentário, para revisar minha evolução.
- **P2 (importante):** Como usuário do plano gratuito, quero ser avisado de que sessões com mais de 60 dias não aparecem no histórico, para entender a limitação do plano.
- **P3 (nice-to-have, fora de escopo):** Filtrar histórico por treino/estratégia específica.

---

## 3. Requisitos Funcionais

- **FR-001:** Backend — `WorkoutSession` entity e `WorkoutSessionSummaryDto`/`WorkoutSessionDetailDto` ganham `workoutName: string`. O repositório inclui `workout: { select: { name: true } }` em `findManyByTenant`/`findById`, sem alterar paginação/filtros/ordenamento existentes.
- **FR-002:** `@fitflow/types` — `WorkoutSessionSummaryDto.workoutName: string` (mirror de FR-001; `WorkoutSessionDetailDto` herda).
- **FR-003:** `useWorkoutSessions()` (hook, `useInfiniteQuery`) — `GET /workout-sessions?limit=20[&cursor=...]`, mesmo padrão de `use-exercises.ts` (cursor via `nextCursor`).
- **FR-004:** `useWorkoutSession(id)` (hook, `useQuery`) — `GET /workout-sessions/:id` → `WorkoutSessionDetailDto`, `enabled: !!id`.
- **FR-005:** `useUserMe()` (hook, `useQuery`) — `GET /users/me` → `UserMeDto`, usado para o banner de retenção (FREE).
- **FR-006:** `/history` (nova rota, `HistoryListPage`, `"use client"`) lista sessões via `useWorkoutSessions()`: cada item mostra `workoutName`, data (`startedAt`, `dd/MM/yyyy`), duração (`endedAt - startedAt`, formato `Xh Ymin`), dificuldade (1-10) e preview de `comment`. Clique → `/history/[id]`. Botão "Carregar mais" enquanto `hasNextPage`. Estado vazio: "Nenhuma sessão registrada ainda." + CTA para `/library`. Loading: skeleton.
- **FR-007:** Banner de retenção — se `useUserMe().data?.plan === "FREE"`, exibir no topo de `/history`: "Sessões com mais de 60 dias não aparecem aqui no plano gratuito."
- **FR-008:** `/history/[id]` (nova rota, `SessionDetailPage`, `"use client"`) via `useWorkoutSession(id)` + `useExercisesByIds(session.exercises.map(e => e.exerciseId))`: cabeçalho com `workoutName`, data/hora, duração, dificuldade e comentário; por exercício, nome/imagem (`ExerciseDto`) e tabela de séries executadas (`setNumber`, `kg`, `reps`, hora de `completedAt`) — séries sem `completedAt` omitidas. Loading: skeleton. 404 (`ApiClientError.status === 404`) → `notFound()`.
- **FR-009:** Navegação — `nav-content.tsx` ganha item "Histórico" (ícone `History`, lucide) em `extraNavItems`, `href: "/history"`. `AppShell.tsx`: `getActiveItem` mapeia `/history` → `"historico"`; `sectionTitles.historico = "Histórico"`. Novo `apps/web/src/app/history/layout.tsx` (`<AppShell>`, padrão `program/[id]/layout.tsx`).

> Cada FR deve ser independente e testável.

---

## 4. Fora do Escopo & Riscos

- **Fora do Escopo:** Filtro de histórico por treino/estratégia/data; export/compartilhamento de sessão (TASK16); edição/exclusão de sessão pela UI (endpoints `PATCH`/`DELETE /workout-sessions/:id` já existem, sem tela nesta task).
- **Fora do Escopo:** Dashboards de progresso (volume, heatmap, dias de treino) — TASK13.
- **Fora do Escopo:** Item "Histórico" no `BottomNav` (mobile) — acesso via sidebar/menu já é suficiente; bottom nav mantém os 4 itens atuais.
- **Premissa:** `GET /workout-sessions` (paginado, `startedAt desc`, retenção 60 dias FREE) e `GET /workout-sessions/:id` (TASK03/TASK11) não sofrem alteração de contrato além de FR-001.
- **Premissa:** Todas as sessões persistidas têm `status: FINISHED` (TASK11 sempre informa `endedAt`) — sem necessidade de filtro de status na UI.
- **Risco:** `workoutName` denormalizado via join reflete o nome do treino *no momento da consulta*, não um snapshot histórico — se o treino for renomeado, sessões antigas mostram o nome atual. → Mitigação: aceitável, mesmo padrão de outras leituras (`DashboardSummaryDto`); snapshot fica fora de escopo.
- **Risco:** Paginação infinita com muitas sessões pode degradar performance. → Mitigação: `limit=20` por página (já suportado por `PaginationQueryDto`), `useInfiniteQuery` com `getNextPageParam`.

---

## 5. Contratos de API

- `GET /workout-sessions?limit=20&cursor=<id>` (extensão de TASK03/TASK11)
  - **Response:** `PaginatedResponse<WorkoutSessionSummaryDto>` (200) — `WorkoutSessionSummaryDto` agora inclui `workoutName: string`.
- `GET /workout-sessions/:id` (existente)
  - **Response:** `WorkoutSessionDetailDto` (200) — inclui `workoutName: string`.
- `GET /users/me` (existente, TASK01) — sem alteração.
- `GET /exercises/:id` (existente) — sem alteração.

---

## 6. Plano de Implementação (Tarefas)

### Ordem de Execução & Dependências

| Onda | Tarefas (paralelas) | Agente(s) | Pré-requisito |
|------|---------------------|-----------|---------------|
| 1    | T1, T2, T5          | backend, frontend | — |
| 2    | T3                  | frontend  | T2 |
| 3    | T4, T6              | frontend  | T1, T3, T5 |
| 4    | T7                  | ambos     | T1, T4, T6 |

```
Onda 1: T1 (backend) | T2 (frontend) | T5 (frontend)   ← paralelo
Onda 2: T3 (frontend)
Onda 3: T4 (frontend) | T6 (frontend)                  ← paralelo
Onda 4: T7 (ambos)
```

---

### Tarefa T1: Backend — `workoutName` em WorkoutSession
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** —
- **Paralelizável com:** T2, T5
- **Descrição:**
  - `apps/api/src/training/domain/workout-session.entity.ts`: adicionar `workoutName: string` a `IWorkoutSessionProps` e respectivo getter.
  - `apps/api/src/training/infra/repositories/prisma-workout-sessions.repository.ts`: `SESSION_INCLUDE` → incluir `workout: { select: { name: true } }`; `toDomain` mapeia `row.workout.name` → `workoutName`. Aplica-se a `findById` e `findManyByTenant` (ambos já usam `SESSION_INCLUDE`).
  - `apps/api/src/training/application/dto/workout-session.dto.ts`: `WorkoutSessionSummaryDto.workoutName!: string` (`@ApiProperty()`); `fromEntity` mapeia `entity.workoutName`.
- **Critérios de Aceite:**
  - [x] `GET /workout-sessions` e `GET /workout-sessions/:id` retornam `workoutName` correto (nome do treino associado).
  - [x] Testes unitários cobrindo o novo campo no mapeamento entidade → DTO (`workout-session.use-cases.spec.ts` ou novo spec do repositório).
- **Notas:** sem migration — apenas `include`/`select` adicional na query existente.

### Tarefa T2: `@fitflow/types` — `workoutName`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T1, T5
- **Descrição:** Em `packages/types/src/index.ts`, `WorkoutSessionSummaryDto` ganha `workoutName: string` (mirror de T1; `WorkoutSessionDetailDto extends WorkoutSessionSummaryDto` herda automaticamente).
- **Critérios de Aceite:**
  - [x] `tsc` limpo em `apps/web` e `apps/api`.
- **Notas:** apenas tipos — sem lógica.

### Tarefa T5: Navegação + layout `/history`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T1, T2
- **Descrição:**
  - `apps/web/src/components/layout/nav-content.tsx`: novo item em `extraNavItems` — `{ id: "historico", label: "Histórico", icon: History, href: "/history" }` (import `History` de `lucide-react`).
  - `apps/web/src/components/layout/AppShell.tsx`: `getActiveItem` → `if (pathname.startsWith("/history")) return "historico";`; `sectionTitles.historico = "Histórico"`.
  - Novo `apps/web/src/app/history/layout.tsx`: `export default function HistoryLayout({ children }) { return <AppShell>{children}</AppShell>; }` (padrão `apps/web/src/app/program/[id]/layout.tsx`). Esse layout cobre também `/history/[id]` (rota filha).
- **Critérios de Aceite:**
  - [x] Item "Histórico" aparece na sidebar/menu, navega para `/history` e fica destacado (sidebar ativa + título "Histórico" no `TopHeader`) em `/history` e `/history/[id]`.

### Tarefa T3: Hooks — sessões e usuário
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T2
- **Paralelizável com:** —
- **Descrição:** Em `apps/web/src/lib/api/hooks/`:
  - `use-workout-sessions.ts` → `useWorkoutSessions()`: `useInfiniteQuery` igual a `use-exercises.ts` — `queryKey: ["workout-sessions"]`, `queryFn` chama `GET /workout-sessions?limit=20[&cursor=pageParam]` → `PaginatedResponse<WorkoutSessionSummaryDto>`, `getNextPageParam: (last) => last.nextCursor`, `initialPageParam: null as string | null`.
  - `use-workout-session.ts` → `useWorkoutSession(id: string)`: `useQuery({ queryKey: ["workout-session", id], queryFn: () => apiFetch<WorkoutSessionDetailDto>(\`/workout-sessions/${id}\`), enabled: !!id })`.
  - `use-user-me.ts` → `useUserMe()`: `useQuery({ queryKey: ["users", "me"], queryFn: () => apiFetch<UserMeDto>("/users/me") })`.
- **Critérios de Aceite:**
  - [x] Testes (jest.mock de `apiFetch`, padrão `use-last-finished-session.test.tsx`/TASK11 T3) cobrindo: lista com múltiplas páginas, lista vazia, sessão por id (sucesso/erro), `useUserMe` (FREE/PRO).

### Tarefa T4: `/history` — lista de sessões
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T1, T3, T5
- **Paralelizável com:** T6
- **Descrição:**
  - `apps/web/src/app/history/page.tsx`: `"use client"`, renderiza `HistoryListPage`.
  - `apps/web/src/components/history/HistoryListPage.tsx`: usa `useWorkoutSessions()` + `useUserMe()`.
    - Banner de retenção (FR-007) quando `plan === "FREE"`.
    - Lista de `SessionListItem` (novo, mesmo arquivo ou colocated): `workoutName`, data (`startedAt` formatado `dd/MM/yyyy`), duração (`endedAt - startedAt` → `Xh Ymin`, ou "—" se `endedAt` nulo), dificuldade (1-10) e preview de `comment` (truncado); cada item é `Link` para `/history/${id}`.
    - Botão "Carregar mais" (`fetchNextPage`) visível enquanto `hasNextPage`.
    - Estado vazio (`items.length === 0` na primeira página): "Nenhuma sessão registrada ainda." + CTA `Link` para `/library`.
    - Loading: skeleton (mesmo padrão de `WorkoutStartPreview`/`WorkoutDetailPage`).
- **Critérios de Aceite:**
  - [x] Lista renderiza sessões reais (nome do treino, data, duração, dificuldade), ordenadas por `startedAt desc`.
  - [x] "Carregar mais" busca e anexa a próxima página.
  - [x] Banner de retenção aparece somente para `plan === "FREE"`.
  - [x] Estado vazio e skeleton de loading cobertos.
  - [x] Teste RTL (jest.mock dos hooks) cobrindo lista populada, vazia e banner FREE/PRO.

### Tarefa T6: `/history/[id]` — detalhe da sessão
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T1, T3, T5
- **Paralelizável com:** T4
- **Descrição:**
  - `apps/web/src/app/history/[id]/page.tsx`: `"use client"`, renderiza `SessionDetailPage`.
  - `apps/web/src/components/history/SessionDetailPage.tsx`: `useWorkoutSession(id)` + `useExercisesByIds(session.exercises.map(e => e.exerciseId))`.
    - Cabeçalho: `workoutName`, data/hora (`startedAt`), duração, dificuldade (1-10), `comment` (se houver).
    - Por exercício (`session.exercises`, ordenado por `order`): nome/imagem via `ExerciseDto` correspondente + tabela de séries (`setNumber`, `kg`, `reps`, hora de `completedAt`), filtrando `executedSets` sem `completedAt`.
    - Loading: skeleton enquanto `useWorkoutSession`/`useExercisesByIds` carregam.
    - 404: se `useWorkoutSession` retornar erro `ApiClientError` com `status === 404` → `notFound()`.
- **Critérios de Aceite:**
  - [x] Detalhe renderiza dados reais da sessão (cabeçalho + séries executadas por exercício com nome/imagem).
  - [x] Séries não concluídas (`completedAt` nulo) não aparecem na tabela.
  - [x] 404 para `id` inexistente.
  - [x] Teste RTL (jest.mock dos hooks) cobrindo render completo e 404.

### Tarefa T7: Testes finais, cobertura e fechamento
- **Tipo:** chore
- **Agente:** ambos
- **Depende de:** T1, T4, T6
- **Paralelizável com:** —
- **Descrição:**
  - Rodar `tsc`/lint/jest no monorepo (`apps/api` e `apps/web`).
  - Garantir cobertura mínima de `docs/context/decisions.md` (componentes 70%, hooks/utils 90%, use cases backend 90%) para arquivos novos/alterados (T1-T6).
  - `docs/context/product-backlog.md`: marcar TASK12 `done`, preencher coluna "Spec".
- **Critérios de Aceite:**
  - [x] `tsc`/lint/jest limpos em `apps/api` e `apps/web`.
  - [x] Cobertura dentro das metas de `decisions.md`.
  - [x] Backlog atualizado.

---

<!--
GATE DE APROVAÇÃO
Revise as regras de negócio e as tarefas técnicas.
Se tudo estiver correto, altere o Status acima de "review" para "approved" para liberar os agentes de frontend/backend para iniciar a implementação.
-->
