# Plano Técnico: Modelagem de Dados — Identity, Catálogo e Training

**Spec:** `docs/specs/2026-06-01-data-model.md`
**Data:** 2026-06-02
**Escopo:** monorepo global
**Stack envolvida:** Prisma, PostgreSQL, NestJS (Clean Architecture), Next.js (NextAuth)

---

## Decisão Arquitetural: `packages/db`

O Prisma schema e o cliente ficam em `packages/db` — pacote compartilhado do monorepo. Motivo: tanto `apps/api` (NestJS — lógica de negócio) quanto `apps/web` (Next.js — NextAuth Prisma adapter) precisam do mesmo cliente Prisma apontando para o mesmo banco. Duplicar o schema criaria divergência garantida.

```
packages/db/
  prisma/
    schema.prisma    ← schema canônico
    migrations/      ← histórico de migrations
  src/
    index.ts         ← singleton PrismaClient + re-exports de tipos
  package.json
  tsconfig.json
```

---

## Ordem de Execução

```
Fase 1 (sequencial):  T-1 (packages/db + schema + migration)
Fase 2 (paralelo):    T-2 (entidades Identity) + T-3 (entidades Catalog) + T-4 (entidades Training)
Fase 3 (paralelo):    T-5 (interfaces Identity) + T-6 (interfaces Catalog) + T-7 (interfaces Training)
Fase 4 (paralelo):    T-8 (módulo Identity) + T-9 (módulo Catalog) + T-10 (módulo Training)
Fase 5 (sequencial):  T-11 (NextAuth adapter em apps/web)
```

---

## Tarefas

---

### Tarefa 1: `packages/db` — Prisma schema, client singleton e migration inicial
Tipo: chore
Agente: backend

Criar o pacote `packages/db` com o schema Prisma completo conforme spec, configurar o PrismaClient singleton e gerar a migration inicial.

**Estrutura de arquivos a criar:**

```
packages/db/
  package.json
  tsconfig.json
  prisma/
    schema.prisma
  src/
    index.ts
```

**`packages/db/package.json`:**
```json
{
  "name": "@fitflow/db",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0"
  },
  "devDependencies": {
    "prisma": "^6.0.0",
    "typescript": "^5.7.0"
  }
}
```

**`packages/db/prisma/schema.prisma`** — schema completo conforme spec `docs/specs/2026-06-01-data-model.md` (seção "Schema Prisma Completo"). Reproduzir integralmente incluindo todos os enums, models, `@@index`, `@@map`, `@@unique`, `onDelete` e a anotação `// Regra de negócio` no model `Workout`.

**`packages/db/src/index.ts`:**
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { PrismaClient };
export * from "@prisma/client";
```

O `globalThis` guard evita múltiplas instâncias do cliente durante hot-reload no Next.js dev server.

**Após criar os arquivos:**
1. Adicionar `"@fitflow/db": "workspace:*"` nas dependências de `apps/api/package.json` e `apps/web/package.json`
2. Adicionar `"@fitflow/db"` ao array `transpilePackages` em `apps/web/next.config.ts`
3. Rodar `pnpm install` na raiz
4. Rodar `pnpm --filter @fitflow/db db:generate` para gerar o cliente
5. Rodar `pnpm --filter @fitflow/db db:migrate:dev --name init` para criar a migration inicial

Critérios de aceite:
- [ ] `packages/db/prisma/schema.prisma` compila com `prisma validate` sem erros
- [ ] `prisma migrate dev --name init` gera SQL de migration sem erros
- [ ] Migration aplicada no banco de desenvolvimento (Railway ou local via Docker)
- [ ] `import { prisma } from "@fitflow/db"` resolve corretamente em `apps/api` e `apps/web`
- [ ] Todos os 16 models do spec estão presentes no schema

Notas: `DATABASE_URL` deve estar definida em `.env` na raiz do monorepo (ou em `packages/db/.env`). O Prisma CLI procura `.env` subindo da raiz do projeto.

---

### Tarefa 2: Identity — Entidades de domínio
Tipo: feature
Agente: backend

Criar entidades puras de domínio para o contexto Identity em `apps/api/src/identity/domain/`.
Sem imports de framework (zero NestJS, zero Prisma) — apenas TypeScript puro.

**Arquivos a criar:**

`apps/api/src/identity/domain/plan.enum.ts`
```typescript
export enum Plan {
  FREE = "FREE",
  PRO = "PRO",
}
```

`apps/api/src/identity/domain/relationship-status.enum.ts`
```typescript
export enum RelationshipStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  REVOKED = "REVOKED",
}
```

`apps/api/src/identity/domain/user.entity.ts`
```typescript
import { Plan } from "./plan.enum";

export interface IUserProps {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
  isTrainer: boolean;
  plan: Plan;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(private readonly props: IUserProps) {}

  get id() { return this.props.id; }
  get email() { return this.props.email; }
  get name() { return this.props.name; }
  get avatarUrl() { return this.props.avatarUrl; }
  get isTrainer() { return this.props.isTrainer; }
  get plan() { return this.props.plan; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  isFreePlan(): boolean {
    return this.props.plan === Plan.FREE;
  }
}
```

`apps/api/src/identity/domain/trainer-student-relationship.entity.ts`
```typescript
import { RelationshipStatus } from "./relationship-status.enum";

export interface ITrainerStudentRelationshipProps {
  id: string;
  trainerId: string;
  studentId: string;
  status: RelationshipStatus;
  startedAt: Date;
  endedAt?: Date | null;
}

export class TrainerStudentRelationship {
  constructor(private readonly props: ITrainerStudentRelationshipProps) {}

  get id() { return this.props.id; }
  get trainerId() { return this.props.trainerId; }
  get studentId() { return this.props.studentId; }
  get status() { return this.props.status; }
  get startedAt() { return this.props.startedAt; }
  get endedAt() { return this.props.endedAt; }

  isActive(): boolean {
    return this.props.status === RelationshipStatus.ACTIVE;
  }
}
```

Critérios de aceite:
- [ ] Nenhum import de framework (NestJS, Prisma, Express)
- [ ] `User.isFreePlan()` retorna `true` se `plan === Plan.FREE`
- [ ] `TrainerStudentRelationship.isActive()` retorna `true` se `status === ACTIVE`
- [ ] TypeScript compila sem erros

---

### Tarefa 3: Catalog — Entidades de domínio
Tipo: feature
Agente: backend

Criar entidades puras de domínio para o contexto Catalog em `apps/api/src/catalog/domain/`.

**Arquivos a criar:**

`apps/api/src/catalog/domain/exercise-category.enum.ts`
```typescript
export enum ExerciseCategory {
  STRENGTH = "STRENGTH",
  CARDIO = "CARDIO",
  FLEXIBILITY = "FLEXIBILITY",
  BALANCE = "BALANCE",
}
```

`apps/api/src/catalog/domain/muscle-group.entity.ts`
```typescript
export class MuscleGroup {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly slug: string,
  ) {}
}
```

`apps/api/src/catalog/domain/equipment.entity.ts`
```typescript
export class Equipment {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly slug: string,
  ) {}
}
```

`apps/api/src/catalog/domain/exercise.entity.ts`
```typescript
import { ExerciseCategory } from "./exercise-category.enum";
import { MuscleGroup } from "./muscle-group.entity";
import { Equipment } from "./equipment.entity";

export interface IExerciseProps {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  category: ExerciseCategory;
  isArchived: boolean;
  tenantId?: string | null;   // null = global, non-null = user-created
  muscleGroups: Array<{ muscleGroup: MuscleGroup; isPrimary: boolean }>;
  equipment: Equipment[];
  createdAt: Date;
  updatedAt: Date;
}

export class Exercise {
  constructor(private readonly props: IExerciseProps) {}

  get id() { return this.props.id; }
  get name() { return this.props.name; }
  get description() { return this.props.description; }
  get imageUrl() { return this.props.imageUrl; }
  get videoUrl() { return this.props.videoUrl; }
  get category() { return this.props.category; }
  get isArchived() { return this.props.isArchived; }
  get tenantId() { return this.props.tenantId; }
  get muscleGroups() { return this.props.muscleGroups; }
  get equipment() { return this.props.equipment; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  isGlobal(): boolean {
    return this.props.tenantId == null;
  }

  primaryMuscleGroups(): MuscleGroup[] {
    return this.props.muscleGroups
      .filter((m) => m.isPrimary)
      .map((m) => m.muscleGroup);
  }
}
```

Critérios de aceite:
- [ ] `Exercise.isGlobal()` retorna `true` quando `tenantId` é `null`
- [ ] `Exercise.primaryMuscleGroups()` retorna apenas os músculos com `isPrimary: true`
- [ ] Nenhum import de framework
- [ ] TypeScript compila sem erros

---

### Tarefa 4: Training — Entidades de domínio
Tipo: feature
Agente: backend

Criar entidades puras de domínio para o contexto Training em `apps/api/src/training/domain/`.

**Arquivos a criar:**

`apps/api/src/training/domain/workout-session-status.enum.ts`
```typescript
export enum WorkoutSessionStatus {
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
  ABANDONED = "ABANDONED",
}
```

`apps/api/src/training/domain/planned-set.value-object.ts`
```typescript
export interface IPlannedSetProps {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  targetReps: string;   // "10" | "8-12"
  targetKg?: string | null;   // "50" | "40-50"
}

export class PlannedSet {
  constructor(private readonly props: IPlannedSetProps) {}

  get id() { return this.props.id; }
  get setNumber() { return this.props.setNumber; }
  get targetReps() { return this.props.targetReps; }
  get targetKg() { return this.props.targetKg; }
}
```

`apps/api/src/training/domain/workout-exercise.entity.ts`
```typescript
import { PlannedSet } from "./planned-set.value-object";

export interface IWorkoutExerciseProps {
  id: string;
  workoutId: string;
  exerciseId: string;
  order: number;
  restSeconds: number;
  notes?: string | null;
  plannedSets: PlannedSet[];
}

export class WorkoutExercise {
  constructor(private readonly props: IWorkoutExerciseProps) {}

  get id() { return this.props.id; }
  get workoutId() { return this.props.workoutId; }
  get exerciseId() { return this.props.exerciseId; }
  get order() { return this.props.order; }
  get restSeconds() { return this.props.restSeconds; }
  get notes() { return this.props.notes; }
  get plannedSets() { return this.props.plannedSets; }
}
```

`apps/api/src/training/domain/workout.entity.ts`
```typescript
import { WorkoutExercise } from "./workout-exercise.entity";

export interface IWorkoutProps {
  id: string;
  strategyId: string;
  tenantId: string;
  name: string;
  description?: string | null;
  order: number;
  exercises: WorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
}

export class Workout {
  constructor(private readonly props: IWorkoutProps) {}

  get id() { return this.props.id; }
  get strategyId() { return this.props.strategyId; }
  get tenantId() { return this.props.tenantId; }
  get name() { return this.props.name; }
  get description() { return this.props.description; }
  get order() { return this.props.order; }
  get exercises() { return this.props.exercises; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }

  totalPlannedSets(): number {
    return this.props.exercises.reduce((sum, ex) => sum + ex.plannedSets.length, 0);
  }
}
```

`apps/api/src/training/domain/strategy.entity.ts`
```typescript
import { Workout } from "./workout.entity";

export interface IStrategyProps {
  id: string;
  tenantId: string;
  name: string;
  type?: string | null;
  description?: string | null;
  isActive: boolean;
  workouts: Workout[];
  createdAt: Date;
  updatedAt: Date;
}

export class Strategy {
  constructor(private readonly props: IStrategyProps) {}

  get id() { return this.props.id; }
  get tenantId() { return this.props.tenantId; }
  get name() { return this.props.name; }
  get type() { return this.props.type; }
  get description() { return this.props.description; }
  get isActive() { return this.props.isActive; }
  get workouts() { return this.props.workouts; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}
```

`apps/api/src/training/domain/executed-set.value-object.ts`
```typescript
export interface IExecutedSetProps {
  id: string;
  sessionExerciseId: string;
  setNumber: number;
  kg?: number | null;
  reps?: number | null;
  completedAt?: Date | null;
}

export class ExecutedSet {
  constructor(private readonly props: IExecutedSetProps) {}

  get id() { return this.props.id; }
  get setNumber() { return this.props.setNumber; }
  get kg() { return this.props.kg; }
  get reps() { return this.props.reps; }
  get completedAt() { return this.props.completedAt; }

  isCompleted(): boolean {
    return this.props.completedAt != null;
  }
}
```

`apps/api/src/training/domain/session-exercise.entity.ts`
```typescript
import { ExecutedSet } from "./executed-set.value-object";

export interface ISessionExerciseProps {
  id: string;
  sessionId: string;
  exerciseId: string;
  order: number;
  notes?: string | null;
  executedSets: ExecutedSet[];
}

export class SessionExercise {
  constructor(private readonly props: ISessionExerciseProps) {}

  get id() { return this.props.id; }
  get sessionId() { return this.props.sessionId; }
  get exerciseId() { return this.props.exerciseId; }
  get order() { return this.props.order; }
  get notes() { return this.props.notes; }
  get executedSets() { return this.props.executedSets; }

  completedSetsCount(): number {
    return this.props.executedSets.filter((s) => s.isCompleted()).length;
  }
}
```

`apps/api/src/training/domain/workout-session.entity.ts`
```typescript
import { WorkoutSessionStatus } from "./workout-session-status.enum";
import { SessionExercise } from "./session-exercise.entity";

export interface IWorkoutSessionProps {
  id: string;
  workoutId: string;
  tenantId: string;
  startedAt: Date;
  endedAt?: Date | null;
  comment?: string | null;
  difficulty?: number | null;
  status: WorkoutSessionStatus;
  exercises: SessionExercise[];
  createdAt: Date;
}

export class WorkoutSession {
  constructor(private readonly props: IWorkoutSessionProps) {}

  get id() { return this.props.id; }
  get workoutId() { return this.props.workoutId; }
  get tenantId() { return this.props.tenantId; }
  get startedAt() { return this.props.startedAt; }
  get endedAt() { return this.props.endedAt; }
  get comment() { return this.props.comment; }
  get difficulty() { return this.props.difficulty; }
  get status() { return this.props.status; }
  get exercises() { return this.props.exercises; }
  get createdAt() { return this.props.createdAt; }

  durationMs(): number | null {
    if (!this.props.endedAt) return null;
    return this.props.endedAt.getTime() - this.props.startedAt.getTime();
  }

  totalCompletedSets(): number {
    return this.props.exercises.reduce((sum, ex) => sum + ex.completedSetsCount(), 0);
  }

  isFinished(): boolean {
    return this.props.status === WorkoutSessionStatus.FINISHED;
  }
}
```

Critérios de aceite:
- [ ] `WorkoutSession.durationMs()` retorna `null` quando `endedAt` é null
- [ ] `WorkoutSession.totalCompletedSets()` agrega sets de todos os exercícios
- [ ] `ExecutedSet.isCompleted()` retorna `true` somente quando `completedAt` não é null
- [ ] `Workout.totalPlannedSets()` agrega sets de todos os exercícios planejados
- [ ] Nenhum import de framework
- [ ] TypeScript compila sem erros

---

### Tarefa 5: Identity — Interfaces de repositório
Tipo: feature
Agente: backend

Criar interfaces de repositório para Identity em `apps/api/src/identity/domain/repositories/`.
Interfaces definem o contrato — sem implementação Prisma aqui.

`apps/api/src/identity/domain/repositories/users.repository.interface.ts`
```typescript
import { User } from "../user.entity";

export interface IFindUserByIdOptions {
  id: string;
  tenantId?: string; // tenantId = userId — passado para consistência, validado na app layer
}

export interface IUsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: Omit<User["props"], "id" | "createdAt" | "updatedAt"> & { id?: string }): Promise<User>;
  update(id: string, data: Partial<Pick<User, "name" | "avatarUrl" | "isTrainer" | "plan">>): Promise<User>;
  countWorkouts(tenantId: string): Promise<number>;  // necessário para validar limite FREE
}
```

> Nota: `countWorkouts` está aqui porque a regra de limite FREE (6 workouts) precisa de uma query cross-repository que checa o tenant. Pode ser movida para `IWorkoutsRepository` se preferível — registrar decisão em `docs/context/decisions.md`.

`apps/api/src/identity/domain/repositories/trainer-student-relationship.repository.interface.ts`
```typescript
import { TrainerStudentRelationship } from "../trainer-student-relationship.entity";
import { RelationshipStatus } from "../relationship-status.enum";

export interface ITrainerStudentRelationshipRepository {
  findByTrainerAndStudent(trainerId: string, studentId: string): Promise<TrainerStudentRelationship | null>;
  findByStudent(studentId: string, status?: RelationshipStatus): Promise<TrainerStudentRelationship[]>;
  findByTrainer(trainerId: string, status?: RelationshipStatus): Promise<TrainerStudentRelationship[]>;
  create(trainerId: string, studentId: string): Promise<TrainerStudentRelationship>;
  updateStatus(id: string, status: RelationshipStatus): Promise<TrainerStudentRelationship>;
  trainerHasAccessToStudent(trainerId: string, studentId: string): Promise<boolean>;
}
```

Critérios de aceite:
- [ ] Nenhuma implementação concreta (apenas interfaces)
- [ ] `IUsersRepository.countWorkouts` presente para viabilizar validação de limite FREE
- [ ] `ITrainerStudentRelationshipRepository.trainerHasAccessToStudent` retorna `boolean` para uso em guards
- [ ] TypeScript compila sem erros

---

### Tarefa 6: Catalog — Interface de repositório
Tipo: feature
Agente: backend

`apps/api/src/catalog/domain/repositories/exercises.repository.interface.ts`
```typescript
import { Exercise } from "../exercise.entity";

export interface IFindExercisesOptions {
  tenantId: string;        // retorna globais (tenantId IS NULL) + customizados do tenant
  search?: string;
  muscleGroupSlug?: string;
  equipmentSlug?: string;
  category?: string;
  includeArchived?: boolean;
}

export interface IExercisesRepository {
  findMany(options: IFindExercisesOptions): Promise<Exercise[]>;
  findById(id: string): Promise<Exercise | null>;
  create(data: {
    name: string;
    description?: string;
    imageUrl?: string;
    videoUrl?: string;
    category: string;
    tenantId?: string;
    muscleGroupIds: Array<{ id: string; isPrimary: boolean }>;
    equipmentIds: string[];
  }): Promise<Exercise>;
  archive(id: string): Promise<void>;
}
```

Critérios de aceite:
- [ ] `findMany` sempre aplica `WHERE tenantId IS NULL OR tenantId = :tenantId` — exercícios de outros usuários nunca retornam
- [ ] Parâmetro `includeArchived` padrão `false` — arquivados excluídos por padrão
- [ ] TypeScript compila sem erros

---

### Tarefa 7: Training — Interfaces de repositório
Tipo: feature
Agente: backend

`apps/api/src/training/domain/repositories/strategies.repository.interface.ts`
```typescript
import { Strategy } from "../strategy.entity";

export interface IStrategiesRepository {
  findByTenant(tenantId: string): Promise<Strategy[]>;
  findById(id: string, tenantId: string): Promise<Strategy | null>;
  findActiveByTenant(tenantId: string): Promise<Strategy | null>;
  create(data: { tenantId: string; name: string; type?: string; description?: string }): Promise<Strategy>;
  setActive(id: string, tenantId: string): Promise<Strategy>;  // desativa todas as demais do tenant
  delete(id: string, tenantId: string): Promise<void>;
}
```

`apps/api/src/training/domain/repositories/workouts.repository.interface.ts`
```typescript
import { Workout } from "../workout.entity";

export interface IWorkoutsRepository {
  findByStrategy(strategyId: string, tenantId: string): Promise<Workout[]>;
  findById(id: string, tenantId: string): Promise<Workout | null>;
  countByTenant(tenantId: string): Promise<number>;  // para validar limite FREE (máx 6)
  create(data: {
    strategyId: string;
    tenantId: string;
    name: string;
    description?: string;
    order: number;
  }): Promise<Workout>;
  update(id: string, tenantId: string, data: Partial<Pick<Workout, "name" | "description" | "order">>): Promise<Workout>;
  delete(id: string, tenantId: string): Promise<void>;
}
```

`apps/api/src/training/domain/repositories/workout-sessions.repository.interface.ts`
```typescript
import { WorkoutSession } from "../workout-session.entity";
import { WorkoutSessionStatus } from "../workout-session-status.enum";

export interface IWorkoutSessionsRepository {
  findById(id: string, tenantId: string): Promise<WorkoutSession | null>;
  findByWorkout(workoutId: string, tenantId: string): Promise<WorkoutSession[]>;
  findLastByWorkout(workoutId: string, tenantId: string): Promise<WorkoutSession | null>;
  create(data: { workoutId: string; tenantId: string; startedAt: Date }): Promise<WorkoutSession>;
  finish(id: string, tenantId: string, data: { endedAt: Date; comment?: string; difficulty?: number }): Promise<WorkoutSession>;
  updateStatus(id: string, tenantId: string, status: WorkoutSessionStatus): Promise<WorkoutSession>;
}
```

Critérios de aceite:
- [ ] Todo método de leitura/escrita em Training recebe `tenantId` — queries sem ele não são permitidas
- [ ] `IWorkoutsRepository.countByTenant` viabiliza verificação de limite FREE antes de criar
- [ ] `IWorkoutSessionsRepository.findLastByWorkout` retorna a sessão mais recente finalizada (para mostrar "Anterior" na tela de execução)
- [ ] TypeScript compila sem erros

---

### Tarefa 8: Identity — Módulo NestJS + Prisma repositories
Tipo: feature
Agente: backend

Criar o módulo Identity em NestJS com as implementações Prisma dos repositórios e a configuração de DI.

**Arquivos a criar:**

`apps/api/src/identity/infra/repositories/prisma-users.repository.ts`
```typescript
import { Injectable } from "@nestjs/common";
import { prisma } from "@fitflow/db";
import { IUsersRepository } from "../../domain/repositories/users.repository.interface";
import { User } from "../../domain/user.entity";
import { Plan } from "../../domain/plan.enum";

@Injectable()
export class PrismaUsersRepository implements IUsersRepository {
  async findById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? this.toDomain(row) : null;
  }

  async create(data: Parameters<IUsersRepository["create"]>[0]): Promise<User> {
    const row = await prisma.user.create({ data });
    return this.toDomain(row);
  }

  async update(id: string, data: Parameters<IUsersRepository["update"]>[1]): Promise<User> {
    const row = await prisma.user.update({ where: { id }, data });
    return this.toDomain(row);
  }

  async countWorkouts(tenantId: string): Promise<number> {
    return prisma.workout.count({ where: { tenantId } });
  }

  private toDomain(row: { id: string; email: string; name: string; avatarUrl: string | null; isTrainer: boolean; plan: string; createdAt: Date; updatedAt: Date }): User {
    return new User({
      id: row.id,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatarUrl,
      isTrainer: row.isTrainer,
      plan: row.plan as Plan,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
```

`apps/api/src/identity/infra/repositories/prisma-trainer-student-relationship.repository.ts`
— implementar `ITrainerStudentRelationshipRepository` seguindo o mesmo padrão acima, usando `prisma.trainerStudentRelationship`.

`apps/api/src/identity/identity.module.ts`
```typescript
import { Module } from "@nestjs/common";
import { IUsersRepository } from "./domain/repositories/users.repository.interface";
import { ITrainerStudentRelationshipRepository } from "./domain/repositories/trainer-student-relationship.repository.interface";
import { PrismaUsersRepository } from "./infra/repositories/prisma-users.repository";
import { PrismaTrainerStudentRelationshipRepository } from "./infra/repositories/prisma-trainer-student-relationship.repository";

export const IUsersRepository = Symbol("IUsersRepository");
export const ITrainerStudentRelationshipRepository = Symbol("ITrainerStudentRelationshipRepository");

@Module({
  providers: [
    { provide: IUsersRepository, useClass: PrismaUsersRepository },
    { provide: ITrainerStudentRelationshipRepository, useClass: PrismaTrainerStudentRelationshipRepository },
  ],
  exports: [IUsersRepository, ITrainerStudentRelationshipRepository],
})
export class IdentityModule {}
```

Critérios de aceite:
- [ ] `PrismaUsersRepository.countWorkouts` usa `prisma.workout.count({ where: { tenantId } })`
- [ ] `PrismaTrainerStudentRelationshipRepository.trainerHasAccessToStudent` faz query com `status: ACTIVE` + `trainerId` + `studentId`
- [ ] Tokens de DI (`Symbol`) exportados do módulo para injeção nos use cases
- [ ] `IdentityModule` importável no `AppModule` sem erros

Notas: depende de T-1, T-2, T-5.

---

### Tarefa 9: Catalog — Módulo NestJS + Prisma repository
Tipo: feature
Agente: backend

`apps/api/src/catalog/infra/repositories/prisma-exercises.repository.ts`
— implementar `IExercisesRepository`. O método `findMany` deve gerar:
```sql
WHERE (tenantId IS NULL OR tenantId = :tenantId)
  AND isArchived = false  -- a menos que includeArchived = true
```

`apps/api/src/catalog/catalog.module.ts` — módulo com DI binding:
```typescript
{ provide: IExercisesRepository, useClass: PrismaExercisesRepository }
```

Critérios de aceite:
- [ ] `findMany` nunca retorna exercícios de outros tenants (cobre RF-005 da spec)
- [ ] `findMany` com `includeArchived: false` (padrão) exclui `isArchived = true`
- [ ] `create` com `tenantId: undefined` cria exercício global (admin)
- [ ] `archive` faz `prisma.exercise.update({ data: { isArchived: true } })` — sem delete físico

Notas: depende de T-1, T-3, T-6.

---

### Tarefa 10: Training — Módulo NestJS + Prisma repositories
Tipo: feature
Agente: backend

Implementar os três repositórios de Training e o módulo.

**`PrismaStrategiesRepository.setActive`** deve ser uma transação:
```typescript
async setActive(id: string, tenantId: string): Promise<Strategy> {
  return prisma.$transaction(async (tx) => {
    await tx.strategy.updateMany({ where: { tenantId }, data: { isActive: false } });
    const row = await tx.strategy.update({ where: { id }, data: { isActive: true } });
    return this.toDomain(row);
  });
}
```

**`PrismaWorkoutsRepository.create`** deve verificar o limite ANTES de inserir:
```typescript
async create(data): Promise<Workout> {
  const count = await prisma.workout.count({ where: { tenantId: data.tenantId } });
  // Lançar exceção de domínio — a validação real ocorre no use case; o repo é a segunda barreira
  if (count >= 6) {
    throw new Error("PLAN_LIMIT_EXCEEDED"); // substituir por exceção de domínio tipada
  }
  // ... prisma.workout.create(...)
}
```

> A validação primária de limite deve estar no use case (`CreateWorkoutUseCase`), não no repositório. O repositório faz uma segunda verificação como defesa em profundidade.

`apps/api/src/training/training.module.ts` — módulo com DI bindings para os três repositórios.

Critérios de aceite:
- [ ] `setActive` usa transação Prisma — nenhuma strategy ativa fica com `isActive = true` após a operação
- [ ] `countByTenant` retorna contagem correta
- [ ] `findLastByWorkout` usa `orderBy: { startedAt: "desc" }, take: 1` com filtro `status: FINISHED`
- [ ] `TrainingModule` importável no `AppModule` sem erros

Notas: depende de T-1, T-4, T-7.

---

### Tarefa 11: NextAuth Prisma Adapter em `apps/web`
Tipo: feature
Agente: frontend

Configurar o NextAuth com o Prisma adapter apontando para o banco via `@fitflow/db`.

**Dependências a adicionar em `apps/web`:**
```
@auth/nextjs
@auth/prisma-adapter
```

**`apps/web/src/lib/auth.ts`:**
```typescript
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@fitflow/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    // providers a configurar (Google, Credentials, etc.) — spec separada
  ],
  session: { strategy: "database" },
});
```

**`apps/web/src/app/api/auth/[...nextauth]/route.ts`:**
```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

Critérios de aceite:
- [ ] `PrismaAdapter(prisma)` usa o cliente de `@fitflow/db` (mesmo banco do API)
- [ ] Route handler `/api/auth/[...nextauth]` responde sem erro 500
- [ ] `auth()` em Server Components retorna a sessão ou `null`
- [ ] `User`, `Account`, `AuthSession`, `VerificationToken` do schema Prisma são compatíveis com o adapter (verificar campos obrigatórios do NextAuth)

Notas: depende de T-1. Providers (Google, Credentials) são configurados em spec separada de autenticação.

---

## Arquivos a criar/modificar

```
packages/db/
  package.json                                                        [novo]
  tsconfig.json                                                       [novo]
  prisma/schema.prisma                                                [novo]
  src/index.ts                                                        [novo]

apps/api/src/identity/domain/
  plan.enum.ts                                                        [novo]
  relationship-status.enum.ts                                         [novo]
  user.entity.ts                                                      [novo]
  trainer-student-relationship.entity.ts                              [novo]
  repositories/users.repository.interface.ts                          [novo]
  repositories/trainer-student-relationship.repository.interface.ts   [novo]

apps/api/src/identity/infra/repositories/
  prisma-users.repository.ts                                          [novo]
  prisma-trainer-student-relationship.repository.ts                   [novo]

apps/api/src/identity/
  identity.module.ts                                                  [novo]

apps/api/src/catalog/domain/
  exercise-category.enum.ts                                           [novo]
  muscle-group.entity.ts                                              [novo]
  equipment.entity.ts                                                 [novo]
  exercise.entity.ts                                                  [novo]
  repositories/exercises.repository.interface.ts                      [novo]

apps/api/src/catalog/infra/repositories/
  prisma-exercises.repository.ts                                      [novo]

apps/api/src/catalog/
  catalog.module.ts                                                   [novo]

apps/api/src/training/domain/
  workout-session-status.enum.ts                                      [novo]
  planned-set.value-object.ts                                         [novo]
  workout-exercise.entity.ts                                          [novo]
  workout.entity.ts                                                   [novo]
  strategy.entity.ts                                                  [novo]
  executed-set.value-object.ts                                        [novo]
  session-exercise.entity.ts                                          [novo]
  workout-session.entity.ts                                           [novo]
  repositories/strategies.repository.interface.ts                     [novo]
  repositories/workouts.repository.interface.ts                       [novo]
  repositories/workout-sessions.repository.interface.ts               [novo]

apps/api/src/training/infra/repositories/
  prisma-strategies.repository.ts                                     [novo]
  prisma-workouts.repository.ts                                       [novo]
  prisma-workout-sessions.repository.ts                               [novo]

apps/api/src/training/
  training.module.ts                                                  [novo]

apps/web/src/lib/
  auth.ts                                                             [novo]

apps/web/src/app/api/auth/[...nextauth]/
  route.ts                                                            [novo]

apps/api/package.json                                                 [modificar — adicionar @fitflow/db]
apps/web/package.json                                                 [modificar — adicionar @fitflow/db, @auth/nextjs, @auth/prisma-adapter]
apps/web/next.config.ts                                               [modificar — transpilePackages += @fitflow/db]
pnpm-workspace.yaml                                                   [verificar — packages/db deve estar incluído]
```
