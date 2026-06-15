# Spec & Plan: TASK11 — Execução de Treino

**Status:** approved
**Data:** 2026-06-15
**Autor:** Claude (Planner)

---

## 1. Problema e Visão Geral

O fluxo `/workout/[id]` → `/start` → `/session` → `/finish` (TASK00-E) é 100% mock: todas as 4 telas leem `mockWorkouts`/`mockLastSessions` de `@/lib/mock/workout.ts`, cujas chaves (`"a-lower-1"`, `"b-push"`, ...) não existem no banco real. Como `WorkoutListRow`/`WorkoutCard` (em `/program/[id]` e `/library`, já integrados) apontam para `/workout/${workout.id}` com **UUIDs reais**, qualquer clique nessas telas hoje resulta em `notFound()` — o fluxo de execução é inalcançável em produção.

O backend (`WorkoutSessionsController`, TASK03) já implementa `POST/GET/PATCH/DELETE /workout-sessions` com entidades de domínio completas (`WorkoutSession`, `SessionExercise`, `ExecutedSet`), sem necessidade de migration. Esta task conecta as 4 telas aos dados reais (`/workouts/:id`, `/exercises/:id`, `/workout-sessions`), preservando a UX/timers já implementados em TASK00-E.

---

## 2. Cenários de Usuário

- **P1 (crítico):** Como usuário, ao abrir um treino do meu programa (`/workout/[id]`), quero ver os exercícios e séries planejadas reais e iniciar a execução.
- **P1 (crítico):** Como usuário, durante a execução (`/workout/[id]/session`), quero marcar séries como concluídas (kg/reps), ver o timer total e o timer de descanso entre séries, e ver meus valores da última execução como referência.
- **P1 (crítico):** Como usuário, ao finalizar o treino (`/workout/[id]/finish`), quero registrar comentário e dificuldade, e ter a sessão salva no histórico (backend).
- **P2 (importante):** Como usuário, quero que o progresso da sessão ativa sobreviva a reload/fechar o app (já existente via Zustand persist — apenas preservar).

> P1 = sem isso o produto não funciona. P2 = valor claro mas contornável.

---

## 3. Requisitos Funcionais

- **FR-001:** `FindWorkoutSessionsQueryDto` ganha filtro opcional `workoutId`; `GET /workout-sessions?workoutId=<id>&limit=1` retorna a sessão mais recente (ordem já existente: `startedAt desc, id desc`) daquele treino para o tenant autenticado.
- **FR-002:** `CreateSessionExerciseDto.executedSets` (usado em `CreateWorkoutSessionDto` e `UpdateWorkoutSessionDto`) passa a aceitar array vazio (`[]`) — remove `@ArrayMinSize(1)`, mantém `@IsArray()` — para permitir registrar um exercício sem nenhuma série concluída (pulado).
- **FR-003:** `/workout/[id]` (`WorkoutDetailPage`, reescrito) exibe dados reais via `useWorkout(id)` + `useExercisesByIds`: nome do treino, lista de exercícios (imagem, nome, grupo muscular, `${séries} Séries · ${targetReps} reps [· {targetKg}kg]`, descanso). CTA primário "Iniciar Treino" → `/workout/[id]/start`. Botão/link "Editar" → `/workout/[id]/edit` (TASK09). 404 → `notFound()`.
- **FR-004:** O editor inline drag-and-drop da tela `/workout/[id]` (antigo `WorkoutDetailPage`, séries editáveis, `SuggestionsPanel`) é removido — edição completa já existe em `/workout/[id]/edit`.
- **FR-005:** `/workout/[id]/start` (`WorkoutStartPreview`) usa `useWorkout(id)` + `useExercisesByIds` para estatísticas (total de séries, duração estimada) e lista de exercícios; usa `useLastFinishedSession(id)` para exibir "Última execução: <relativo>" quando existir sessão `FINISHED` anterior, ou "Primeira execução" caso contrário.
- **FR-006:** "Iniciar Treino" chama `startSession(workout.id, exerciseIds)` (Zustand, `exerciseIds` = `workout.exercises` ordenados por `order`, mapeados para `exerciseId`) e navega para `/workout/[id]/session`.
- **FR-007:** `/workout/[id]/session` (`WorkoutActiveSession`) usa `useWorkout(id)` + `useExercisesByIds` para nome/imagem/grupo muscular/`plannedSets`/`restSeconds` do exercício atual, e `useLastFinishedSession(id)` para a coluna "Anterior" (busca por `exerciseId` em `lastSession.exercises[].executedSets`). Timers de duração total e descanso, marcação de série concluída, "Adicionar série" extra e navegação entre exercícios mantêm o comportamento de TASK00-E.
- **FR-008:** `/workout/[id]/finish` (`WorkoutFinishForm`) usa `useWorkout(id)` para montar o payload. "Salvar Treino" chama `useCreateWorkoutSession().mutateAsync(dto)` onde `dto = toCreateWorkoutSessionDto(workout, storeState, { endedAt, comment, difficulty })` (novo mapper, T4): `workoutId`, `startedAt` (do store), `endedAt` (capturado no mount), `comment`, `difficulty` (1-5 ou omitido se 0), `exercises[]` = um item por `workout.exercises[i]` com `exerciseId`/`order` do workout e `notes`/`executedSets` (apenas séries com `completedAt`) do store.
- **FR-009:** Sucesso em "Salvar Treino" → `resetSession()` (Zustand) + `router.push(/program/${workout.strategyId})`. Erro de API exibido inline (sem perder comentário/dificuldade já preenchidos); botão mostra estado de loading durante o submit.
- **FR-010:** Toggles "Atualizar valores da rotina" / Strava / Health Connect em `WorkoutFinishForm` permanecem apenas visuais (sem chamada de API) — sem alteração de comportamento.

> Cada FR deve ser independente e testável.

---

## 4. Fora do Escopo & Riscos

- **Fora do Escopo:** Persistir sessão `ACTIVE` no backend ao iniciar o treino / retomar sessão entre dispositivos / status `ABANDONED`. A sessão só é gravada (sempre `FINISHED`, `endedAt` preenchido) ao concluir o "Salvar Treino". Progresso intra-dispositivo continua via Zustand+localStorage (já existente).
- **Fora do Escopo:** "Atualizar valores da rotina" (sincronizar cargas/reps executados de volta para `plannedSets` do `Workout`), integrações Strava/Health Connect — toggles permanecem cosméticos.
- **Fora do Escopo:** Histórico de sessões (listagem) — TASK12.
- **Fora do Escopo:** `SuggestionsPanel.tsx` (painel desktop do antigo `WorkoutDetailPage`) — removido junto do editor DnD; sem substituto nesta task.
- **Premissa:** `POST/GET/PATCH/DELETE /workout-sessions` (TASK03), `GET /workouts/:id` e `GET /exercises/:id` (TASK02/09) já implementados e não sofrem alteração de contrato além do FR-001/FR-002.
- **Premissa:** `useWorkout`, `useExercisesByIds` (TASK09) e o store `workout-session.store.ts` (TASK00-E) são reaproveitados; apenas tipos/assinatura ajustados.
- **Risco:** Sem FR-002, treino com exercício 100% pulado (0 séries concluídas) falharia validação (`ArrayMinSize(1)`) no `POST /workout-sessions`. → Mitigação: T1 relaxa o DTO.
- **Risco:** Mapear `store.exercises[i]` ↔ `workout.exercises[i]` por índice depende de `startSession` semear o array na mesma ordem de `workout.exercises`. → Mitigação: T4/T5/T7 garantem a mesma ordenação (`order` asc) em ambas as pontas; mapper (T4) testado isoladamente.
- **Risco:** Remoção do editor DnD em `/workout/[id]` pode surpreender quem usava aquela tela para editar. → Mitigação: `/workout/[id]/edit` (TASK09) já cobre edição completa (nome, exercícios, séries, reorder).

---

## 5. Contratos de API

- `GET /workout-sessions?workoutId=<id>&limit=1` (extensão de TASK03)
  - **Response:** `PaginatedResponse<WorkoutSessionSummaryDto>` (200)
- `GET /workout-sessions/:id` (existente, sem alteração)
  - **Response:** `WorkoutSessionDetailDto` (200)
- `POST /workout-sessions` (existente; `CreateSessionExerciseDto.executedSets` agora aceita `[]`)
  - **Request:** `CreateWorkoutSessionDto`
  - **Response:** `WorkoutSessionDetailDto` (201)
- `GET /workouts/:id` (existente, TASK09 — sem alteração)
- `GET /exercises/:id` (existente — sem alteração)

---

## 6. Plano de Implementação (Tarefas)

### Ordem de Execução & Dependências

| Onda | Tarefas (paralelas) | Agente(s) | Pré-requisito |
|------|---------------------|-----------|---------------|
| 1    | T1, T2, T5, T6      | backend, frontend | —     |
| 2    | T3, T4              | frontend  | T2, T5 |
| 3    | T7, T8, T9          | frontend  | T1, T3, T4, T5 |
| 4    | T10                 | ambos     | T6, T7, T8, T9 |

```
Onda 1: T1 (backend) | T2 (frontend) | T5 (frontend) | T6 (frontend)   ← paralelo
Onda 2: T3 (frontend) | T4 (frontend)                                  ← paralelo
Onda 3: T7 (frontend) | T8 (frontend) | T9 (frontend)                  ← paralelo
Onda 4: T10 (ambos)
```

---

### Tarefa T1: Backend — filtro `workoutId` + relaxar `executedSets`
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** —
- **Paralelizável com:** T2, T5, T6
- **Descrição:**
  - `apps/api/src/training/application/dto/find-workout-sessions-query.dto.ts`: adicionar `workoutId?: string` (`@IsOptional() @IsString()`).
  - `apps/api/src/training/domain/repositories/workout-sessions.repository.interface.ts`: adicionar `workoutId?: string` aos opts de `findManyByTenant` e `count`.
  - `apps/api/src/training/infra/repositories/prisma-workout-sessions.repository.ts`: incluir `workoutId` no `where` de `findManyByTenant`/`count` quando informado.
  - `apps/api/src/training/application/use-cases/list-workout-sessions.use-case.ts`: repassar `query.workoutId` para `findManyByTenant`/`count`.
  - `apps/api/src/training/application/dto/workout-session.dto.ts`: remover `@ArrayMinSize(1)` de `CreateSessionExerciseDto.executedSets` (manter `@IsArray()` + `@ValidateNested`).
- **Critérios de Aceite:**
  - [x] `GET /workout-sessions?workoutId=X` retorna apenas sessões daquele `workoutId` (tenant-isolado).
  - [x] `POST /workout-sessions` com algum `exercises[].executedSets: []` retorna 201 (sem erro de validação).
  - [x] Testes unitários (repo mockado) para o novo filtro no use case; teste e2e cobrindo os dois pontos acima.
- **Notas:** sem migration — `workoutId` já é coluna indexada em `WorkoutSession`.

### Tarefa T2: `@fitflow/types` — DTOs de WorkoutSession
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T1, T5, T6
- **Descrição:** Em `packages/types/src/index.ts`, adicionar (espelhando `apps/api/src/training/application/dto/workout-session.dto.ts`, usando union de strings como `UserMeDto.plan`):
  - `export type WorkoutSessionStatus = "ACTIVE" | "FINISHED" | "ABANDONED";`
  - `ExecutedSetDto { id; setNumber; kg: number | null; reps: number | null; completedAt: string | null }`
  - `SessionExerciseDto { id; exerciseId; order; notes: string | null; executedSets: ExecutedSetDto[] }`
  - `WorkoutSessionSummaryDto { id; workoutId; startedAt; endedAt: string | null; status: WorkoutSessionStatus; comment: string | null; difficulty: number | null; createdAt }`
  - `WorkoutSessionDetailDto extends WorkoutSessionSummaryDto { exercises: SessionExerciseDto[] }`
  - `CreateExecutedSetDto { setNumber: number; kg?: number; reps?: number; completedAt?: string }`
  - `CreateSessionExerciseDto { exerciseId: string; order: number; notes?: string; executedSets: CreateExecutedSetDto[] }`
  - `CreateWorkoutSessionDto { workoutId: string; startedAt: string; endedAt?: string; status?: WorkoutSessionStatus; comment?: string; difficulty?: number; exercises: CreateSessionExerciseDto[] }`
  - `UpdateWorkoutSessionDto` (todos campos de `CreateWorkoutSessionDto` exceto `workoutId`, opcionais).
- **Critérios de Aceite:**
  - [x] Tipos exportados e usados sem erro de `tsc` em `apps/web` e `apps/api`.
- **Notas:** apenas tipos — sem lógica.

### Tarefa T5: Store `workout-session.store.ts` — remover dependência de mock
- **Tipo:** refactor
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T1, T2, T6
- **Descrição:** Em `apps/web/src/lib/stores/workout-session.store.ts`:
  - Definir localmente (remover import de `@/lib/mock/workout`): `ExecutedSet { setNumber: number; kg?: number; reps?: number; completedAt?: string }`, `ExecutedExercise { exerciseId: string; notes: string; sets: ExecutedSet[] }`.
  - `startSession(workoutId: string, exerciseIds: string[])`: assinatura muda de `(workoutId, workoutExercises: WorkoutExercise[])` para `(workoutId, exerciseIds: string[])`; semeia `exercises: exerciseIds.map((exerciseId) => ({ exerciseId, notes: "", sets: [] }))`.
  - Demais actions (`completeSet`, `setRestTimer`, `clearRest`, `setCurrentExercise`, `updateNote`, `addExecutedSet`, `beginFinishing`, `resetSession`) inalteradas.
- **Critérios de Aceite:**
  - [x] Store compila sem importar `@/lib/mock/workout`.
  - [x] Testes existentes/novos do store cobrindo `startSession` com a nova assinatura.
- **Notas:** chamadores (`WorkoutStartPreview`, T7) são ajustados em T7.

### Tarefa T6: `/workout/[id]` — visão real do treino (substitui editor mock)
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T1, T2, T5
- **Descrição:** Reescrever `apps/web/src/components/workout/WorkoutDetailPage.tsx` (mantém o nome do arquivo/componente) como `"use client"`, padrão de `apps/web/src/app/workout/[id]/edit/page.tsx` (TASK09):
  - `useWorkout(id)` → `WorkoutDetailDto`; `useExercisesByIds(workout.exercises.map(e => e.exerciseId))` → `ExerciseDto[]` para nome/imagem/grupo muscular.
  - Header sticky: `Link` voltar para `/program/${workout.strategyId}`, título `workout.name`, botão "Iniciar" (`Play`, primário) → `router.push(/workout/${workout.id}/start)`, botão/link "Editar" → `/workout/${workout.id}/edit`.
  - Lista somente-leitura de exercícios: imagem (`exercise.imageUrl`, fallback se `null`), nome, grupo muscular primário, `${plannedSets.length} séries · ${targetReps} reps${targetKg ? ' · ' + targetKg + 'kg' : ''}`, descanso (`formatRest(restSeconds)`).
  - Loading: skeleton enquanto `useWorkout`/`useExercisesByIds` carregam. 404 (`ApiClientError` status 404) → `notFound()`.
  - `apps/web/src/app/workout/[id]/(detail)/page.tsx`: simplificar para passar apenas `{ id }` ao componente (remover `mockWorkouts`/`generateMetadata` baseado em mock — título estático "Treino — FitFlow" ou omitir `generateMetadata`).
  - Remover toda lógica DnD (`@dnd-kit/*`), `LocalExercise`/`SetRow`/`ExerciseBlock`/`SortableExerciseBlock`, e o import/uso de `SuggestionsPanel`. Excluir `apps/web/src/components/workout/SuggestionsPanel.tsx` (sem outras referências em código).
- **Critérios de Aceite:**
  - [x] `/workout/[id]` com UUID real renderiza nome, exercícios (com imagem/nome/grupo muscular reais) e séries planejadas.
  - [x] Botão "Iniciar" navega para `/workout/[id]/start`; "Editar" navega para `/workout/[id]/edit`.
  - [x] 404 para id inexistente.
  - [x] Teste RTL (MSW): renderização da lista de exercícios a partir de `WorkoutDetailDto` + `ExerciseDto[]`.
- **Notas:** sem DnD/edição inline — coberto por `/workout/[id]/edit`.

---

### Tarefa T3: Hooks — `useLastFinishedSession` + `useCreateWorkoutSession`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T2
- **Paralelizável com:** T4
- **Descrição:** Em `apps/web/src/lib/api/hooks/`, seguindo padrão de `use-workout.ts`/`use-create-workout.ts`:
  - `use-last-finished-session.ts` → `useLastFinishedSession(workoutId: string)`: `useQuery<WorkoutSessionDetailDto | null>(["workout-session", "last", workoutId], async () => { const page = await apiFetch<PaginatedResponse<WorkoutSessionSummaryDto>>(\`/workout-sessions?workoutId=${workoutId}&limit=1\`); if (!page.items[0]) return null; return apiFetch<WorkoutSessionDetailDto>(\`/workout-sessions/${page.items[0].id}\`); }, { enabled: !!workoutId })`.
  - `use-create-workout-session.ts` → `useCreateWorkoutSession()`: `useMutation<WorkoutSessionDetailDto, ApiClientError, CreateWorkoutSessionDto>` → `POST /workout-sessions`; `onSuccess` invalida `["workout-session", "last", data.workoutId]` e `["workout-sessions"]`.
- **Critérios de Aceite:**
  - [x] `useLastFinishedSession` retorna `null` quando não há sessão anterior, e o detalhe completo (`exercises[].executedSets`) quando há.
  - [x] `useCreateWorkoutSession` invalida as queries corretas no `onSuccess`.
  - [x] Testes (MSW) cobrindo: sem sessão anterior, com sessão anterior, sucesso e erro de `useCreateWorkoutSession`.
- **Notas:** nenhum endpoint novo — usa `GET /workout-sessions` (com `workoutId`, T1), `GET /workout-sessions/:id` e `POST /workout-sessions`.

### Tarefa T4: Mapper `toCreateWorkoutSessionDto`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T2, T5
- **Paralelizável com:** T3
- **Descrição:** Criar `apps/web/src/lib/workout/workout-session.mapper.ts`:
  - `toCreateWorkoutSessionDto(workout: WorkoutDetailDto, session: { startedAt: string; exercises: ExecutedExercise[] }, extras: { endedAt: string; comment?: string; difficulty?: number }): CreateWorkoutSessionDto`.
  - Para cada `workout.exercises[i]` (ordenado por `order`), usar `session.exercises[i]` (mesmo índice — `startSession` semeia na mesma ordem, T5): `{ exerciseId: workout.exercises[i].exerciseId, order: workout.exercises[i].order, notes: session.exercises[i].notes || undefined, executedSets: session.exercises[i].sets.filter(s => s.completedAt).map(s => ({ setNumber: s.setNumber, kg: s.kg, reps: s.reps, completedAt: s.completedAt })) }`.
  - `comment`: `extras.comment || undefined`. `difficulty`: `extras.difficulty > 0 ? extras.difficulty : undefined`.
- **Critérios de Aceite:**
  - [x] Testes unitários: séries não concluídas (`completedAt` ausente) excluídas; exercício com 0 séries concluídas → `executedSets: []`; `notes`/`comment`/`difficulty` vazios omitidos do payload; `order`/`exerciseId` corretos por índice.
- **Notas:** isolar essa lógica evita bugs de índice diretamente nos componentes (mesmo padrão de `toCreateWorkoutDto` da TASK09 T2).

---

### Tarefa T7: `/workout/[id]/start` — dados reais
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T1, T3, T5
- **Paralelizável com:** T8, T9
- **Descrição:**
  - `apps/web/src/app/workout/[id]/start/page.tsx`: `"use client"`, `useWorkout(id)` + `useExercisesByIds(...)` + `useLastFinishedSession(id)`; loading skeleton; 404 → `notFound()`.
  - `WorkoutStartPreview.tsx`: props `workout: WorkoutDetailDto`, `exercises: ExerciseDto[]`, `lastSession: WorkoutSessionDetailDto | null`.
    - `estimateDuration`/`exerciseSubtitle` adaptados para `WorkoutExerciseDto`/`PlannedSetDto` (`targetReps`/`targetKg` são `string | null`) + `ExerciseDto` (imagem/nome).
    - "Última execução": usa `lastSession?.startedAt` (ou "Primeira execução" se `null`).
    - `handleStart`: `startSession(workout.id, [...workout.exercises].sort((a,b) => a.order - b.order).map(e => e.exerciseId))` (nova assinatura T5) → `router.push(/workout/${workout.id}/session)`.
- **Critérios de Aceite:**
  - [x] Página renderiza stats/exercícios reais e "Última execução"/"Primeira execução" corretamente.
  - [x] "Iniciar Treino" popula o store com os `exerciseId`s na ordem correta e navega para `/session`.
  - [x] Teste RTL (MSW) cobrindo os dois casos de `lastSession` (presente/ausente).

### Tarefa T8: `/workout/[id]/session` — dados reais
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T1, T3, T5
- **Paralelizável com:** T7, T9
- **Descrição:**
  - `apps/web/src/app/workout/[id]/session/page.tsx`: `"use client"`, mesma busca de dados de T7 (`useWorkout`, `useExercisesByIds`, `useLastFinishedSession`); loading skeleton; 404 → `notFound()`.
  - `WorkoutActiveSession.tsx`: props `workout: WorkoutDetailDto`, `exercises: ExerciseDto[]`, `lastSession: WorkoutSessionDetailDto | null`.
    - `workoutEx` = `workout.exercises[currentExerciseIndex]` (ordenado por `order`) combinado com o `ExerciseDto` correspondente (nome, `imageUrl`, grupo muscular primário) para header/imagem "A seguir".
    - Tabela de séries usa `workoutEx.plannedSets` (`targetReps`/`targetKg: string | null`).
    - `prevExData = lastSession?.exercises.find(e => e.exerciseId === workoutEx.exerciseId)`; `getPrevLabel` usa `ExecutedSetDto.kg`/`reps` (podem ser `null`).
    - Timers (`useElapsedSeconds`, `useRestCountdown`), `formatTimer`/`formatRest`, marcação de série, "Adicionar série" extra, navegação entre exercícios e redirect para `/start` se `status !== "active"` mantidos como em TASK00-E.
- **Critérios de Aceite:**
  - [x] Sessão sem `lastSession` mostra "—" na coluna "Anterior"; com `lastSession`, mostra `kg × reps` da sessão anterior por série/exercício.
  - [x] Marcar série concluída atualiza o store e dispara o timer de descanso com `restSeconds` real do exercício.
  - [x] Ao concluir o último exercício, navega para `/finish` (comportamento existente preservado).
  - [x] Teste RTL cobrindo marcação de série + exibição de "Anterior".

### Tarefa T9: `/workout/[id]/finish` — persistência real
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T1, T3, T4, T5
- **Paralelizável com:** T7, T8
- **Descrição:**
  - `apps/web/src/app/workout/[id]/finish/page.tsx`: `"use client"`, `useWorkout(id)`; loading skeleton; 404 → `notFound()`.
  - `WorkoutFinishForm.tsx`: prop `workout: WorkoutDetailDto`.
    - `handleSave` → `async`: monta `dto = toCreateWorkoutSessionDto(workout, { startedAt, exercises }, { endedAt: endedAt.toISOString(), comment, difficulty: difficulty || undefined })` (T4) e chama `useCreateWorkoutSession().mutateAsync(dto)`.
    - Sucesso: `resetSession()` + `router.push(/program/${workout.strategyId})`.
    - Erro: exibir mensagem inline (padrão `StrategyFormDialog`/TASK09), preservando `comment`/`difficulty`/toggles preenchidos; botão "Salvar Treino" com estado de loading (desabilitado + indicador) durante o submit.
    - Toggles "Atualizar valores da rotina"/Strava/Health Connect inalterados (cosméticos, FR-010).
- **Critérios de Aceite:**
  - [x] Submit bem-sucedido chama `POST /workout-sessions` com o payload de `toCreateWorkoutSessionDto`, reseta o store e navega para `/program/[strategyId]`.
  - [x] Erro de API mantém o formulário preenchido e exibe mensagem inline.
  - [x] Teste RTL (MSW) cobrindo sucesso e erro do submit.

---

### Tarefa T10: Testes finais, limpeza e fechamento
- **Tipo:** chore
- **Agente:** ambos
- **Depende de:** T6, T7, T8, T9
- **Paralelizável com:** —
- **Descrição:**
  - Excluir `apps/web/src/lib/mock/workout.ts` (sem mais referências após T6-T9).
  - Rodar `tsc`/`lint`/`jest` no monorepo (`apps/api` e `apps/web`).
  - Garantir cobertura mínima de `docs/context/decisions.md` (componentes 70%, hooks/utils 90%, use cases backend 90%) para os arquivos novos/alterados (T1-T9).
  - `docs/context/product-backlog.md`: marcar TASK11 `done`.
- **Critérios de Aceite:**
  - [x] `tsc`/`lint`/`jest` limpos em `apps/api` e `apps/web`.
  - [x] Nenhuma referência restante a `@/lib/mock/workout`.
  - [x] Cobertura dentro das metas de `decisions.md`.
  - [x] Backlog atualizado.

---

<!--
GATE DE APROVAÇÃO
Revise as regras de negócio e as tarefas técnicas.
Se tudo estiver correto, altere o Status acima de "review" para "approved" para liberar os agentes de frontend/backend para iniciar a implementação.
-->
