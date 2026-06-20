# Spec: Fase 2 — Integração Frontend ↔ Backend (TASK04-07)

**Status:** approved
**Data:** 2026-06-11
**Autor:** Planner (IA)

---

## Problema

O frontend (Next.js) está com UIs estáticas usando dados mockados (`apps/web/src/lib/mock/*`), enquanto a API NestJS (Identity, Catalog, Training) já está implementada e testada (TASK01-03). É preciso conectar as telas existentes (Dashboard, Exercícios, Biblioteca) aos endpoints reais, implementar o wizard de onboarding (hoje placeholder) e criar a rota `/program/[id]` — destino do fluxo de finalização de treino e de gestão dos programas do usuário. Sem isso, o produto não tem fluxo E2E real (cadastro → onboarding → uso diário).

Este spec cobre as 4 tarefas da Fase 2 do backlog: **TASK04** (Dashboard), **TASK05** (Exercícios/Catálogo), **TASK06** (Onboarding) e **TASK07** (`/program/[id]` + `/library`).

---

## Cenários de Usuário

- **P1:** Como usuário recém-cadastrado, quero passar por um onboarding que colete meu perfil/objetivo e crie meu primeiro programa de treino, para não cair em telas vazias após o cadastro.
- **P1:** Como usuário logado, quero ver no Dashboard meus dados reais (treino de hoje, volume semanal, sequência de dias, calendário, grupos musculares), para acompanhar meu progresso de verdade.
- **P1:** Como usuário, quero navegar pela tela de Exercícios com filtros (grupo muscular, equipamento, tipo) usando o catálogo real, para encontrar exercícios.
- **P1:** Como usuário, ao salvar um treino finalizado, quero ser levado para a tela do meu programa (`/program/[id]`) com a lista real de treinos, para continuar minha rotina.
- **P2:** Como usuário, quero ver meus programas reais na Biblioteca (`/library`, aba "Programas"), para abrir e gerenciar cada um.
- **P2:** Como usuário, quero ativar/desativar ou excluir um programa em `/program/[id]`, para manter minha lista organizada.
- **P3:** Como usuário, quero ver o heatmap de grupos musculares trabalhados na semana, para identificar desequilíbrios de treino.

> P1 = sem isso o produto não funciona. P2 = valor claro mas contornável. P3 = melhoria futura.

---

## Requisitos Funcionais

### A. Infraestrutura de dados (compartilhado por TASK04-07)

- **FR-001:** Configurar `@tanstack/react-query` no `apps/web` (QueryClientProvider no root layout/providers), com `staleTime` padrão razoável (ex.: 30s) para evitar refetch excessivo.
- **FR-002:** Criar cliente HTTP tipado (`apps/web/src/lib/api/client.ts`) que: (a) lê a `baseURL` da API NestJS via `NEXT_PUBLIC_API_URL`; (b) injeta `Authorization: Bearer <token>` a partir da sessão NextAuth (JWT); (c) trata erros HTTP padronizando `{status, message}`. Usado por todos os hooks de query/mutation desta spec.
- **FR-003:** Tipos de DTO consumidos pelo frontend devem ser compartilhados via `packages/types` (ou replicados minimamente) para evitar drift entre API e Web — reaproveitar `PaginatedResponse<T>` já existente em `@fitflow/types`.

### B. TASK04 — Dashboard

- **FR-004:** Criar endpoint `GET /workout-sessions/summary` no `WorkoutSessionsController` (Training), **registrado antes** da rota `GET /workout-sessions/:id` (evitar colisão de rota — `summary` seria capturado por `:id`). Retorna `DashboardSummaryDto`:
  ```ts
  {
    diasEstaSemana: number;        // dias distintos (seg-dom corrente) com sessão status=FINISHED
    treinosNoMes: number;          // sessões FINISHED no mês corrente
    treinosNoMesDelta: number;     // treinosNoMes - total FINISHED no mês anterior
    diasSequencia: number;         // streak atual de dias consecutivos com sessão FINISHED (até hoje ou ontem)
    volumeSemanal: number;         // soma de (kg * reps) de executedSets em sessões FINISHED da semana corrente
    volumeData: { dia: "Seg"|"Ter"|"Qua"|"Qui"|"Sex"|"Sáb"|"Dom"; volume: number }[]; // 7 itens, semana corrente
    muscleGroups: { nome: string; percentual: number }[]; // distribuição % de sets executados por grupo muscular primário (semana corrente)
    trainDates: number[];          // dias (1-31) do mês corrente com sessão FINISHED
  }
  ```
  Todas as agregações são `tenantId`-scoped (usuário autenticado).

- **FR-005:** Criar endpoint `GET /strategies/active-workout` (ou reaproveitar `GET /strategies` + lógica no frontend — decisão de implementação livre no `/plan`) que retorna o "treino de hoje" e os "próximos treinos":
  - Considerar a Strategy com `isActive=true` mais recentemente atualizada (se houver mais de uma).
  - **Premissa (ver Riscos):** como `Workout` não tem dia da semana, "treino de hoje" = próximo `Workout` da Strategy ativa em rotação por `order`, calculado por `(total de sessões FINISHED da Strategy) % (quantidade de workouts da Strategy)`.
  - Retorno inclui: `{ estrategiaNome, workout: { id, nome, exercicios: string[] (nomes), order }, proximos: { id, nome, numExercicios, order }[] }` (2 próximos workouts em rotação).

- **FR-006:** Página `/dashboard` substitui todos os mocks (`mockMetrics`, `mockTreinoHoje`, `mockVolumeData`, `mockTreinoDates`, `mockMuscleGroups`, `mockUpcomingWorkouts`) pelos dados de `GET /workout-sessions/summary` + `GET /strategies/active-workout` + `GET /users/me` (para `DashboardUser`: nome, iniciais, email, plan).
- **FR-007:** Campo `planUsed`/`planLimit` do `DashboardUser`: `planLimit` fixo em 6 (regra atual do Prisma schema — "máx. 6 Workouts por tenant no plano FREE"); `planUsed` = contagem total de Workouts do usuário, incluído no `DashboardSummaryDto` como `workoutsCount`.
- **FR-008:** Estados de carregamento/erro/vazio: enquanto os hooks carregam, exibir skeletons nos componentes (`MetricsStrip`, `TreinoCard`, etc.); se usuário não tiver Strategy ativa (ex.: onboarding pulado/erro), `TreinoCard` exibe estado vazio com CTA para `/onboarding`.

### C. TASK05 — Exercícios / Catálogo

- **FR-009:** Criar hooks `useExercises(filters)`, `useMuscleGroups()`, `useEquipment()` que chamam `GET /exercises`, `GET /muscle-groups`, `GET /equipment` respectivamente.
- **FR-010:** Página `/exercises` substitui `mockExercises`, `muscleGroups`, `equipmentOptions`, `typeOptions`:
  - Filtro de grupo muscular → `muscleGroupSlug` (vindo de `GET /muscle-groups`, usar `slug`).
  - Filtro de equipamento → `equipmentSlug` (vindo de `GET /equipment`).
  - Filtro de tipo: "Força" → `category=STRENGTH`, "Cardio" → `category=CARDIO`, "Todos" → sem filtro. (Categorias `FLEXIBILITY`/`BALANCE` do enum não têm equivalente na UI atual — fora de escopo, não exibidas como opção de filtro.)
  - Busca por nome → `search`.
  - Lista paginada (`PaginatedResponse<ExerciseDto>`) — implementar paginação incremental ("carregar mais") ou infinite scroll, conforme padrão já usado em `ExercisesClientPage`.
- **FR-011:** Página `/exercises/[id]` busca via `GET /exercises/:id` (`useExercise(id)`); se 404, `notFound()`.
- **FR-012:** Mapear `ExerciseDto.muscleGroups[].isPrimary` para `primaryMuscles`/`secondaryMuscles` da UI atual (`Exercise.primaryMuscles`/`secondaryMuscles`).
- **FR-013:** `bookmarkCount` (mock atual, ex. "140k") não existe na API — remover esse elemento da UI ou substituir por placeholder fixo "—" (decisão de UI no `/plan`; não é dado real disponível).

### D. TASK06 — Onboarding

- **FR-014:** `/onboarding` vira wizard de 3 passos (client component, estado local com `useState`/`useReducer`):
  1. **Perfil**: campos `name` (pré-preenchido da sessão), `age`, `bio` (opcional).
  2. **Objetivo**: seleção (single ou multi-select) entre opções fixas — `["Hipertrofia", "Emagrecimento", "Performance", "Saúde/Condicionamento"]` — salvas em `goals: string[]`.
  3. **Primeiro programa**: usuário escolhe um split pré-definido e dá um nome ao programa (default = nome do split). Splits suportados (`type` da Strategy + nomes dos Workouts gerados, `order` 0..N-1):
     | Split (`type`) | Workouts gerados |
     |---|---|
     | `ABC` | Treino A, Treino B, Treino C |
     | `Upper/Lower` | Upper A, Lower A, Upper B, Lower B |
     | `PPL` | Push, Pull, Legs |
     | `Full Body` | Full Body A, Full Body B, Full Body C |

- **FR-015:** Ao concluir o wizard:
  1. `PATCH /users/me` com `{ name, age, bio, goals, hasOnboarded: true }` (ver FR-016/FR-017 para `hasOnboarded`).
  2. `POST /strategies` com `{ name, type: <split escolhido> }`.
  3. Para cada workout do split: `POST /workouts` com `{ strategyId, name, order, exercises: [] }` (ver FR-018 — `exercises` vazio).
  4. Em caso de falha em qualquer etapa, exibir erro e permitir retry (não navegar para `/dashboard`).
  5. Sucesso → atualizar sessão (FR-019) → `router.push("/dashboard")`.

- **FR-016:** Backend — adicionar campo opcional `hasOnboarded?: boolean` em `UpdateUserMeDto` e em `UpdateMeUseCase` (`apps/api/src/identity/application/{dto/update-user-me.dto.ts,use-cases/update-me.use-case.ts}`), permitindo `PATCH /users/me` marcar o onboarding como concluído.
- **FR-017:** Backend — relaxar `CreateWorkoutDto.exercises` (`apps/api/src/training/application/dto/workout.dto.ts`) removendo `@ArrayMinSize(1)`, permitindo array vazio (`exercises: []`) para suportar criação de Workouts "vazios" no onboarding. `CreateWorkoutUseCase` deve aceitar `exercises: []` sem erro.
- **FR-018:** Frontend — após `PATCH /users/me` com `hasOnboarded: true` ter sucesso, chamar `update({ hasOnboarded: true })` (NextAuth `useSession().update`) **antes** de navegar, para refletir o novo estado na sessão sem exigir novo login.
- **FR-019:** Backend (NextAuth) — `apps/web/src/lib/auth.ts`: tratar `trigger === "update"` no callback `jwt`, atualizando `token.hasOnboarded` a partir do `session` recebido (ou re-consultando `prisma.user.findUnique`), para que FR-018 funcione.
- **FR-020:** Middleware (`apps/web/src/middleware.ts`):
  - Se `session.user.hasOnboarded === false` e `pathname !== "/onboarding"` (e rota não-pública) → redirect para `/onboarding`.
  - Se `session.user.hasOnboarded === true` e `pathname === "/onboarding"` → redirect para `/dashboard`.

### E. TASK07 — `/program/[id]` + `/library`

- **FR-021:** `/library` (aba "Programas", `LibraryListPage`) substitui `mockLibraryPrograms` por `GET /strategies` (lista de `StrategySummaryDto`):
  - `routinesCount` = `strategy.workouts.length`.
  - `image`/`color`: como `Strategy` não tem esses campos, usar cor de fundo gerada deterministicamente a partir do `id` (ex.: hash → paleta fixa de cores) — sem imagem.
  - Card especial "Favoritos" (`isFavorites`) é **removido** (não há conceito de favorito em `Strategy` hoje — ver Fora do Escopo).
  - Abas "Rotinas" e "Exercícios" permanecem como placeholders (sem alteração).
- **FR-022:** Criar rota `/program/[id]/page.tsx` (substitui o atual placeholder que usa `mockPrograms`/`libraryTemplates` de `@/lib/mock/library`):
  - `GET /strategies/:id` → `StrategyDetailDto`. Se 404 ou não pertencer ao tenant (API já filtra por `tenantId`), `notFound()`.
  - Adapta `StrategyDetailDto` para o shape esperado por `LibraryClientPage`/`ProgramHeader`:
    - `tags`: gerar a partir de `[ "${workouts.length} treinos", strategy.type ?? "Personalizado" ]`.
    - `image`: mesma lógica de cor determinística do FR-021 (sem imagem real).
    - `workouts[].exercises` (contagem): `WorkoutDetailDto.exercises.length`.
  - `LibraryPanel` (templates da direita, `libraryTemplates` mock) **não é alterado** — fora de escopo (ver Fora do Escopo).
- **FR-023:** Em `/program/[id]`, o menu "Mais opções" (`ProgramHeader`, ícone `Ellipsis`) ganha ações:
  - **Ativar/Desativar**: `PATCH /strategies/:id` com `{ isActive: !current }`.
  - **Excluir**: `DELETE /strategies/:id` com confirmação (dialog), redireciona para `/library` em caso de sucesso.
- **FR-024:** `WorkoutCard`/`WorkoutListRow` em `/program/[id]` linkam para `/workout/[id]` usando o `id` real do `WorkoutSummaryDto` (já compatível — apenas trocar fonte de dados).
- **FR-025:** `WorkoutFinishForm.handleSave` (`apps/web/src/components/workout/WorkoutFinishForm.tsx`) hoje só faz `console.log` e `resetSession()`. Esta spec mantém esse comportamento de **persistência da sessão de treino fora de escopo** (ver Fora do Escopo) — apenas garante que `router.push(\`/program/${workout.programId}\`)` aponte para uma rota real e funcional (FR-022). `workout.programId` deve corresponder ao `strategyId` real.
- **FR-026:** Botões "Criar novo programa" (`/library`) e "Criar nova rotina" (`/program/[id]`) permanecem **não funcionais** (ou ocultos) nesta spec — CRUD completo de Strategy/Workout é TASK08/TASK09 (Fase 3).

---

## Critérios de Sucesso

- [ ] `/dashboard` não importa nenhum arquivo de `apps/web/src/lib/mock/dashboard.ts`; todos os widgets renderizam dados de `GET /workout-sessions/summary` e `GET /strategies/active-workout`.
- [x] `/exercises` e `/exercises/[id]` não importam `apps/web/src/lib/mock/exercises.ts`; filtros de grupo muscular/equipamento/tipo funcionam contra a API.
- [ ] Fluxo completo `/signup` → OTP → `/onboarding` (3 passos) → `/dashboard` funciona sem reload manual nem loop de redirect.
- [ ] Após onboarding, `GET /strategies` retorna 1 Strategy com os Workouts do split escolhido (sem exercícios).
- [ ] `/library` (aba Programas) lista as Strategies reais do usuário; clicar em um card abre `/program/[id]` com os Workouts reais.
- [ ] `/program/[id]` permite ativar/desativar e excluir o programa.
- [ ] Finalizar um treino (`/workout/[id]/finish`) redireciona para `/program/[id]` correspondente, página carrega sem erro.
- [ ] `pnpm lint` e `pnpm type-check` (ou equivalentes do monorepo) passam em `apps/web` e `apps/api`.

---

## Fora do Escopo

- Persistir a sessão de treino finalizada (`POST /workout-sessions` a partir de `WorkoutFinishForm`) — mantém `console.log` atual. Conectar isso é parte natural de **TASK11** (Execução de treino, Fase 4), embora o endpoint já exista.
- CRUD completo de Estratégia/Rotina/Treino (criar, editar, reordenar, selecionar exercícios em treinos existentes) — **TASK08/TASK09** (Fase 3).
- Seleção de exercícios dentro dos Workouts criados no onboarding — ficam com `exercises: []` até Fase 3.
- Enforce de limites do plano gratuito (máx. Workouts/Strategies) — **TASK10** (Fase 3).
- Conceito de "Favoritos"/bookmark de programas e de exercícios (`bookmarkCount`).
- Aba "Rotinas" e "Exercícios" da `/library`, e `LibraryPanel` (templates da direita) — seguem mockados/placeholder.
- Categorias de exercício `FLEXIBILITY`/`BALANCE` na UI de filtros.
- Integrações Strava/Health Connect no `WorkoutFinishForm` — seguem UI-only/desabilitadas.
- Cálculo de "duração estimada" do treino em `TreinoCard` — exibir placeholder ("—") se não houver dado real.

---

## Riscos e Premissas

- **Premissa:** "Treino de hoje" e "próximos treinos" (FR-005) usam rotação por `order` e contagem de sessões `FINISHED`, pois `Workout` não tem dia da semana associado. Isso pode não corresponder à expectativa de "rotina semanal fixa" do usuário. **Mitigação futura:** se necessário, Fase 3 (TASK09) pode adicionar campo de dia(s) da semana ao `Workout`.
- **Risco:** Relaxar `CreateWorkoutDto.exercises` (FR-017) para aceitar `[]` reduz a garantia de que todo Workout tenha pelo menos 1 exercício. **Mitigação:** documentar que Workout sem exercícios é um estado transitório válido (pós-onboarding, pré-Fase-3); `WorkoutDetailDto` já lida com `exercises: []` sem problema (apenas renderiza lista vazia).
- **Risco:** `session.update()` + `trigger === "update"` no NextAuth v5 (beta) já tem um workaround de tipos documentado em `apps/web/src/lib/auth.ts` (TS2742). FR-019 adiciona lógica ao callback `jwt` — validar que não quebra o workaround existente.
- **Premissa:** `image`/`tags`/cor determinística (FR-021/FR-022) são suficientes para a UI de "programa" sem precisar adicionar colunas em `Strategy`. Se o design exigir upload de capa, isso vira uma spec futura (Fase 3+).
- **Premissa:** `planLimit = 6` (FR-007) é a regra vigente (comentário no `schema.prisma` + TASK10). Caso `docs/context/domains/plans.md` ("máx. 2 programas, 4 treinos/programa") seja a regra correta e atualizada, **TASK10** deve reconciliar — fora de escopo desta spec, mas o campo `workoutsCount` no `DashboardSummaryDto` (FR-007) serve para qualquer uma das duas regras.
- **Risco:** Endpoint novo `GET /workout-sessions/summary` (FR-004) precisa de testes de integração (Supertest) cobrindo cálculo de streak/volume — escopo de implementação no `/plan`, mas aumenta o tamanho do PR de backend desta fase.

---

<!--
GATE DE APROVAÇÃO
Para desbloquear a criação do plano técnico, altere o Status acima de "draft" para "approved".
O agente planner NÃO deve criar tasks de implementação enquanto Status for "draft".
-->
