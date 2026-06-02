# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-06-02
**Resumo da última sessão:** Spec de modelagem de dados aprovado e plano técnico executado completo (T-1 a T-11): `packages/db` com schema Prisma, migration inicial, entidades de domínio, interfaces de repositório, módulos NestJS com Prisma repos e NextAuth v5 configurado.

---

## Features implementadas

### Frontend — Dashboard, Exercícios, Biblioteca, Treino (apps/web)

#### Dashboard (`/dashboard`) — concluído
- Shell de navegação: Sidebar, TopBar, TopHeader, BottomNav
- Métricas, TreinoCard, ProgressChart (Recharts — lazy via next/dynamic), CalendarSection, UpcomingCard, MuscleCard
- Layouts responsivos: mobile / tablet / desktop

#### Exercícios (`/exercises`, `/exercises/[id]`) — concluído
- Lista: FilterBar horizontal com useDeferredValue + react-window (virtualização ≥30 itens)
- Grid 2-col mobile / 3-col desktop com ExerciseCard (React.memo)
- Detalhe: imagem + action bar + silhueta + detalhes + CTA

#### Biblioteca (`/library`) — concluído
- WorkoutCard e WorkoutListRow com React.memo + Link para `/workout/[id]`
- ViewToggle grade ↔ lista, LibraryPanel desktop

#### Treino — Detalhe e Execução — concluído
- `/workout/[id]` — WorkoutDetailPage: drag-and-drop @dnd-kit, tabela de séries
- `/workout/[id]/start` — WorkoutStartPreview: stats, última execução
- `/workout/[id]/session` — WorkoutActiveSession: timer, rest countdown, tabela Série/Anterior/Kg/Reps/✓
- `/workout/[id]/finish` — WorkoutFinishForm: textarea, dificuldade, toggles, CTA
- Store: `workout-session.store.ts` (Zustand + localStorage persist)

#### Performance (apps/web) — concluído
- recharts lazy-loaded via `ProgressChartClient` (next/dynamic, ssr: false)
- `ExerciseCard`, `WorkoutCard`, `WorkoutListRow` → React.memo
- `useDeferredValue` em ExercisesClientPage (search + filtered)
- react-window em lista de exercícios (FixedSizeList, threshold 30 itens)
- Bundle analyzer: `ANALYZE=true pnpm build`

---

### Backend — Data Model (packages/db + apps/api)

#### packages/db — concluído
- `prisma/schema.prisma` — 16 models, 4 enums, todos os @@index e @@map
- Migration inicial aplicada (`20260602204914_init`) no banco Docker (porta 5433)
- PrismaClient singleton exportado via `packages/db/src/index.ts`
- `packages/db/.env` — DATABASE_URL na porta 5433

#### apps/api — entidades e repositórios — concluído
**Identity** (`src/identity/domain/`):
- `User`, `TrainerStudentRelationship` entities + `Plan`, `RelationshipStatus` enums
- `IUsersRepository`, `ITrainerStudentRelationshipRepository` interfaces
- `PrismaUsersRepository`, `PrismaTrainerStudentRelationshipRepository`
- `IdentityModule` com tokens `USERS_REPOSITORY`, `TRAINER_STUDENT_RELATIONSHIP_REPOSITORY`

**Catalog** (`src/catalog/domain/`):
- `Exercise`, `MuscleGroup`, `Equipment` entities + `ExerciseCategory` enum
- `IExercisesRepository` interface
- `PrismaExercisesRepository` (findMany com OR tenantId NULL/tenant)
- `CatalogModule` com token `EXERCISES_REPOSITORY`

**Training** (`src/training/domain/`):
- `Strategy`, `Workout`, `WorkoutExercise`, `WorkoutSession`, `SessionExercise` entities
- `PlannedSet`, `ExecutedSet` value objects + `WorkoutSessionStatus` enum
- `IStrategiesRepository`, `IWorkoutsRepository`, `IWorkoutSessionsRepository`
- `PrismaStrategiesRepository` (setActive via $transaction), `PrismaWorkoutsRepository` (limit FREE plan), `PrismaWorkoutSessionsRepository`
- `TrainingModule` com tokens `STRATEGIES_REPOSITORY`, `WORKOUTS_REPOSITORY`, `WORKOUT_SESSIONS_REPOSITORY`

#### apps/web — auth — concluído
- `src/lib/auth.ts` — NextAuth v5 + PrismaAdapter + `@fitflow/db`
- `src/app/api/auth/[...nextauth]/route.ts` — route handler App Router
- Schema Prisma: `AuthSession` renomeado para `Session` (tabela `auth_sessions` inalterada)

---

## Tasks

### ✅ Concluídas (sessões 2026-06-01 e 2026-06-02)

**Frontend (web):**
- T-1 a T-9 do plano workout-detail (fluxo completo de execução de treino)
- Performance: React.memo, useDeferredValue, react-window, next/dynamic para recharts
- Fix webpack build: ProgressChartClient wrapper para ssr:false em Server Component

**Backend (data model):**
- T-1: packages/db (schema Prisma + migration + PrismaClient singleton)
- T-2: Identity domain entities
- T-3: Catalog domain entities
- T-4: Training domain entities
- T-5: Identity repository interfaces
- T-6: Catalog repository interface
- T-7: Training repository interfaces
- T-8: Identity NestJS module + Prisma repos
- T-9: Catalog NestJS module + Prisma repo
- T-10: Training NestJS module + Prisma repos
- T-11: NextAuth v5 + PrismaAdapter em apps/web

### 🔄 Em progresso
- (nenhuma — plano 2026-06-02-data-model.md concluído na íntegra)

### ⏭ Próximos passos
1. Spec + plano de autenticação — configurar providers NextAuth (Google, Credentials)
2. Spec + plano de API REST — endpoints para Identity, Catalog e Training (NestJS controllers, use cases, DTOs)
3. Conectar frontend ao backend — substituir mock data por chamadas API reais
4. Implementar páginas: Progresso (`/progress`), Explorar (`/explore`), Personal (`/personal`)
5. Criar rota `/program/[programId]` — `WorkoutFinishForm` redireciona para ela mas não existe

---

## Decisões desta sessão

- **`packages/db`** centraliza schema Prisma e cliente — compartilhado entre `apps/api` e `apps/web`
- **PostgreSQL porta 5433** — PostgreSQL nativo do Windows ocupava 5432; root `.env` define `POSTGRES_PORT=5433`
- **pg_hba.conf md5** — Docker container precisou ter `scram-sha-256` trocado para `md5` para Prisma conectar via TCP do host Windows
- **DI tokens como `USERS_REPOSITORY` (não `IUsersRepository`)** — evita colisão de nome entre interface TypeScript e constante Symbol no mesmo arquivo
- **`Session` no schema** (não `AuthSession`) — `@auth/prisma-adapter` usa `prisma.session` hardcoded; tabela DB permanece `auth_sessions` via `@@map`
- **TS2742 em next-auth v5 beta** — `auth` e `signIn` anotados como `any` em `auth.ts`; workaround para pnpm monorepo onde TypeScript não nomeia paths internos do pacote

---

## Bloqueadores / Perguntas abertas

- `WorkoutFinishForm` redireciona para `/program/[programId]` mas essa rota não existe ainda
- next-auth v5 ainda em beta — TS2742 workaround com `any` no `auth.ts`; remover quando beta estabilizar
- Backend (`apps/api`) não tem `AppModule` nem `main.ts` — necessário para iniciar a API
- Providers NextAuth não configurados — sem login funcional ainda
