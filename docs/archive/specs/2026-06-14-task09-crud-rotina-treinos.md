# Spec & Plan: TASK09 — CRUD de Rotina & Treinos

**Status:** approved
**Data:** 2026-06-14
**Autor:** Claude (Planner)

---

## 1. Problema e Visão Geral

Após TASK08, o usuário já cria/edita **Estratégias** (programas, splits ABC/Upper-Lower/PPL/Full Body), mas não existe UI para gerenciar os **Treinos** (dias de treino) dentro de uma estratégia: `/program/[id]` apenas lista treinos pré-existentes via `WorkoutListRow`, sem forma de criar, editar ou excluir um treino com seus exercícios e séries planejadas.

O backend (`/workouts`, TASK03) **já implementa CRUD completo e aninhado** (exercícios + séries planejadas, validação de `exerciseId`, limite de 6 treinos/plano free), mas nenhum frontend consome `POST/PATCH/DELETE /workouts`. Sem essa tela, o produto fica incompleto: o usuário não consegue de fato montar sua rotina semanal após o onboarding.

---

## 2. Cenários de Usuário

- **P1 (crítico):** Como usuário, quero criar um novo treino dentro do meu programa — escolhendo exercícios do catálogo e definindo séries/reps/carga — para montar minha rotina semanal.
- **P1 (crítico):** Como usuário, quero editar um treino existente (adicionar/remover exercícios e séries, ajustar descanso e anotações), para evoluir minha rotina ao longo do tempo.
- **P2 (importante):** Como usuário, quero excluir um treino que não uso mais, para manter meu programa organizado.
- **P2 (importante):** Como usuário, quero anotar a técnica avançada de um exercício (ex: "drop set na última série", "bi-set com tríceps") em texto livre, para lembrar como executá-lo.
- **P3 (nice-to-have):** Como usuário, quero reordenar os exercícios de um treino por arrastar-e-soltar, para refletir a ordem real de execução.

> P1 = sem isso o produto não funciona. P2 = valor claro mas contornável. P3 = melhoria futura.

---

## 3. Requisitos Funcionais

- **FR-001:** Em `/program/[id]`, botão "Adicionar treino" navega para `/program/[id]/workout/novo`.
- **FR-002:** Builder de treino tem campos Nome (obrigatório) e Descrição (opcional).
- **FR-003:** Usuário adiciona exercícios via `ExercisePicker` (busca/filtro do catálogo); cada exercício adicionado aparece como bloco com nome/imagem/grupo muscular.
- **FR-004:** Cada bloco de exercício tem: Intervalo de descanso (`restSeconds`, padrão 90s) e campo de texto livre "Técnica/observações" (opcional — cobre drop set, bi-set, rest-pause, pirâmide etc., sem enum estruturado).
- **FR-005:** Cada bloco de exercício tem lista de séries (mín. 1): nº da série (automático pela posição), repetições alvo (`targetReps`, obrigatório, texto livre ex: "8-12"), carga alvo (`targetKg`, opcional, texto livre ex: "20").
- **FR-006:** Usuário adiciona/remove séries de um exercício (sempre ≥ 1 série).
- **FR-007:** Usuário remove um exercício do treino (sempre ≥ 1 exercício para salvar).
- **FR-008:** Usuário reordena exercícios via drag-and-drop (dnd-kit, mesmo padrão de `WorkoutDetailPage`); a nova ordem define `order` no submit.
- **FR-009:** Submit em modo criação chama `POST /workouts` com `order = strategy.workouts.length`; sucesso navega para `/program/[id]`.
- **FR-010:** Em `/program/[id]`, cada linha de treino tem menu "Editar"/"Excluir". Editar → `/workout/[id]/edit` (builder pré-preenchido via `GET /workouts/:id`, submit → `PATCH /workouts/:id`). Excluir → confirmação (`AlertDialog`) → `DELETE /workouts/:id`.
- **FR-011:** Erros de validação client-side (Zod) e de API (ex: `PLAN_LIMIT_EXCEEDED` 422 ao atingir 6 treinos) exibidos inline, sem perder valores preenchidos.
- **FR-012:** Botão "Salvar" mostra loading durante submit (padrão `StrategyFormDialog`).

> Cada FR deve ser independente e testável.

---

## 4. Fora do Escopo & Riscos

- **Fora do Escopo:** Modelagem estruturada de técnicas avançadas (enum `technique` + agrupamento bi-set/superset entre exercícios) — registrado como texto livre em `notes` por decisão desta sessão. Estruturação fica para task futura se necessário.
- **Fora do Escopo:** Reordenar **Workouts** dentro da Strategy (campo `order` do `Workout` em si) — apenas a ordem dos **exercícios dentro de um treino** está nesta spec.
- **Fora do Escopo:** Banner/UX proativa de limite do plano free (TASK10) — esta spec só trata o erro 422 já lançado pelo `CreateWorkoutUseCase`.
- **Fora do Escopo:** Qualquer mudança em `/exercises`, `/strategies` ou schema Prisma — endpoints e modelo de dados de TASK02/TASK03 são reutilizados sem alteração.
- **Premissa:** `/workouts` (TASK03) já implementa CRUD completo (`create/get/update/delete`) com `exercises[].plannedSets[]` e `validateExerciseIds` — confirmado em `create-workout.use-case.ts`/`update-workout.use-case.ts`. Nenhuma migration ou DTO novo é necessário.
- **Premissa:** `GET /exercises/:id` (TASK02) já existe para hidratar nome/imagem/grupo muscular dos exercícios selecionados.
- **Risco:** `react-hook-form` + `@hookform/resolvers` definidos em `decisions.md` mas nunca usados (`StrategyFormDialog` é manual) — primeira aplicação real, com `useFieldArray` aninhado (`exercises[].plannedSets[]`). → Mitigação: T2 isola schema/tipos/conversores antes do componente (T4); `StrategyFormDialog` não é alterado.
- **Risco:** sincronizar drag-and-drop (dnd-kit) com `useFieldArray.move()`. → Mitigação: `WorkoutDetailPage` já tem `DndContext`/`SortableContext` funcionando — replicar o padrão de `SortableExerciseBlock`.
- **Risco:** form grande (N exercícios × M séries) pode gerar re-renders custosos no RHF. → Mitigação: `useFieldArray` isolado por exercício + `Controller` nos inputs de série.

---

## 5. Contratos de API (todos pré-existentes, sem alterações)

- `POST /workouts` (TASK03)
  - **Request:** `CreateWorkoutDto { strategyId, name, description?, order, exercises: [{ exerciseId, order, restSeconds?, notes?, plannedSets: [{ setNumber, targetReps, targetKg? }] }] }`
  - **Response:** `WorkoutDetailDto` (201). 422 `PLAN_LIMIT_EXCEEDED` se tenant já tem 6 treinos.
- `GET /workouts/:id` (TASK03)
  - **Response:** `WorkoutDetailDto`
- `PATCH /workouts/:id` (TASK03)
  - **Request:** `UpdateWorkoutDto` (todos os campos de `CreateWorkoutDto` exceto `strategyId`, opcionais)
  - **Response:** `WorkoutDetailDto`
- `DELETE /workouts/:id` (TASK03)
  - **Response:** 204
- `GET /exercises/:id` (TASK02)
  - **Response:** `ExerciseDto` — usado para hidratar nome/imagem/grupos musculares no `ExercisePicker` e no modo edição.

---

## 6. Plano de Implementação (Tarefas)

### 6.1 Ordem de Execução & Dependências

| Onda | Tarefas | Agente(s) | Paralelo? |
|------|---------|-----------|-----------|
| 1 | T1, T2, T3 | frontend | sim |
| 2 | T4 | frontend | não |
| 3 | T5, T6 | frontend | sim |
| 4 | T7 | frontend | não |

```
Onda 1: T1 (frontend) | T2 (frontend) | T3 (frontend)   ← paralelo
Onda 2: T4 (frontend)
Onda 3: T5 (frontend) | T6 (frontend)   ← paralelo
Onda 4: T7 (frontend)
```

### Tarefa T1: Hooks de dados — Workout & Exercise
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T2, T3
- **Descrição:** Criar em `apps/web/src/lib/api/hooks/`, seguindo o padrão de `use-strategy.ts`/`use-create-strategy.ts`:
  - `use-workout.ts` → `useWorkout(id: string)`: `useQuery<WorkoutDetailDto>(["workout", id], () => apiFetch(\`/workouts/${id}\`))`.
  - `use-create-workout.ts` → `useCreateWorkout()`: `useMutation<WorkoutDetailDto, ApiClientError, CreateWorkoutDto>` → `POST /workouts`; `onSuccess` invalida `["strategy", data.strategyId]` e `["strategies"]`.
  - `use-update-workout.ts` → `useUpdateWorkout(id: string)`: `useMutation<WorkoutDetailDto, ApiClientError, UpdateWorkoutDto>` → `PATCH /workouts/${id}`; `onSuccess` invalida `["workout", id]` e `["strategy", data.strategyId]`.
  - `use-delete-workout.ts` → `useDeleteWorkout()`: `useMutation<void, ApiClientError, { id: string; strategyId: string }>` → `DELETE /workouts/${id}`; `onSuccess` invalida `["strategy", strategyId]`.
  - `use-exercise.ts` → `useExercise(id: string)`: `useQuery<ExerciseDto>(["exercise", id], () => apiFetch(\`/exercises/${id}\`), { enabled: !!id })`.
- **Critérios de Aceite:**
  - [ ] Os 5 hooks existem, tipados com DTOs de `@fitflow/types`.
  - [ ] `useCreateWorkout`/`useUpdateWorkout`/`useDeleteWorkout` invalidam as queries corretas no `onSuccess`.
  - [ ] Testes (MSW) cobrindo sucesso e erro 422 `PLAN_LIMIT_EXCEEDED` de `useCreateWorkout`.
- **Notas:** nenhum endpoint novo — todos já existem (TASK02/TASK03).

### Tarefa T2: Esquema de formulário (Zod + RHF) e conversores
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T1, T3
- **Descrição:** Instalar `react-hook-form` + `@hookform/resolvers` (primeira aplicação real do padrão de `decisions.md`). Criar `apps/web/src/lib/workout/workout-form.schema.ts`:
  - `plannedSetSchema`: `{ targetReps: string (min 1), targetKg?: string }` (`setNumber` derivado do índice).
  - `workoutExerciseSchema`: `{ exerciseId: string, restSeconds: number (default 90, min 0), notes?: string, plannedSets: plannedSetSchema[] (min 1), _exercise: ExerciseDto }` (`_exercise` é display-only).
  - `workoutFormSchema`: `{ name: string (min 1), description?: string, exercises: workoutExerciseSchema[] (min 1) }` → exporta `WorkoutFormValues = z.infer<typeof workoutFormSchema>`.
  - `toCreateWorkoutDto(values, strategyId, order): CreateWorkoutDto` e `toUpdateWorkoutDto(values): UpdateWorkoutDto` — computam `order`/`setNumber` pelo índice do array e removem `_exercise` do payload.
- **Critérios de Aceite:**
  - [ ] `react-hook-form` e `@hookform/resolvers` em `apps/web/package.json`.
  - [ ] `workoutFormSchema`/`WorkoutFormValues` exportados.
  - [ ] Testes unitários de `toCreateWorkoutDto`/`toUpdateWorkoutDto`: índice → `order`/`setNumber`, `_exercise` ausente no payload.
- **Notas:** técnicas avançadas (drop set, bi-set etc.) vivem em `notes` (texto livre) — sem enum, conforme decisão desta sessão.

### Tarefa T3: `ExercisePicker`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T1, T2
- **Descrição:** `apps/web/src/components/workout/ExercisePicker.tsx` — `Sheet` (já instalado em `components/ui/`) com busca por nome (debounce) + filtro simples por grupo muscular, reaproveitando `useExercises` (TASK08, `useInfiniteQuery`). Props: `open`, `onOpenChange`, `excludeIds?: string[]`, `onSelect(exercise: ExerciseDto)`.
- **Critérios de Aceite:**
  - [ ] Busca por nome com debounce (mesmo padrão de `ExercisesClientPage`).
  - [ ] Exercícios em `excludeIds` não aparecem na lista (evita duplicar exercício no treino).
  - [ ] Teste RTL: abrir picker, buscar, selecionar → `onSelect` chamado com o `ExerciseDto` correto.

### Tarefa T4: `WorkoutBuilder`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T2, T3
- **Paralelizável com:** —
- **Descrição:** `apps/web/src/components/workout/WorkoutBuilder.tsx` — form RHF+Zod (`workoutFormSchema`), `mode: "create" | "edit"`, `initialValues?: WorkoutFormValues`, `onSubmit`, `isLoading`, `submitError?`. Adaptado de `WorkoutDetailPage.tsx`:
  - Campos Nome (`Input`) / Descrição (`Textarea`).
  - `useFieldArray` para `exercises`; cada item renderiza `ExerciseBlock` (header com nome/imagem via `_exercise` + drag handle, `restSeconds`, textarea "Técnica/observações", tabela de séries via `useFieldArray` aninhado com adicionar/remover linha, botão remover exercício).
  - Reorder via `dnd-kit` (`DndContext`+`SortableContext`, padrão `SortableExerciseBlock`); `onDragEnd` chama `move()` do field array.
  - Botão "Adicionar exercício" abre `ExercisePicker` (T3, `excludeIds` = `exercises[].exerciseId` atuais); `onSelect` faz `append({ exerciseId, _exercise: exercise, restSeconds: 90, plannedSets: [{ targetReps: "", targetKg: "" }] })`.
  - `submitError` exibido inline, valores preservados (padrão `StrategyFormDialog`).
- **Critérios de Aceite:**
  - [ ] Não permite submit com 0 exercícios ou exercício com 0 séries (mensagens inline da Zod).
  - [ ] Adicionar/remover exercício e série refletem corretamente no payload final.
  - [ ] Drag-and-drop reordena exercícios e a nova ordem é usada no `order` do submit.
  - [ ] Teste RTL: fluxo de criação completo (nome → adicionar exercício via picker → preencher série → submit) chama `onSubmit` com o payload esperado.

### Tarefa T5: Rotas — criar/editar treino
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T1, T4
- **Paralelizável com:** T6
- **Descrição:**
  - `apps/web/src/app/program/[id]/workout/novo/page.tsx` (client): usa `useStrategy(strategyId)` para `order = strategy.workouts.length`; renderiza `WorkoutBuilder mode="create"`; `onSubmit` → `useCreateWorkout().mutateAsync(toCreateWorkoutDto(values, strategyId, order))`; sucesso → `router.push(\`/program/${strategyId}\`)`.
  - `apps/web/src/app/workout/[id]/edit/page.tsx` (client): `useWorkout(id)` para prefill — mapeia `WorkoutDetailDto` → `WorkoutFormValues`, hidratando `_exercise` via `useExercise`/`useQueries` para cada `exerciseId`; `WorkoutBuilder mode="edit"`; `onSubmit` → `useUpdateWorkout(id).mutateAsync(toUpdateWorkoutDto(values))`; sucesso → `router.push(\`/program/${workout.strategyId}\`)`.
  - Loading: skeleton enquanto `useWorkout`/`useExercise` carregam. 404 → `notFound()`.
- **Critérios de Aceite:**
  - [ ] `/program/[id]/workout/novo` cria treino e redireciona para `/program/[id]`, que passa a listar o novo treino.
  - [ ] `/workout/[id]/edit` carrega nome, descrição, exercícios, séries e notes corretamente no formulário.
  - [ ] Erro 422 `PLAN_LIMIT_EXCEEDED` exibido como mensagem amigável ("Limite de 6 treinos atingido").
  - [ ] Teste de integração (RTL+MSW) para os dois fluxos (criar e editar).

### Tarefa T6: `WorkoutOptionsMenu` + CTA "Adicionar treino"
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T1
- **Paralelizável com:** T5
- **Descrição:**
  - `apps/web/src/components/library/WorkoutOptionsMenu.tsx` (padrão `ProgramOptionsMenu`): `DropdownMenu` com "Editar" (`Link`/`router.push` → `/workout/[id]/edit`) e "Excluir" (`AlertDialog` de confirmação → `useDeleteWorkout()`).
  - Integrar no `WorkoutListRow.tsx` (menu ancorado à direita da linha).
  - Em `apps/web/src/app/program/[id]/page.tsx`, adicionar botão "Adicionar treino" ao lado do título "Treinos" (`Link` → `/program/[id]/workout/novo`).
- **Critérios de Aceite:**
  - [ ] Cada linha de treino em `/program/[id]` tem menu Editar/Excluir.
  - [ ] Excluir pede confirmação e, ao confirmar, remove o treino da lista (via invalidação de `["strategy", id]`).
  - [ ] Botão "Adicionar treino" visível e navega para `/program/[id]/workout/novo`.
  - [ ] Teste RTL: fluxo de exclusão (abrir menu → excluir → confirmar → item removido).

### Tarefa T7: Testes finais e fechamento
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T4, T5, T6
- **Paralelizável com:** —
- **Descrição:** Rodar `tsc`/`lint`/`jest` no monorepo; garantir cobertura mínima de `decisions.md` (componentes 70%, hooks/utils 90%) para `WorkoutBuilder`, `ExercisePicker`, `WorkoutOptionsMenu` e hooks novos.
- **Critérios de Aceite:**
  - [ ] `tsc`/`lint`/`jest` limpos.
  - [ ] Cobertura de `WorkoutBuilder`/`ExercisePicker`/`WorkoutOptionsMenu`/hooks atende aos mínimos de `decisions.md`.
  - [ ] `docs/context/product-backlog.md`: TASK09 marcado `done`.

---

<!--
GATE DE APROVAÇÃO
Revise as regras de negócio e as tarefas técnicas.
Se tudo estiver correto, altere o Status acima de "review" para "approved" para liberar os agentes de frontend/backend para iniciar a implementação.
-->
