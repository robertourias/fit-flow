# Spec & Plan: TASK17 — Área do Preparador: Alunos

**Status:** approved
**Data:** 2026-06-17
**Autor:** Planner (IA)

---

## 1. Problema e Visão Geral

FitFlow ainda não materializa o bounded context **Coaching** previsto no roadmap (Fase 8). O modelo de dados (`TrainerStudentRelationship`, `User.isTrainer`) e o repositório (`ITrainerStudentRelationshipRepository` + `PrismaTrainerStudentRelationshipRepository`) já existem desde a fundação (TASK00-F), mas não há use-cases, endpoints nem telas. Hoje nenhum usuário consegue: tornar-se preparador, vincular-se a um aluno/preparador, o preparador não consegue criar/atribuir rotina a um aluno nem acompanhar a evolução dele.

Esta spec cobre o núcleo do Coaching: vínculo aluno↔preparador (convite/aceite/recusa/revogação, podendo ser iniciado por qualquer um dos lados), criação/atribuição de rotina (Strategy + Workout) pelo preparador em nome do aluno, e visualização do dashboard de progresso do aluno pelo preparador. Comunicação (orientações, moderação, notificações BullMQ) é TASK18 (Fase 9) e não entra aqui.

---

## 2. Cenários de Usuário

- **P1 (crítico):** Como usuário, quero marcar minha conta como preparador, para poder oferecer acompanhamento a alunos.
- **P1 (crítico):** Como preparador, quero convidar um aluno pelo email dele, para iniciar o vínculo.
- **P1 (crítico):** Como aluno, quero convidar um preparador pelo email dele, para iniciar o vínculo quando for eu quem procura orientação.
- **P1 (crítico):** Como usuário convidado (preparador ou aluno), quero aceitar ou recusar um convite pendente, para controlar quem tem acesso aos meus dados.
- **P1 (crítico):** Como preparador, quero ver a lista dos meus alunos (ativos e pendentes), para gerenciar meus vínculos.
- **P1 (crítico):** Como preparador, quero criar e atribuir uma rotina (estratégia + treinos) a um aluno vinculado, para orientar o treino dele.
- **P2 (importante):** Como preparador, quero ver o dashboard de progresso (volume, duração, dias treinados, grupos musculares, heatmap) de um aluno vinculado, para acompanhar a evolução dele.
- **P2 (importante):** Como usuário (preparador ou aluno), quero revogar um vínculo ativo, para encerrar o acompanhamento quando necessário.
- **P3 (nice-to-have):** Como aluno, quero ver quem são meus preparadores ativos, para saber quem tem acesso aos meus dados.

> P1 = sem isso o produto não funciona. P2 = valor claro mas contornável. P3 = melhoria futura.

---

## 3. Requisitos Funcionais

- **FR-001:** Usuário pode alternar `isTrainer` no próprio perfil (`PATCH /users/me`). Não há aprovação/verificação externa nesta fase.
- **FR-002:** Vínculo só pode ser criado entre dois usuários onde exatamente um tem `isTrainer = true` e o outro `isTrainer = false` no momento da criação. Caso contrário, `400 Bad Request`.
- **FR-003:** Qualquer um dos dois lados pode iniciar o convite informando o email do outro. O lado que **não** iniciou é quem pode aceitar/recusar.
- **FR-004:** Convite duplicado (mesmo par trainerId/studentId) com vínculo já `PENDING` ou `ACTIVE` retorna o vínculo existente (idempotente, `200`) em vez de erro de conflito.
- **FR-005:** Não é permitido criar vínculo consigo mesmo (`targetEmail` = email do próprio usuário) → `400`.
- **FR-006:** Apenas o destinatário do convite (lado que não iniciou) pode `ACCEPT` ou `REJECT` um vínculo `PENDING`. Tentativa pelo lado iniciador → `403`.
- **FR-007:** `ACCEPT` muda status para `ACTIVE`. `REJECT` e `REVOKE` mudam status para `REVOKED` e preenchem `endedAt`. `REVOKE` só é permitido em vínculo `ACTIVE`, por qualquer um dos dois lados.
- **FR-008:** Isolamento de dados (já registrado em `docs/context/domains/auth.md`): toda leitura/escrita de um preparador sobre dados de um aluno exige vínculo `ACTIVE` entre os dois — verificado via `trainerHasAccessToStudent(trainerId, studentId)` antes de qualquer operação. Caso não exista vínculo ativo → `404` (não `403`, para não confirmar existência do recurso).
- **FR-009:** Preparador com vínculo `ACTIVE` pode criar Strategy e Workout em nome do aluno. As regras já existentes (limite plano FREE: 6 treinos/tenant) se aplicam ao `tenantId` do **aluno**, não do preparador.
- **FR-010:** Preparador com vínculo `ACTIVE` pode visualizar o `DashboardSummaryDto` (mesmo formato do TASK13) do aluno.
- **FR-011:** Listagem de alunos (`GET /coaching/students`) e de preparadores (`GET /coaching/trainers`) aceita filtro opcional `status` (`PENDING` | `ACTIVE` | `REVOKED`); sem filtro retorna todos exceto `REVOKED`.

---

## 4. Fora do Escopo & Riscos

- **Fora do Escopo:**
  - Comunicação preparador→aluno, moderação de conteúdo, notificações BullMQ (TASK18/Fase 9).
  - Preparador visualizar medidas corporais do aluno (pode reaproveitar o mesmo padrão de acesso no futuro).
  - Limite de número de alunos por preparador (não há regra de negócio definida para isso).
  - Verificação/certificação de preparador (qualquer usuário pode marcar `isTrainer = true`).
  - Preparador editar rotinas já existentes do aluno (somente criação nesta fase — edição reaproveita endpoints existentes de `/strategies` e `/workouts` em iteração futura).
- **Premissa:** `findByEmail` em `IUsersRepository` e os use-cases de Strategy/Workout/Dashboard já aceitam `tenantId` explícito (confirmado em código) — Coaching reaproveita-os sem alterá-los.
- **Risco:** Vínculo circular (A treina B e B treina A simultaneamente) é possível se ambos alternarem `isTrainer` em momentos diferentes. → Mitigação: aceitar como edge case de baixo impacto nesta fase; revisar se houver abuso.
- **Risco:** Condição de corrida em convites simultâneos dos dois lados (`unique[trainerId, studentId]`). → Mitigação: tratar erro `P2002` do Prisma na criação como "retornar vínculo existente" (mesma resposta do FR-004).

---

## 5. Contratos de API

### Vínculo (Identity + Coaching)

- `PATCH /users/me`
  - **Request:** `{ isTrainer?: boolean, ...campos já existentes }`
  - **Response:** `UserMeDto` (já existente, sem mudança de forma)

- `POST /coaching/relationships`
  - **Request:** `{ targetEmail: string }`
  - **Response:** `RelationshipDto { id, trainerId, trainerName, studentId, studentName, status, initiatedBy, startedAt, endedAt }`
  - Erros: `400` (regra FR-002/FR-005), `404` (email não encontrado)

- `GET /coaching/students?status=`
  - **Response:** `RelationshipDto[]` (current user = trainerId)

- `GET /coaching/trainers?status=`
  - **Response:** `RelationshipDto[]` (current user = studentId)

- `PATCH /coaching/relationships/:id`
  - **Request:** `{ action: "ACCEPT" | "REJECT" | "REVOKE" }`
  - **Response:** `RelationshipDto`
  - Erros: `403` (FR-006), `404` (vínculo não encontrado ou usuário não participa dele), `409` (transição inválida, ex. `ACCEPT` em vínculo já `ACTIVE`)

### Rotina & Progresso do Aluno (Coaching → reaproveita Training)

- `GET /coaching/students/:studentId/dashboard`
  - **Response:** `DashboardSummaryDto` (mesma forma do TASK13)
  - Erros: `404` se não houver vínculo `ACTIVE`

- `POST /coaching/students/:studentId/strategies`
  - **Request:** `CreateStrategyDto` (igual `/strategies`)
  - **Response:** `StrategySummaryDto`

- `POST /coaching/students/:studentId/workouts`
  - **Request:** `CreateWorkoutDto` (igual `/workouts`, com `strategyId` da estratégia do aluno)
  - **Response:** `WorkoutDetailDto`
  - Erros: `404` sem vínculo ativo, `403` limite do plano FREE do aluno (reaproveita exceção já existente)

---

## 6. Plano de Implementação (Tarefas)

### Ordem de Execução & Dependências

| Onda | Tarefas (paralelas) | Pré-requisito |
|------|---------------------|----------------|
| 1    | T1                  | —              |
| 2    | T2                  | T1             |
| 3    | T3, T5              | T2             |
| 4    | T4, T6              | T3             |
| 5    | T7                  | T4, T6         |

> T5 (toggle `isTrainer` no frontend) só depende do contrato `PATCH /users/me` (T1), por isso entra na onda 3 junto com T3, em paralelo. T6 (hooks de frontend) depende do contrato definido em T2/T3 mas não da implementação do controller — os mocks seguem o padrão já usado nos testes (jest.mock nos hooks, sem MSW). T4 (controllers) e T6 podem rodar em paralelo desde que ambos só leiam os contratos desta spec.

### Tarefa 1: Migration + Domínio do vínculo
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** — (nenhuma)
- **Paralelizável com:** nenhuma
- **Descrição:** Adicionar enum `RelationshipInitiator { TRAINER, STUDENT }` e coluna `initiatedBy` (não-nula) em `TrainerStudentRelationship` no `packages/db/prisma/schema.prisma` + migration. Atualizar `apps/api/src/identity/domain/trainer-student-relationship.entity.ts` (prop `initiatedBy`, getter, método `wasInitiatedBy(userId: string): boolean`), `relationship-status.enum.ts`/novo `relationship-initiator.enum.ts`, `ITrainerStudentRelationshipRepository` (adicionar `findById(id): Promise<TrainerStudentRelationship | null>`, ajustar `create(trainerId, studentId, initiatedBy)`), `PrismaTrainerStudentRelationshipRepository` e `IUsersRepository`/`UpdateUserMeDto`/`UpdateMeUseCase`/`User` entity para permitir `isTrainer` opcional no update de perfil.
- **Critérios de Aceite:**
  - [x] Migration aplica limpo (`prisma migrate dev`), `initiatedBy` obrigatório no `create()`.
  - [x] `findById` retorna `null` para id inexistente.
  - [x] `PATCH /users/me` com `{ isTrainer: true }` persiste e retorna no `UserMeDto`.
  - [x] Testes unitários de entidade e repositório cobrindo os novos campos/métodos.

### Tarefa 2: Use-cases de vínculo (Coaching)
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** T1
- **Paralelizável com:** nenhuma
- **Descrição:** Criar módulo `apps/api/src/coaching` (`coaching.module.ts` importando `IdentityModule`). Implementar use-cases: `InviteRelationshipUseCase` (FR-002/004/005, captura `P2002` → idempotência), `RespondRelationshipUseCase` (action ACCEPT/REJECT, FR-006/007), `RevokeRelationshipUseCase` (FR-007), `ListMyStudentsUseCase`, `ListMyTrainersUseCase`. DTO `RelationshipDto` com `fromEntity` (precisa nome/email do outro lado — usar `IUsersRepository.findById` ou join no repositório).
- **Critérios de Aceite:**
  - [x] Convite entre dois `isTrainer=true` (ou ambos `false`) retorna `400`.
  - [x] Convite duplicado retorna o vínculo existente sem erro.
  - [x] `ACCEPT`/`REJECT` pelo lado iniciador retorna `403`.
  - [x] Testes unitários cobrindo todas as regras FR-002 a FR-007.

### Tarefa 3: Use-cases de rotina/progresso do aluno (Coaching)
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** T2
- **Paralelizável com:** nenhuma (mesmo módulo `coaching.module.ts` que T2)
- **Descrição:** No mesmo módulo `coaching`, importar `TrainingModule` (exportar `CreateStrategyUseCase`, `CreateWorkoutUseCase`, `GetDashboardSummaryUseCase` se ainda não exportados). Implementar `CreateStudentStrategyUseCase`, `CreateStudentWorkoutUseCase`, `GetStudentDashboardUseCase` — todos chamam primeiro `trainerHasAccessToStudent(trainerId, studentId)` (lança `NotFoundException` se `false`, FR-008) e então delegam ao use-case de Training correspondente passando `studentId` como `tenantId`.
- **Critérios de Aceite:**
  - [x] Sem vínculo ativo → `404` em qualquer uma das 3 operações.
  - [x] Com vínculo ativo, Strategy/Workout criados ficam com `tenantId = studentId`.
  - [x] Limite do plano FREE do aluno é respeitado (reaproveita exceção existente).
  - [x] Testes unitários com repositório de relacionamento mockado.

### Tarefa 4: Controllers + DTOs + Swagger (Coaching)
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** T3
- **Paralelizável com:** T6
- **Descrição:** `CoachingController` expondo os 7 endpoints da Seção 5 (`/coaching/relationships`, `/coaching/students`, `/coaching/trainers`, `/coaching/students/:studentId/dashboard`, `/coaching/students/:studentId/strategies`, `/coaching/students/:studentId/workouts`). DTOs de request (`InviteRelationshipDto`, `RespondRelationshipDto`) com `class-validator`. Testes de integração (Supertest) cobrindo o fluxo completo: convite → aceite → criação de rotina → leitura de dashboard.
- **Critérios de Aceite:**
  - [x] Todos os endpoints documentados no Swagger.
  - [x] Teste de integração do fluxo feliz completo passa.
  - [x] Tentativa de acesso sem vínculo ativo retorna `404` nos 3 endpoints de aluno.

### Tarefa 5: Toggle "tornar-se preparador" (Frontend)
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T1
- **Paralelizável com:** T3
- **Descrição:** Adicionar switch `isTrainer` em `apps/web/src/app/settings/profile/ProfilePageClient.tsx` (seção de informações pessoais), persistindo via `updateProfile` action existente (estender `ProfileUpdateInput`/schema Zod).
- **Critérios de Aceite:**
  - [x] Switch reflete e atualiza `isTrainer` via `PATCH /users/me`.
  - [x] Teste RTL cobrindo toggle (mock do hook, sem MSW, conforme padrão do projeto).

### Tarefa 6: Hooks de Coaching (Frontend)
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T2, T3
- **Paralelizável com:** T4
- **Descrição:** Criar em `apps/web/src/lib/api/hooks/`: `use-students.ts`, `use-trainers.ts` (listas), `use-invite-relationship.ts`, `use-respond-relationship.ts`, `use-revoke-relationship.ts` (mutations, invalidando as duas queries de lista), `use-student-dashboard.ts`, `use-create-student-strategy.ts`, `use-create-student-workout.ts`. Seguir convenção `apiFetch` + TanStack Query já usada nos demais hooks.
- **Critérios de Aceite:**
  - [x] Cada hook com teste unitário mockando `apiFetch`.
  - [x] Mutations invalidam `["coaching","students"]`/`["coaching","trainers"]` corretamente.

### Tarefa 7: Telas `/students` + nav (Frontend)
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T4, T6
- **Paralelizável com:** nenhuma
- **Descrição:** Rota `apps/web/src/app/students/page.tsx` com duas abas: "Meus Alunos" (lista + dialog de convite por email + aceitar/recusar/revogar + ao clicar num aluno ativo, abre tela/drawer de detalhe com `DashboardSummaryDto` reaproveitando os componentes de gráfico do TASK13 e formulário simplificado de criação de Strategy+Workout) e "Meus Preparadores" (lista + convite + aceitar/recusar/revogar, sem criação de rotina). Adicionar item `{ id: "alunos", label: "Alunos", icon: Users, href: "/students" }` em `extraNavItems` (`apps/web/src/components/layout/nav-content.tsx`).
- **Critérios de Aceite:**
  - [x] Fluxo de convite, aceite e revogação funcional nas duas abas.
  - [x] Dashboard do aluno renderiza usando os mesmos componentes de gráfico do `/progress` (TASK13), passando os dados de `use-student-dashboard`.
  - [x] Criação de rotina para aluno reflete na lista de estratégias dele (verificável via mock/teste).
  - [x] Item "Alunos" visível no nav para todo usuário autenticado.

---

<!--
GATE DE APROVAÇÃO
Revise as regras de negócio e as tarefas técnicas.
Se tudo estiver correto, altere o Status acima de "review" para "approved" para liberar os agentes de frontend/backend para iniciar a implementação.
-->
