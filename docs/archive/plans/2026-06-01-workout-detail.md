# Plano Técnico: Página de Detalhe e Execução de Treino

**Spec:** `docs/specs/2026-06-01-workout-detail.md`
**Data:** 2026-06-01
**Escopo:** monorepo global (`apps/web`)
**Stack envolvida:** Next.js App Router, Zustand, @dnd-kit, Tailwind, mock data (sem backend)

---

## Estrutura de Rotas

Cada tela do fluxo tem URL própria para suportar navegação nativa do browser:

```
/workout/[id]         → Treino Detalhe (edição/visualização)
/workout/[id]/start   → Iniciar Treino (preview pré-execução)
/workout/[id]/session → Treino em Progresso (sessão ativa)
/workout/[id]/finish  → Finalizar Treino
```

---

## Contrato de Dados (Mock — sem API nesta iteração)

```typescript
// lib/mock/workout.ts

interface PlannedSet {
  setNumber: number;
  targetReps: number | string;  // ex: 10 | "8-15"
  targetKg?: number | string;   // ex: 50 | "40-50"
}

interface WorkoutExercise {
  id: string;
  name: string;
  muscleGroup: string;
  image: string;
  restSeconds: number;          // tempo de descanso padrão
  sets: PlannedSet[];
}

interface WorkoutDetail {
  id: string;                   // mesmo id de Workout.id
  name: string;
  programId: string;
  exercises: WorkoutExercise[];
}

// lib/stores/workout-session.store.ts

type SessionStatus = 'idle' | 'active' | 'finishing';

interface ExecutedSet {
  setNumber: number;
  kg?: number;
  reps?: number;
  completedAt?: Date;
}

interface ExecutedExercise {
  exerciseId: string;
  notes: string;
  sets: ExecutedSet[];
}

interface WorkoutSessionStore {
  status: SessionStatus;
  workoutId: string | null;
  startedAt: Date | null;
  currentExerciseIndex: number;
  exercises: ExecutedExercise[];
  restEndsAt: Date | null;        // timestamp do fim do descanso
  // actions
  startSession: (workoutId: string, exercises: WorkoutExercise[]) => void;
  completeSet: (exerciseIdx: number, setIdx: number, kg: number, reps: number) => void;
  setRestTimer: (endAt: Date) => void;
  clearRest: () => void;
  setCurrentExercise: (idx: number) => void;
  updateNote: (exerciseIdx: number, note: string) => void;
  beginFinishing: () => void;
  resetSession: () => void;
}
```

**Nota:** `restEndsAt` persistido em `localStorage` para reconstituir o timer se o usuário sair e voltar (mitiga risco identificado no spec).

---

## Tarefas

### Tarefa 1: Dependências
Tipo: chore
Agente: frontend

Instalar Zustand (estado da sessão) e dnd-kit (drag-and-drop de exercícios). Nenhuma das duas está no `apps/web/package.json` atual.

```
zustand
@dnd-kit/core
@dnd-kit/sortable
@dnd-kit/utilities
```

Critérios de aceite:
- [ ] `npm install` sem conflitos em `apps/web`
- [ ] `import { create } from 'zustand'` compila sem erro
- [ ] `import { DndContext } from '@dnd-kit/core'` compila sem erro

Notas: instalar em `apps/web`, não na raiz do monorepo.

---

### Tarefa 2: Mock data de treino
Tipo: feature
Agente: frontend

Criar `apps/web/src/lib/mock/workout.ts` com os tipos `PlannedSet`, `WorkoutExercise`, `WorkoutDetail` e os dados mock para os 6 treinos do `mockProgram` (A-LOWER-1 … F-OMBRO-BRACOS), reutilizando imagens já presentes em `library.ts` e `exercises.ts`. Incluir também `mockLastSession` para D-LOWER-2 com cargas anteriores de referência.

Critérios de aceite:
- [ ] Arquivo compila sem erros de TypeScript
- [ ] `mockWorkouts` é um `Record<string, WorkoutDetail>` com os 6 treinos
- [ ] Cada treino tem ao menos 3 exercícios com séries e cargas mock

Notas: os IDs dos treinos devem bater com os `workout.id` em `mockProgram` (ex: `"a-lower-1"`, `"d-lower-2"`).

---

### Tarefa 3: Workout session store (Zustand)
Tipo: feature
Agente: frontend

Criar `apps/web/src/lib/stores/workout-session.store.ts` com o store Zustand conforme contrato de dados acima. Persistir `restEndsAt` e `startedAt` em `localStorage` via `zustand/middleware persist`.

Critérios de aceite:
- [ ] `startSession` inicializa `exercisesState` vazio para cada exercício do treino
- [ ] `completeSet` adiciona/atualiza `ExecutedSet` e marca `completedAt`
- [ ] `restEndsAt` sobrevive a refresh de página (localStorage)
- [ ] `resetSession` limpa todo o state e o localStorage

Notas: depende da Tarefa 1 (Zustand instalado).

---

### Tarefa 4: Rotas e layout de treino
Tipo: feature
Agente: frontend

Criar estrutura de rotas:
- `app/workout/[id]/layout.tsx` — AppShell wrapper
- `app/workout/[id]/page.tsx` — server component → resolve `WorkoutDetail` por id → renderiza `WorkoutDetailPage`
- `app/workout/[id]/start/page.tsx` — server → renderiza `WorkoutStartPreview`
- `app/workout/[id]/session/page.tsx` — server → renderiza `WorkoutActiveSession`
- `app/workout/[id]/finish/page.tsx` — server → renderiza `WorkoutFinishForm`

Atualizar `AppShell.tsx`: `pathname.startsWith("/workout")` → `"biblioteca"`.

Critérios de aceite:
- [ ] `/workout/a-lower-1` abre sem erro 404
- [ ] Nav de biblioteca permanece ativo em todas as sub-rotas `/workout/*`
- [ ] `notFound()` disparado quando id não existe no mock

Notas: depende da Tarefa 2.

---

### Tarefa 5: Navegação dos cards para `/workout/[id]`
Tipo: feature
Agente: frontend

Converter `WorkoutCard.tsx` e `WorkoutListRow.tsx` de `div` para `Link` (`next/link`) apontando para `/workout/${workout.id}`. Manter estilo visual atual.

Critérios de aceite:
- [ ] Clicar no card navega para `/workout/[id]`
- [ ] Hover e foco funcionam corretamente no `Link`
- [ ] O botão `...` (more options) em `WorkoutListRow` não propaga o clique para o Link

Notas: independente das outras tarefas de componente. Pode ser feita em paralelo com T-4.

---

### Tarefa 6: Treino Detalhe — `WorkoutDetailPage`
Tipo: feature
Agente: frontend

Criar `components/workout/WorkoutDetailPage.tsx` (client component). Responsivo: mobile single-column, desktop 3 colunas (sidebar via AppShell + conteúdo central + painel direito 320px de sugestões).

**Subcomponentes:**
- `WorkoutDetailHeader` — nome, botão Salvar, menu `...`, botão Iniciar
- `ExerciseBlock` — linha colapsável: thumbnail + nome + grupo muscular + séries-reps + expand/collapse
  - Expandido: nota livre, config descanso, tabela `SetRow` (Set | Carga | Reps | RM), "+ Adicionar série"
- `SetRow` — linha editável da tabela de séries
- `AddExerciseButton` — rodapé da lista
- `SuggestionsPanel` — painel direito (desktop only), lista exercícios sugeridos por grupo muscular

**Drag-and-drop:** usar `@dnd-kit/sortable` na lista de `ExerciseBlock`.

Critérios de aceite:
- [ ] Lista de exercícios renderiza com dados do mock
- [ ] Expandir um exercício mostra tabela de séries com campos editáveis
- [ ] Adicionar/remover série atualiza state local
- [ ] Reordenar exercícios via drag-and-drop funciona em desktop e mobile
- [ ] Botão "Iniciar" navega para `/workout/[id]/start`
- [ ] Desktop mostra painel de sugestões à direita
- [ ] TypeScript compila sem erros

Notas: depende das Tarefas 1, 2, 4. Salvar não persiste em backend (apenas state local nesta iteração).

---

### Tarefa 7: Iniciar Treino — `WorkoutStartPreview`
Tipo: feature
Agente: frontend

Criar `components/workout/WorkoutStartPreview.tsx` (client component). Tela de pré-execução antes de iniciar o timer.

**Conteúdo:**
- Header: back arrow, nome do treino, ações
- Última execução: data + horário formatados
- Stats: total de séries + duração estimada (baseada em `sets × restSeconds` do mock)
- Lista de exercícios: thumbnail + nome + séries + reps + carga anterior (mock)
- CTA fixo no rodapé: "Iniciar Treino" (primary button)

**Ao clicar "Iniciar Treino":** chamar `store.startSession(workoutId, exercises)` → `router.push('/workout/[id]/session')`.

Critérios de aceite:
- [ ] Exibe dados da última execução do mock (`mockLastSession`)
- [ ] Stats de total de séries e duração calculados corretamente
- [ ] "Iniciar Treino" inicializa o store e navega para `/session`
- [ ] Layout mobile-first com CTA fixo no rodapé

Notas: depende das Tarefas 2, 3, 4.

---

### Tarefa 8: Treino em Progresso — `WorkoutActiveSession`
Tipo: feature
Agente: frontend

Criar `components/workout/WorkoutActiveSession.tsx` (client component). Tela mais complexa do fluxo.

**Subcomponentes:**
- `SessionTopBar` — timer (`useWorkoutTimer` hook), botão "Finalizar"
- `SessionProgressBar` — % séries concluídas / total
- `ActiveExerciseBlock`:
  - Nome + grupo muscular
  - Campo de notas
  - Label de descanso configurado
  - Tabela: `Série | Anterior | Kg | Reps | ✓`
  - "+ Adicionar série"
- `RestCountdown` — overlay ou barra quando `restEndsAt` ativo
- `NextExercisePreview` — rodapé com preview do próximo exercício

**Hook `useWorkoutTimer`:** `useInterval` interno para incrementar `elapsedSeconds`, recalcula a partir de `startedAt` na montagem (recuperação pós-refresh).

**Hook `useRestCountdown`:** calcula segundos restantes de `restEndsAt - now`, zera automaticamente ao expirar.

**Ao marcar série ✓:** `store.completeSet(...)` → `store.setRestTimer(new Date(Date.now() + restSeconds * 1000))`.

**Ao clicar "Finalizar":** `store.beginFinishing()` → `router.push('/workout/[id]/finish')`.

Critérios de aceite:
- [ ] Timer incrementa a cada segundo
- [ ] Timer sobrevive a refresh de página (reconstrói de `startedAt` no localStorage)
- [ ] Marcar série ✓ atualiza o estado e inicia o countdown de descanso
- [ ] Coluna "Anterior" exibe carga×reps da última sessão mock
- [ ] Séries marcadas exibem checkmark verde; pendentes exibem checkbox
- [ ] Barra de progresso reflete séries concluídas / total
- [ ] Next exercise preview aparece no rodapé
- [ ] TypeScript compila sem erros

Notas: depende das Tarefas 1, 2, 3, 4. Componente mais crítico — separar hooks em arquivos próprios em `features/workout/hooks/`.

---

### Tarefa 9: Finalizar Treino — `WorkoutFinishForm`
Tipo: feature
Agente: frontend

Criar `components/workout/WorkoutFinishForm.tsx` (client component). Formulário de encerramento da sessão.

**Campos:**
- Textarea "Como foi?" (comentário livre)
- Botão "Adicionar Fotos/Vídeos" (UI only, sem upload nesta iteração)
- Campos colapsáveis (accordion): data/hora de encerramento, duração calculada, tipo de treino, dificuldade (1-5)
- Toggle "Atualizar valores da rotina" (ativo por padrão)
- Seção "Integrações": toggles Strava e Health Connect (UI only)
- Botão "Salvar" (full width, primary)

**Ao clicar "Salvar":** logar sessão no console (sem API), chamar `store.resetSession()`, `router.push('/program/[programId]')`.

Critérios de aceite:
- [ ] Duração exibida é calculada de `startedAt` até agora
- [ ] Toggle "Atualizar valores" inicializa como ativo
- [ ] Salvar reseta o store e redireciona corretamente
- [ ] Layout com CTA fixo no rodapé (botão Salvar)

Notas: depende das Tarefas 3, 4.

---

## Ordem de Execução

```
Fase 1 (paralelo): T-1 (deps) + T-2 (mock data)
Fase 2 (paralelo): T-3 (store) + T-4 (rotas) + T-5 (nav links)
Fase 3 (sequencial): T-6 → T-7 → T-8 → T-9
```

---

## Arquivos a criar/modificar

```
apps/web/src/lib/mock/workout.ts                              [novo]
apps/web/src/lib/stores/workout-session.store.ts              [novo]
apps/web/src/app/workout/[id]/layout.tsx                      [novo]
apps/web/src/app/workout/[id]/page.tsx                        [novo]
apps/web/src/app/workout/[id]/start/page.tsx                  [novo]
apps/web/src/app/workout/[id]/session/page.tsx                [novo]
apps/web/src/app/workout/[id]/finish/page.tsx                 [novo]
apps/web/src/components/workout/WorkoutDetailPage.tsx         [novo]
apps/web/src/components/workout/WorkoutStartPreview.tsx       [novo]
apps/web/src/components/workout/WorkoutActiveSession.tsx      [novo]
apps/web/src/components/workout/WorkoutFinishForm.tsx         [novo]
apps/web/src/components/layout/AppShell.tsx                   [modificar]
apps/web/src/components/library/WorkoutCard.tsx               [modificar]
apps/web/src/components/library/WorkoutListRow.tsx            [modificar]
apps/web/package.json                                         [modificar]
```
