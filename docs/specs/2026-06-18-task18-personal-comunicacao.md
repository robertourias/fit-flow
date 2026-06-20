# Spec & Plan: TASK18 — Personal (Comunicação)

**Status:** approved
**Data:** 2026-06-18
**Autor:** Planner (IA)

---

## 1. Problema e Visão Geral

TASK17 entregou o vínculo preparador↔aluno, mas os dois lados não têm como conversar dentro do produto — hoje a orientação acontece fora do FitFlow (WhatsApp, etc.), perdendo contexto e histórico. Esta spec adiciona um chat bidirecional por vínculo `ACTIVE` (preparador↔aluno), com moderação de conteúdo (bloqueio de linguagem imprópria) e notificações assíncronas via BullMQ (in-app, sem email/push nesta fase) quando uma nova mensagem chega.

---

## 2. Cenários de Usuário

- **P1 (crítico):** Como preparador ou aluno com vínculo `ACTIVE`, quero enviar uma mensagem para o outro lado, para orientar/perguntar sobre o treino.
- **P1 (crítico):** Como preparador ou aluno, quero ver o histórico de mensagens de um vínculo, para acompanhar a conversa.
- **P1 (crítico):** Como usuário, quero que mensagens com linguagem imprópria sejam bloqueadas no envio, para manter a comunicação respeitosa.
- **P2 (importante):** Como usuário, quero ser notificado (in-app) quando recebo uma nova mensagem, para não precisar checar manualmente.
- **P2 (importante):** Como usuário, quero marcar mensagens/notificações como lidas, para saber o que já vi.
- **P3 (nice-to-have):** Como usuário, quero ver um contador de não lidas no sino de notificações, para saber rapidamente se há novidade.

> P1 = sem isso o produto não funciona. P2 = valor claro mas contornável. P3 = melhoria futura.

---

## 3. Requisitos Funcionais

- **FR-001:** Mensagem só pode ser enviada entre os dois lados de um vínculo `ACTIVE` (mesma regra de acesso do FR-008/TASK17: sem vínculo `ACTIVE` → `404`, não `403`).
- **FR-002:** Conteúdo da mensagem é validado contra uma blocklist própria de termos (PT-BR, case-insensitive, por palavra) antes de persistir. Se contiver termo bloqueado → `422`, mensagem **não** é salva e **não** enfileira notificação.
- **FR-003:** Envio válido persiste a `Message` e enfileira (BullMQ, fila `notifications`) um job para o destinatário; o processamento assíncrono cria uma `Notification(type=NEW_MESSAGE)` para ele. Falha no enqueue não deve impedir a resposta de sucesso do envio (mensagem já persistida é a fonte da verdade; notificação é best-effort).
- **FR-004:** Listagem de mensagens de um vínculo é paginada (`limit`/`offset`, mesmo padrão de `list-workout-sessions.use-case.ts`), ordenada por `createdAt` desc.
- **FR-005:** Cada lado do vínculo tem seu próprio cursor de leitura (`trainerLastReadAt` / `studentLastReadAt` em `TrainerStudentRelationship`). Marcar como lido grava `now()` no cursor do usuário autenticado. Não-lidas = mensagens do **outro** lado com `createdAt > meu cursor`.
- **FR-006:** `GET /notifications` retorna notificações do usuário autenticado, desc por `createdAt`, com filtro opcional `unread=true`.
- **FR-007:** `PATCH /notifications/:id/read` marca uma notificação como lida; `404` se não pertence ao usuário autenticado.
- **FR-008:** `PATCH /notifications/read-all` marca todas as notificações não lidas do usuário autenticado como lidas.
- **FR-009:** Frontend usa polling (TanStack Query `refetchInterval`) para mensagens do vínculo aberto e para o contador de notificações — sem WebSocket/SSE nesta fase.

---

## 4. Fora do Escopo & Riscos

- **Fora do Escopo:**
  - Notificação por email/push (apenas in-app nesta fase — decisão confirmada com o usuário).
  - WebSocket/SSE para tempo real (polling resolve a necessidade atual).
  - Edição/exclusão de mensagem após envio.
  - Anexos (imagem, arquivo) na mensagem — apenas texto.
  - Biblioteca externa de profanity filter (blocklist própria, decisão confirmada com o usuário).
  - Notificações de outros eventos além de `NEW_MESSAGE` (módulo fica genérico o suficiente para crescer, mas só este tipo é implementado agora).
- **Premissa:** Redis já está provisionado (`docker-compose.yml`, `REDIS_URL` em `.env.example`) e BullMQ já é decisão de stack registrada em `docs/architecture/overview.md` — esta tarefa instala `bullmq` + `@nestjs/bullmq` por ser o primeiro consumidor real da fila.
- **Risco:** Worker BullMQ cai/reinicia com jobs em voo. → Mitigação: `attempts: 3` com backoff exponencial na config do job; mensagem em si não depende da notificação ter sucesso (FR-003).
- **Risco:** Blocklist própria tem cobertura menor que lib especializada (falsos negativos). → Mitigação: lista é um array isolado e testável (`message-content-policy.ts`), fácil de estender depois sem mudar contrato.
- **Risco:** Polling de mensagens/notificações gera carga extra no banco em conversas ativas. → Mitigação: índice `[relationshipId, createdAt]` em `Message` e `[userId, read]` em `Notification`; intervalo de polling conservador (ex. 10-15s) no frontend.

---

## 5. Contratos de API

### Mensagens (Coaching)

- `POST /coaching/relationships/:id/messages`
  - **Request:** `{ content: string }`
  - **Response:** `MessageDto { id, relationshipId, senderId, content, createdAt }`
  - Erros: `404` (vínculo não `ACTIVE` ou usuário não participa), `422` (conteúdo bloqueado pela moderação, FR-002)

- `GET /coaching/relationships/:id/messages?limit=&offset=`
  - **Response:** `{ items: MessageDto[], total: number }`
  - Erros: `404` (vínculo não `ACTIVE` ou usuário não participa)

- `PATCH /coaching/relationships/:id/messages/read`
  - **Response:** `{ lastReadAt: string }`
  - Erros: `404`

### Notificações (novo módulo `notifications`)

- `GET /notifications?unread=`
  - **Response:** `NotificationDto[] { id, type, payload, read, createdAt }`

- `PATCH /notifications/:id/read`
  - **Response:** `NotificationDto`
  - Erros: `404` (não pertence ao usuário)

- `PATCH /notifications/read-all`
  - **Response:** `{ updated: number }`

---

## 6. Plano de Implementação (Tarefas)

### Ordem de Execução & Dependências

| Onda | Tarefas (paralelas) | Pré-requisito |
|------|---------------------|----------------|
| 1    | T1                  | —              |
| 2    | T2                  | T1             |
| 3    | T3, T4              | T2             |
| 4    | T5, T6              | T3, T4         |
| 5    | T7                  | T5, T6         |

> T3 (use-cases de mensagens) e T4 (use-cases de notificações) só dependem da infra BullMQ (T2) e das entidades/migration (T1) — não dependem entre si, rodam em paralelo. T6 (hooks de frontend) segue o padrão já usado em TASK17: depende apenas dos contratos definidos em T3/T4 (DTOs/regras), os testes mockam o hook (`jest.mock`, sem MSW) — pode rodar em paralelo com T5 (controllers), ambos consumindo os mesmos contratos desta spec.

### Tarefa 1: Migration + domínio (Message, Notification, moderação)
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** — (nenhuma)
- **Paralelizável com:** nenhuma
- **Descrição:** Em `packages/db/prisma/schema.prisma`: adicionar model `Message` (id, relationshipId FK→TrainerStudentRelationship, senderId FK→User, content String, createdAt; `@@index([relationshipId, createdAt])`), model `Notification` (id, userId FK→User, type enum `NotificationType { NEW_MESSAGE }`, payload Json, read Boolean @default(false), createdAt; `@@index([userId, read])`), e colunas `trainerLastReadAt`/`studentLastReadAt` (DateTime?, nullable) em `TrainerStudentRelationship`. Gerar migration. Criar em `apps/api/src/coaching/domain/`: `message.entity.ts`, `message-content-policy.ts` (export `containsProhibitedLanguage(text: string): boolean`, blocklist PT-BR const array, matching por palavra/regex word-boundary case-insensitive). Criar em `apps/api/src/notifications/domain/`: `notification.entity.ts`, `notification-type.enum.ts`. Repositórios: `IMessageRepository` (`create`, `findByRelationship(relationshipId, {limit, offset})`, `countByRelationship`), `INotificationRepository` (`create`, `findByUser(userId, {unreadOnly})`, `markRead(id, userId)`, `markAllRead(userId)`), e implementações Prisma. Estender `ITrainerStudentRelationshipRepository`/`PrismaTrainerStudentRelationshipRepository` com `markRead(relationshipId, side: "TRAINER" | "STUDENT", at: Date)`.
- **Critérios de Aceite:**
  - [x] Migration aplica limpo; índices criados.
  - [x] `containsProhibitedLanguage` cobre termo exato, maiúsculas/minúsculas e ignora substring dentro de outra palavra (ex.: não bloquear "classificar" por conter termo curto incidental).
  - [x] Testes unitários de entidade, policy e repositórios (Prisma mockado).

### Tarefa 2: Infra BullMQ (fila `notifications`)
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** T1
- **Paralelizável com:** nenhuma
- **Descrição:** Instalar `bullmq` + `@nestjs/bullmq` em `apps/api`. Criar `apps/api/src/notifications/notifications.module.ts` com `BullModule.forRootAsync` (conexão via `REDIS_URL`, já existente em `.env`) e `BullModule.registerQueue({ name: "notifications" })`. Criar processor `new-message-notification.processor.ts` (`@Processor("notifications")`) com job name `new-message` — recebe `{ recipientId, relationshipId, messageId, senderId }` e delega para um use-case (implementado em T4) que cria a `Notification`. Configurar job options padrão (`attempts: 3`, backoff exponencial) no registro da fila.
- **Critérios de Aceite:**
  - [x] App inicializa com Redis local (docker-compose) sem erro de conexão.
  - [x] Processor registrado e testável isoladamente (mock do use-case de criação de notificação).

### Tarefa 3: Use-cases de mensagens (Coaching)
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** T2
- **Paralelizável com:** T4
- **Descrição:** Em `apps/api/src/coaching/application/use-cases/`: `SendMessageUseCase` (valida vínculo `ACTIVE` e participação via `trainerHasAccessToStudent`/equivalente para o lado aluno→preparador, aplica `containsProhibitedLanguage` → `422` se bloqueado, persiste `Message`, injeta `Queue("notifications")` e enfileira job `new-message` com try/catch que loga e não falha a request em caso de erro no enqueue — FR-003), `ListMessagesUseCase` (paginação FR-004), `MarkMessagesReadUseCase` (atualiza cursor do lado do usuário autenticado via `markRead` do repositório de relacionamento).
- **Critérios de Aceite:**
  - [x] Mensagem com termo bloqueado retorna erro e não persiste nem enfileira.
  - [x] Envio sem vínculo `ACTIVE` ou por usuário que não participa → erro equivalente a `404`.
  - [x] Falha simulada no `Queue.add` não impede sucesso do envio (mensagem persistida).
  - [x] Testes unitários cobrindo FR-001 a FR-005 com repositórios e queue mockados.

### Tarefa 4: Use-cases de notificações
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** T2
- **Paralelizável com:** T3
- **Descrição:** Em `apps/api/src/notifications/application/use-cases/`: `CreateNotificationUseCase` (consumido pelo processor de T2 — cria `Notification(type=NEW_MESSAGE, payload={relationshipId, messageId, senderId})` para `recipientId`), `ListMyNotificationsUseCase` (FR-006), `MarkNotificationReadUseCase` (FR-007, `404` se não pertence ao usuário), `MarkAllNotificationsReadUseCase` (FR-008).
- **Critérios de Aceite:**
  - [x] `ListMyNotificationsUseCase` com `unreadOnly` filtra corretamente.
  - [x] Marcar lida de notificação de outro usuário → erro equivalente a `404`.
  - [x] Testes unitários cobrindo FR-006 a FR-008.

### Tarefa 5: Controllers + DTOs + Swagger
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** T3, T4
- **Paralelizável com:** T6
- **Descrição:** Estender `CoachingController` com os 3 endpoints de mensagens (Seção 5) + DTOs (`SendMessageDto`, `MessageDto`, `ListMessagesQueryDto`). Criar `NotificationsController` (`apps/api/src/notifications/presentation/`) com os 3 endpoints de notificações + `NotificationDto`. Testes de integração (Supertest): fluxo enviar mensagem → notificação assíncrona aparece (com espera/poll curto no teste) → marcar como lida; e fluxo de bloqueio por moderação.
- **Critérios de Aceite:**
  - [x] Todos os endpoints documentados no Swagger.
  - [x] Teste de integração do fluxo feliz completo (mensagem + notificação) passa.
  - [x] Teste de integração do bloqueio por moderação (`422`) passa.

### Tarefa 6: Hooks de mensagens e notificações (Frontend)
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T3, T4
- **Paralelizável com:** T5
- **Descrição:** Criar em `apps/web/src/lib/api/hooks/`: `use-messages.ts` (lista paginada com `refetchInterval`, FR-009), `use-send-message.ts` (mutation, invalida `["coaching","messages", relationshipId]`), `use-mark-messages-read.ts`, `use-notifications.ts` (lista com `refetchInterval`, filtro `unread`), `use-mark-notification-read.ts`, `use-mark-all-notifications-read.ts`. Seguir convenção `apiFetch` + TanStack Query já usada nos demais hooks (mock de hook em teste, sem MSW).
- **Critérios de Aceite:**
  - [x] Cada hook com teste unitário mockando `apiFetch`.
  - [x] Mutation de envio trata erro `422` (moderação) expondo mensagem amigável para o componente.

### Tarefa 7: UI de chat + sino de notificações (Frontend)
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T5, T6
- **Paralelizável com:** nenhuma
- **Descrição:** Adicionar painel de chat na tela de detalhe do aluno/preparador (`/students`, reaproveitando o drawer/detalhe criado na TASK17): lista de mensagens (bolhas alinhadas por remetente), input + botão enviar, marca como lido ao abrir. Criar componente de sino de notificações no layout (`apps/web/src/components/layout/`), com badge de contagem não lida (via `use-notifications`), dropdown listando notificações recentes, clique leva ao vínculo/conversa correspondente (`payload.relationshipId`) e marca como lida.
- **Critérios de Aceite:**
  - [x] Enviar mensagem mostra na lista imediatamente (optimistic ou refetch) e erro de moderação aparece como feedback inline (sem crash).
  - [x] Sino mostra contador correto e zera após marcar como lida.
  - [x] Teste RTL cobrindo envio de mensagem e leitura de notificação (mock dos hooks).

---

<!--
GATE DE APROVAÇÃO
Revise as regras de negócio e as tarefas técnicas.
Se tudo estiver correto, altere o Status acima de "review" para "approved" para liberar os agentes de frontend/backend para iniciar a implementação.
-->
