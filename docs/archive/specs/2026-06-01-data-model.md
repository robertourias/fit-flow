# Spec: Modelagem de Dados — Identity, Catálogo e Training

**Status:** approved
**Data:** 2026-06-01
**Autor:** planner-agent

---

## Problema

O FitFlow não possui schema de banco de dados. Todo o produto roda hoje com mock data em memória, o que impede persistência real de usuários, treinos e sessões. Para avançar para autenticação, execução de treino real e histórico de progresso, é necessário definir e implementar o modelo relacional das três camadas centrais do domínio: **Identity** (quem é o usuário e seus papéis), **Catálogo** (biblioteca global + exercícios customizados) e **Training** (planejamento e execução de treinos).

Esta spec estabelece o contrato de dados que guiará todas as migrations, entidades de domínio e contratos de API subsequentes.

---

## Decisões de Levantamento

| Questão | Decisão |
|---------|---------|
| Perfis de usuário | Um usuário pode ser praticante e preparador simultaneamente — papel não é exclusivo |
| Catálogo de exercícios | Exercícios globais (criados por admin) + exercícios customizados por usuário (`tenantId` nullable) |
| Hierarquia de training | Estratégia → Treino → Exercício → Série planejada (`Routine` removida para reduzir volume de dados) |
| Sessão rastreável | Sessão executada sempre vinculada ao Treino planejado de origem |
| Propriedade do conteúdo | Estratégias e treinos pertencem ao aluno; preparador edita mas não é dono |
| Multi-tenancy | Tenant = usuário individual (`tenantId = userId`) |
| Vínculo preparador-aluno | Um aluno pode ter múltiplos preparadores simultâneos |
| Limite do plano gratuito | Máximo 6 `Workout` criados por usuário no plano FREE (enforçado na application layer) |

---

## Cenários de Usuário

- **P1 (crítico):** Como praticante, quero ter minha conta com perfil e papéis persistidos, para que minhas estratégias e sessões de treino sejam salvas entre dispositivos.
- **P1 (crítico):** Como praticante, quero criar estratégias e rotinas de treino associadas à minha conta, para organizar meu planejamento semanal.
- **P1 (crítico):** Como praticante, quero que cada sessão executada fique vinculada ao treino planejado, para consultar histórico e progressão de carga.
- **P1 (crítico):** Como praticante no plano gratuito, quero ser impedido de criar mais de 6 treinos, para que o sistema respeite os limites do meu plano.
- **P2 (importante):** Como praticante, quero criar exercícios customizados visíveis apenas para mim, para adaptar o catálogo às minhas necessidades.
- **P2 (importante):** Como preparador, quero vincular-me a um aluno e editar seus treinos, para oferecer orientação personalizada sem perder o histórico do aluno ao encerrar o vínculo.
- **P2 (importante):** Como aluno, quero poder ter múltiplos preparadores ativos ao mesmo tempo, para receber orientação de diferentes especialistas.
- **P3 (nice-to-have):** Como admin, quero gerenciar o catálogo global de exercícios (criar, editar, arquivar), para manter a biblioteca atualizada.

---

## Diagrama ER Textual

```
═══════════════════════════════════════════════════════════════════════════
IDENTITY
═══════════════════════════════════════════════════════════════════════════

  ┌──────────────────────────┐
  │          User            │
  │──────────────────────────│
  │ id          PK           │◄──────────────────────────────────────┐
  │ email       UNIQUE       │                                        │
  │ name                     │                                        │
  │ avatarUrl                │                                        │
  │ isTrainer   BOOL         │   ┌──────────────────────────────┐    │
  │ plan        FREE|PRO     │   │ TrainerStudentRelationship   │    │
  │ createdAt                │   │──────────────────────────────│    │
  │ updatedAt                │   │ id           PK              │    │
  └──────────────────────────┘   │ trainerId    FK → User       ├────┘
           │                     │ studentId    FK → User       ├────┐
           │ NextAuth            │ status       ENUM            │    │
           │                     │ startedAt                    │    │
  ┌────────┴────────────┐        │ endedAt                      │    │
  │      Account        │        │ UNIQUE(trainerId, studentId) │    │
  │ AuthSession         │        └──────────────────────────────┘    │
  │ VerificationToken   │                                             │
  └─────────────────────┘    ┌─────────────────────────────────┐     │
                              │          User (aluno)           │◄────┘
═══════════════════════════════════════════════════════════════════════════
CATÁLOGO
═══════════════════════════════════════════════════════════════════════════

  ┌──────────────────────┐      ┌───────────────────────────────────┐
  │     MuscleGroup      │      │            Exercise               │
  │──────────────────────│      │───────────────────────────────────│
  │ id        PK         │      │ id          PK                    │
  │ name                 │      │ name                              │
  │ slug      UNIQUE     │      │ description                       │
  └──────────────────────┘      │ imageUrl                          │
           │                    │ videoUrl                          │
           │ N                  │ category    ENUM                  │
  ┌────────┴────────────┐       │ isArchived  BOOL DEFAULT false    │
  │ ExerciseMuscleGroup │       │ tenantId    FK → User (nullable)  │──► User
  │ (exerciseId,        │◄──────│   NULL=global | non-null=custom   │
  │  muscleGroupId,     │       │ createdAt                         │
  │  isPrimary)         │       │ updatedAt                         │
  └─────────────────────┘       └───────────────────────────────────┘
                                          │
  ┌──────────────────────┐                │ N
  │      Equipment       │       ┌────────┴────────────┐
  │──────────────────────│       │  ExerciseEquipment  │
  │ id        PK         │       │ (exerciseId,        │
  │ name                 │       │  equipmentId)       │
  │ slug      UNIQUE     │◄──────┤                     │
  └──────────────────────┘       └─────────────────────┘

═══════════════════════════════════════════════════════════════════════════
TRAINING  (todas as entidades têm tenantId → User)
═══════════════════════════════════════════════════════════════════════════

  User (tenantId)
    │ 1
    │
    ▼ N
  ┌──────────────────────┐
  │       Strategy       │  isActive: apenas 1 ativa por tenant
  │──────────────────────│
  │ id         PK        │
  │ tenantId   FK→User   │
  │ name                 │
  │ type                 │  ex: "PPL", "ABC", "Upper/Lower"
  │ description          │
  │ isActive   BOOL      │
  └──────────────────────┘
    │ 1
    ▼ N
  ┌──────────────────────┐        ┌──────────────────────┐
  │       Workout        │        │    WorkoutExercise   │
  │──────────────────────│ 1    N │──────────────────────│
  │ id         PK        │───────►│ id           PK      │
  │ strategyId FK        │        │ workoutId    FK       │
  │ tenantId   FK→User   │        │ exerciseId   FK→Exer.│
  │ name                 │        │ order        INT     │
  │ description          │        │ restSeconds  INT     │
  │ order      INT       │        │ notes               │
  │ [MAX 6 / plano FREE] │        └──────────────────────┘
  └──────────────────────┘                  │ 1
    │ 1                                     ▼ N
    ▼ N                             ┌───────────────────┐
  ┌──────────────────────┐          │    PlannedSet     │
  │    WorkoutSession    │          │───────────────────│
  │──────────────────────│          │ id           PK   │
  │ id         PK        │          │ workoutExId  FK   │
  │ workoutId  FK────────┼──────────► setNumber    INT  │
  │ tenantId   FK→User   │          │ targetReps   TEXT │  "10" | "8-12"
  │ startedAt            │          │ targetKg     TEXT │  "50" | "40-50"
  │ endedAt              │          └───────────────────┘
  │ comment              │
  │ difficulty 1-5       │
  │ status     ENUM      │
  └──────────────────────┘
    │ 1
    ▼ N
  ┌──────────────────────┐
  │   SessionExercise    │
  │──────────────────────│
  │ id           PK      │
  │ sessionId    FK      │
  │ exerciseId   FK→Exer.│
  │ order        INT     │
  │ notes               │
  └──────────────────────┘
    │ 1
    ▼ N
  ┌──────────────────────┐
  │     ExecutedSet      │
  │──────────────────────│
  │ id                PK │
  │ sessionExerciseId FK │
  │ setNumber         INT│
  │ kg          DECIMAL  │
  │ reps        INT      │
  │ completedAt          │
  └──────────────────────┘
```

---

## Schema Prisma Completo

```prisma
// ─── Enums ────────────────────────────────────────────────────────────────────

enum Plan {
  FREE
  PRO
}

enum RelationshipStatus {
  PENDING
  ACTIVE
  REVOKED
}

enum ExerciseCategory {
  STRENGTH
  CARDIO
  FLEXIBILITY
  BALANCE
}

enum WorkoutSessionStatus {
  ACTIVE
  FINISHED
  ABANDONED
}

// ─── Identity ─────────────────────────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  name          String
  avatarUrl     String?
  isTrainer     Boolean   @default(false)
  plan          Plan      @default(FREE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // NextAuth
  accounts         Account[]
  authSessions     AuthSession[]

  // Catálogo — exercícios customizados criados pelo usuário
  customExercises  Exercise[] @relation("CustomExercises")

  // Training
  strategies       Strategy[]
  workouts         Workout[]
  workoutSessions  WorkoutSession[]

  // Vínculos preparador-aluno
  studentsAsTrainer TrainerStudentRelationship[] @relation("TrainerLinks")
  trainersAsStudent TrainerStudentRelationship[] @relation("StudentLinks")

  @@map("users")
}

// NextAuth — Account
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

// NextAuth — Session (auth session, não confundir com WorkoutSession)
model AuthSession {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("auth_sessions")
}

// NextAuth — VerificationToken
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

model TrainerStudentRelationship {
  id        String             @id @default(cuid())
  trainerId String
  studentId String
  status    RelationshipStatus @default(PENDING)
  startedAt DateTime           @default(now())
  endedAt   DateTime?

  trainer User @relation("TrainerLinks", fields: [trainerId], references: [id])
  student User @relation("StudentLinks", fields: [studentId], references: [id])

  @@unique([trainerId, studentId])
  @@index([trainerId])
  @@index([studentId])
  @@map("trainer_student_relationships")
}

// ─── Catálogo ─────────────────────────────────────────────────────────────────

model MuscleGroup {
  id        String @id @default(cuid())
  name      String
  slug      String @unique

  exercises ExerciseMuscleGroup[]

  @@map("muscle_groups")
}

model Equipment {
  id   String @id @default(cuid())
  name String
  slug String @unique

  exercises ExerciseEquipment[]

  @@map("equipment")
}

model Exercise {
  id          String           @id @default(cuid())
  name        String
  description String?
  imageUrl    String?
  videoUrl    String?
  category    ExerciseCategory @default(STRENGTH)
  isArchived  Boolean          @default(false)

  // NULL = exercício global (admin); non-null = customizado pelo usuário
  tenantId    String?
  tenant      User?            @relation("CustomExercises", fields: [tenantId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  muscleGroups     ExerciseMuscleGroup[]
  equipment        ExerciseEquipment[]
  workoutExercises WorkoutExercise[]
  sessionExercises SessionExercise[]

  @@index([tenantId])
  @@map("exercises")
}

model ExerciseMuscleGroup {
  exerciseId    String
  muscleGroupId String
  isPrimary     Boolean @default(false)

  exercise    Exercise    @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  muscleGroup MuscleGroup @relation(fields: [muscleGroupId], references: [id])

  @@id([exerciseId, muscleGroupId])
  @@map("exercise_muscle_groups")
}

model ExerciseEquipment {
  exerciseId  String
  equipmentId String

  exercise  Exercise  @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  equipment Equipment @relation(fields: [equipmentId], references: [id])

  @@id([exerciseId, equipmentId])
  @@map("exercise_equipment")
}

// ─── Training ─────────────────────────────────────────────────────────────────

model Strategy {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  type        String?
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant   User      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  workouts Workout[]

  @@index([tenantId])
  @@map("strategies")
}

// Regra de negócio: plano FREE limita 6 Workouts por tenantId (enforçado na application layer)
model Workout {
  id          String   @id @default(cuid())
  strategyId  String
  tenantId    String
  name        String
  description String?
  order       Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  strategy         Strategy          @relation(fields: [strategyId], references: [id], onDelete: Cascade)
  tenant           User              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  workoutExercises WorkoutExercise[]
  sessions         WorkoutSession[]

  @@index([tenantId])
  @@index([strategyId])
  @@map("workouts")
}

model WorkoutExercise {
  id          String  @id @default(cuid())
  workoutId   String
  exerciseId  String
  order       Int
  restSeconds Int     @default(90)
  notes       String?

  workout     Workout      @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  exercise    Exercise     @relation(fields: [exerciseId], references: [id])
  plannedSets PlannedSet[]

  @@index([workoutId])
  @@map("workout_exercises")
}

model PlannedSet {
  id                String  @id @default(cuid())
  workoutExerciseId String
  setNumber         Int
  targetReps        String  // "10" | "8-12"
  targetKg          String? // "50" | "40-50"

  workoutExercise WorkoutExercise @relation(fields: [workoutExerciseId], references: [id], onDelete: Cascade)

  @@index([workoutExerciseId])
  @@map("planned_sets")
}

model WorkoutSession {
  id         String               @id @default(cuid())
  workoutId  String
  tenantId   String
  startedAt  DateTime
  endedAt    DateTime?
  comment    String?
  difficulty Int?                 // 1-5, nullable
  status     WorkoutSessionStatus @default(ACTIVE)
  createdAt  DateTime             @default(now())

  workout          Workout          @relation(fields: [workoutId], references: [id])
  tenant           User             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  sessionExercises SessionExercise[]

  @@index([tenantId])
  @@index([workoutId])
  @@map("workout_sessions")
}

model SessionExercise {
  id         String  @id @default(cuid())
  sessionId  String
  exerciseId String
  order      Int
  notes      String?

  session      WorkoutSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  exercise     Exercise       @relation(fields: [exerciseId], references: [id])
  executedSets ExecutedSet[]

  @@index([sessionId])
  @@map("session_exercises")
}

model ExecutedSet {
  id                String    @id @default(cuid())
  sessionExerciseId String
  setNumber         Int
  kg                Decimal?  @db.Decimal(6, 2)
  reps              Int?
  completedAt       DateTime?

  sessionExercise SessionExercise @relation(fields: [sessionExerciseId], references: [id], onDelete: Cascade)

  @@index([sessionExerciseId])
  @@map("executed_sets")
}
```

---

## Requisitos Funcionais

- **FR-001:** Todo acesso a `Strategy`, `Workout`, `WorkoutSession` deve ser filtrado por `tenantId` — queries sem esse filtro são proibidas na camada de repositório.
- **FR-002:** Um preparador com `TrainerStudentRelationship.status = 'active'` pode ler e escrever nas entidades de Training cujo `tenantId` seja o `studentId` vinculado.
- **FR-003:** Encerrar um vínculo (`status = 'revoked'`) não remove nem transfere dados do aluno.
- **FR-004:** Ao criar um `Workout`, o use case deve contar todos os `Workout` do tenant (across all strategies). Se `User.plan = FREE` e contagem `>= 6`, retornar erro `PLAN_LIMIT_EXCEEDED` antes de persistir.
- **FR-005:** `Exercise.tenantId = NULL` → global (visível a todos). `Exercise.tenantId = userId` → customizado (visível apenas ao dono). Queries de catálogo filtram por `tenantId IS NULL OR tenantId = :currentUser`.
- **FR-006:** `WorkoutSession.workoutId` é `NOT NULL` — toda sessão deve referenciar um treino planejado.
- **FR-007:** `Exercise.isArchived = true` impede o exercício de aparecer em buscas, mas não invalida `WorkoutExercise` ou `SessionExercise` existentes.
- **FR-008:** A tabela de auth sessions do NextAuth usa o model `AuthSession` (mapeado para `auth_sessions`) para evitar conflito com `WorkoutSession`.
- **FR-009:** `PlannedSet.targetReps` e `PlannedSet.targetKg` são `String` para suportar ranges (ex: `"8-12"`, `"40-50"`) sem parse no banco; a application layer faz o parse ao calcular volume.

---

## Critérios de Sucesso

- [ ] Schema Prisma compila sem erros com todas as entidades e relações
- [ ] Migrations geradas e aplicadas em banco de desenvolvimento sem erros
- [ ] Query de sessão filtrando por `tenantId` retorna apenas registros daquele usuário
- [ ] Preparador vinculado (`ACTIVE`) consegue ler treino do aluno; não-vinculado recebe 403
- [ ] Revogar vínculo preparador-aluno não apaga nem transfere nenhum dado de Training
- [ ] Usuário FREE é impedido de criar o 7º `Workout` com erro `PLAN_LIMIT_EXCEEDED`
- [ ] Busca de exercícios retorna globais (`tenantId IS NULL`) + customizados do usuário logado
- [ ] `Exercise` arquivado não aparece em busca, mas `WorkoutExercise` e `SessionExercise` existentes permanecem íntegros
- [ ] Nenhuma entidade de Training pode ser criada sem `tenantId` válido

---

## Fora do Escopo

- Implementação de endpoints REST (spec separada por bounded context)
- Módulo de autenticação/autorização além do schema (NextAuth config, guards, JWT)
- Admin panel para gerenciar catálogo de exercícios
- Soft-delete generalizado além de `Exercise.isArchived`
- Versionamento de treinos (histórico de edições de `Workout`)
- Multi-tenant por organização/estúdio — apenas usuário individual nesta iteração
- Migração de dados mock para produção

---

## Riscos e Premissas

- **Premissa:** `tenantId = userId` — não existe entidade Tenant separada; `User.id` é a chave de isolamento em todas as tabelas de Training.
- **Premissa:** NextAuth Prisma adapter é base para `User` — `id` usa `cuid()` compatível com o adapter.
- **Premissa:** Limite de 6 workouts é por `Workout` total do tenant, independente de qual `Strategy` pertence.
- **Risco:** `Strategy.isActive` sem constraint de banco pode permitir múltiplas ativas → Mitigação: enforçar no use case + índice parcial `UNIQUE (tenantId) WHERE isActive = true` (PostgreSQL suporta).
- **Premissa:** Exercícios customizados usam `onDelete: Cascade` em `tenantId` — ao deletar a conta do usuário, seus exercícios customizados são removidos junto.
- **Risco:** `PlannedSet.targetReps` como `String` pode dificultar queries de volume → Mitigação: parsear na application layer; banco armazena valor original sem transformação.

---

<!--
GATE DE APROVAÇÃO
Para desbloquear a criação do plano técnico, altere o Status acima de "draft" para "approved".
O agente planner NÃO deve criar tasks de implementação enquanto Status for "draft".
-->
