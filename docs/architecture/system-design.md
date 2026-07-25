# System Design — FitFlow

**Data:** 2026-07-22  
**Status:** Produção (TASK19 completo)  
**Versão:** 1.0

---

## 1. Visão Geral do Sistema

FitFlow é uma plataforma SaaS de gestão e execução de rotinas de treino para praticantes de musculação e preparadores físicos. Multi-tenant, serverless-ready (NestJS + Next.js), com arquitetura modular e observabilidade built-in.

### Usuários Principais
- **Aluno**: Cria rotinas, executa treinos, acompanha progresso
- **Preparador**: Gerencia alunos, orienta treinos, comunica via chat

### Métricas Críticas
- P99 latência de execução de treino: < 200ms
- Uptime: 99.9%
- TTK (Time to Key Value): < 1s em dashboard

---

## 2. Arquitetura em Camadas

```
┌─────────────────────────────────────┐
│      Browser / Mobile Client        │
│    (Next.js 15 / App Router)        │
└─────────────────┬───────────────────┘
                  │ HTTPS
┌─────────────────▼───────────────────┐
│     API Gateway / Reverse Proxy      │
│     (Traefik em produção)           │
└─────────────────┬───────────────────┘
                  │ HTTP (interno)
┌─────────────────▼───────────────────┐
│   NestJS API (apps/api)             │
│   ├─ Controllers (HTTP boundary)    │
│   ├─ Use Cases (lógica de negócio)  │
│   ├─ Domain Entities (modelos puros)│
│   └─ Infrastructure (ORM, cache)    │
└─────────────────┬───────────────────┘
        │         │         │
   ┌────▼──┐  ┌──▼──┐  ┌───▼────┐
   │Prisma │  │Redis│  │ MinIO  │
   │(SQL)  │  │Cache│  │Storage │
   └────┬──┘  └─────┘  └────────┘
        │
   ┌────▼──────────────────────┐
   │ PostgreSQL 16 (Railway)   │
   │ ├─ users                  │
   │ ├─ exercises              │
   │ ├─ strategies/workouts    │
   │ ├─ sessions (execução)    │
   │ ├─ coaching (vínculo)     │
   │ └─ messages (chat)        │
   └───────────────────────────┘
```

---

## 3. Componentes Principais

### 3.1 Frontend (Next.js 15 + React 19)

**Estrutura:**
```
apps/web/
├─ app/                           # App Router
│  ├─ (auth)/login, signup, verify
│  ├─ dashboard, exercises, library, progress, settings
│  └─ coaching/messages, alunos
├─ components/
│  ├─ ui/ (shadcn — button, dialog, select, card, etc)
│  ├─ dashboard/ (CalendarSection, MetricsStrip, ProgressChart)
│  └─ workout/ (WorkoutBuilder, WorkoutFinishForm)
├─ lib/
│  ├─ auth.ts (NextAuth v5 — Credentials + Google OAuth)
│  ├─ api-fetch.ts (cliente HTTP com retry)
│  ├─ turnstile.ts (Cloudflare anti-bot)
│  └─ otp.ts (validação OTP local)
└─ hooks/ (useWorkout, useProgress, useCoachingChat)
```

**Tech Stack:**
- Framework: Next.js 15 (App Router)
- UI: Tailwind CSS + shadcn/ui
- Componentes: Framer Motion (animações), Lucide (ícones)
- Estado: Zustand (global), React Query (server state)
- Formulários: React Hook Form + Zod
- Auth: NextAuth v5 (Credentials + Google)
- Testes: RTL + Playwright (E2E)

**Decisões Arquiteturais:**
- Server Components por padrão; `'use client'` apenas para interatividade
- Server Actions para mutações internas (não API routes)
- Suspense + error boundaries para loading/error states
- MSW para mock de rede em testes (não jest.mock em hooks)

---

### 3.2 Backend (NestJS + Prisma)

**Estrutura por Bounded Context:**
```
apps/api/src/
├─ common/
│  ├─ decorators/ (Auth, RawResponse)
│  ├─ filters/ (exceções globais)
│  ├─ pipes/ (validação)
│  └─ observability/ (Pino, Sentry, Prometheus)
├─ modules/
│  ├─ auth/
│  │  ├─ domain/ (User, VerificationToken)
│  │  ├─ application/ (SignupUseCase, LoginOtpUseCase)
│  │  ├─ infrastructure/ (PrismaUsersRepository)
│  │  └─ presentation/ (AuthController)
│  ├─ exercises/
│  ├─ strategies/ (programas de treino)
│  ├─ workouts/ (treinos / rotinas)
│  ├─ sessions/ (execução de treino)
│  ├─ coaching/ (vínculo aluno↔preparador)
│  ├─ messages/ (chat em tempo real)
│  └─ jobs/ (workers BullMQ)
└─ main.ts
```

**Tech Stack:**
- Framework: NestJS 10
- ORM: Prisma 6 (migrations automáticas no Docker)
- Validação: class-validator
- Auth: JWT (15min) + NextAuth JWE (session cookie)
- Cache: Redis (Ioredis)
- Fila: BullMQ (email, notificações, processamento pesado)
- Logging: Pino (estruturado)
- Monitoring: Sentry (errors), Prometheus (métricas)
- API Docs: Swagger

**Decisões Arquiteturais:**
- Clean Architecture estrict: domain → application → infrastructure → presentation
- Dependency Injection por tokens (não por class)
- Multi-tenant desde o início (todos os recursos filtrados por `tenantId`)
- Migrations obrigatórias (`synchronize: false`)
- Rate limiting em auth endpoints
- Validação de posse (ownership) no service, não só em guards

---

### 3.3 Banco de Dados (PostgreSQL)

**Tabelas Principais:**
```sql
users                    -- Alunos e preparadores
├─ id, email, name, passwordHash, emailVerified
├─ plan (free|pro|elite)  -- Limites de estratégias/rotinas
├─ tenantId              -- Para multi-tenancy futura
└─ createdAt, updatedAt, deletedAt

exercises                -- Catálogo global
├─ id, name
├─ tenantId (null = global)
└─ exerciseMuscleGroups, exerciseEquipment (relations)

strategies               -- Programas de treino (PPL, ABC, etc)
├─ id, userId, name, type, description
├─ isTemplate (templates públicos)
├─ isActive
└─ workouts (relation)

workouts                 -- Treinos dentro de estratégia
├─ id, strategyId, name, order, tenantId
└─ workoutExercises (relation)

workout_exercises        -- Exercícios em um treino
├─ id, workoutId, exerciseId, order, restSeconds
└─ plannedSets (relation)

sessions                 -- Execução real de treino
├─ id, userId, workoutId, startedAt, finishedAt
├─ duration, notes
└─ sessionExercises (relation)

coaching_relationships   -- Aluno ↔ Preparador
├─ id, studentId, coachId, status (pending|active|ended)
└─ messages (relation)

messages                 -- Chat aluno↔preparador
├─ id, coachRelationshipId, senderId, body
├─ createdAt
└─ isRead
```

**Índices Críticos:**
```sql
CREATE INDEX idx_sessions_user_date ON sessions(userId, finishedAt DESC);
CREATE INDEX idx_messages_coach_rel ON messages(coachRelationshipId, createdAt DESC);
CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workoutId);
CREATE INDEX idx_coaching_relationships_student ON coaching_relationships(studentId);
```

**Constraints:**
- PK: `id` (uuid)
- FK: `userId`, `coachId`, `workoutId` (com cascata de delete apropriada)
- Unique: `users.email`, `strategies.name` (por userId)
- Not null: `email`, `tenantId` (se multi-tenant), timestamps

---

### 3.4 Cache (Redis)

**Padrões de Cache:**

| Chave | TTL | Invalidação | Exemplo |
|-------|-----|-------------|---------|
| `progress:${userId}:dashboard` | 5min | Ao executar treino | Métricas de progresso |
| `exercises:global` | 1h | Manual (seed) | Catálogo completo |
| `user:${userId}:profile` | 15min | Ao atualizar perfil | Dados de usuário |
| `session:${sessionId}:temp` | Session | Ao finalizar | Dados de execução em progresso |

**Estruturas:**
- Strings: metadados simples
- Hashes: objetos (ex: `user:id` → `{email, name, plan}`)
- Lists: históricos (ex: `messages:relationship:id`)
- Sorted Sets: ranking/scores por timestamp

---

### 3.5 Object Storage (MinIO)

**Buckets:**
- `fitflow` (padrão) — todas as imagens/assets

**Estrutura de Objetos:**
```
fitflow/
├─ users/{userId}/profile-picture.jpg
├─ strategies/{strategyId}/template-image.jpg
└─ sessions/{sessionId}/workout-proof.jpg
```

**Política de Acesso:**
- Upload: Autenticado (bearer token NextAuth)
- Download: Público (URLs pré-assinadas com expiração 24h)
- Retenção: Sem cleanup automático (manual via admin)

---

### 3.6 Fila de Tarefas (BullMQ + Redis)

**Queues:**

| Queue | Prioridade | Delay | Tipo |
|-------|-----------|-------|------|
| `email` | Normal | 0 | OTP, alertas de novo dispositivo |
| `notifications` | Normal | 0 | Push, in-app |
| `reports` | Low | 0 | Exportar relatórios (futuro) |

**Retry Policy:**
- Max retries: 3
- Backoff: exponencial (1s, 5s, 30s)
- DLQ: `failed-${queueName}` após 3 falhas

---

## 4. Fluxo de Dados Críticos

### 4.1 Login com OTP

```
1. User (web) → POST /api/v1/auth/request-otp {email}
2. API (backend)
   ├─ Valida email
   ├─ Gera OTP (6 dígitos, TTL 10min)
   ├─ Salva em DB (verification_tokens.purpose='LOGIN_OTP')
   ├─ Enfileira job email (BullMQ)
   └─ 202 Accepted
3. BullMQ Worker
   └─ Envia OTP via Resend SMTP
4. User (web) → POST /api/v1/auth/verify-otp {email, otp}
5. API (backend)
   ├─ Valida OTP
   ├─ Cria sessão JWT (NextAuth)
   └─ 200 + Set-Cookie (authjs.session-token)
6. NextAuth (web)
   └─ Armazena session cookie + valida em cada request
```

**Segurança:**
- OTP de 6 dígitos (1M combinações), brute-force rate-limited
- TTL 10min (não reutilizável)
- Cookie httpOnly + Secure + SameSite=Strict
- CSRF token via NextAuth

---

### 4.2 Execução de Treino

```
1. User (web) → GET /api/v1/workouts/:id
   └─ Retorna sets planejados + histórico

2. User (web) inicia treino → POST /api/v1/sessions
   ├─ Cria session record (status='in_progress')
   ├─ Cache em Redis: session:${sessionId}:temp
   └─ 201 + sessionId

3. User (web) executa exercício → POST /api/v1/sessions/:id/exercises
   ├─ Registra sets reais (kg, reps, rpe)
   ├─ Atualiza Redis cache
   └─ 200 OK

4. User (web) finaliza treino → PATCH /api/v1/sessions/:id/finish
   ├─ Valida integridade (sets mínimos, etc)
   ├─ Calcula métricas (volume, duração)
   ├─ Salva session + exercise_results
   ├─ Invalida cache dashboard
   ├─ Enfileira job: analytics (futuro)
   └─ 200 OK

5. Dashboard (web) → GET /api/v1/progress/dashboard
   ├─ Busca cache (5min TTL)
   ├─ Se miss: agrupa últimas 30 sessões
   └─ Retorna {volume, muscleGroups, heatmap}
```

**Otimizações:**
- Cache de dashboard 5min (reclaculado pós-treino)
- Agregações offline (não query pesada em produção)
- Paginação cursor-based em histórico

---

## 5. Decisões Técnicas Chave

### Backend

| Decisão | Trade-off | Razão |
|---------|-----------|-------|
| **Prisma ORM** | Menos controle SQL vs. type-safety | Type safety no JS/TS, migrations automáticas |
| **NestJS monolith** | Menos escalabilidade vs. coesão | Custo de infra reduzido, deployment único |
| **Clean Architecture** | Verbosidade vs. testabilidade | Mudanças de framework isoladas |
| **BullMQ para jobs** | Redis necessário vs. sem polling | Garantia de execução, retry automático |
| **JWT 15min + refresh em cookie** | Complexidade vs. segurança | Tokens curtos + cookie httpOnly = protege XSS |

### Frontend

| Decisão | Trade-off | Razão |
|---------|-----------|-------|
| **Server Components** | Menos interatividade vs. menos JS | Reduz bundle, segurança (secrets no server) |
| **Tailwind + shadcn** | Menos customização vs. velocidade | Padrão de design consistente |
| **Zustand** | Menos middleware vs. simplicidade | Sem Redux boilerplate, suficiente para escopo |
| **React Query** | Outra lib vs. cache inteligente | Sincronização automática servidor↔cliente |

### Infra

| Decisão | Trade-off | Razão |
|---------|-----------|-------|
| **MinIO self-hosted** | Menos integração vs. controle | S3-compatible, barato, dados sob controle |
| **Traefik reverse proxy** | Complexidade vs. TLS/roteamento** | Automação de certificados, load balancing |
| **Railway para Postgres** | Vendor lock-in vs. gerenciado | Backups automáticos, high-availability |

---

## 6. Escalabilidade

### Horizontal Scaling

**API (stateless):**
```
Fase 1 (atual): 1 instância NestJS + 1 Postgres + 1 Redis
Fase 2: 2-3 instâncias NestJS + Load Balancer + Postgres replicado (read-only replicas)
Fase 3: Kubernetes (Helm) com auto-scaling 3-10 pods conforme CPU/memória
```

**Database:**
```
PostgreSQL (Railway)
├─ Replicação de leitura (read replicas em staging)
├─ Índices em colunas de filtro críticas (userId, tenantId, createdAt)
└─ Particionamento de tabelas grandes (sessions, messages) por ano/mês (futuro)
```

**Cache (Redis):**
```
Failover: Redis Sentinel (futuro)
Scaling: Redis Cluster se cache > 256MB persistentemente
```

### Vertical Scaling
- NestJS: incrementar CPU/RAM (Node.js single-threaded, scale via PM2 cluster mode)
- Postgres: aumentar conexões em pool (atual 10, max ~20 com connection pooling PgBouncer)
- Redis: incrementar maxmemory, política de eviction

---

## 7. Segurança

### Autenticação & Autorização

1. **NextAuth v5** — sessão JWT encriptada em cookie httpOnly
   - Providers: Credentials (OTP), Google OAuth
   - Callback de autorização: valida se usuário existe e está ativo

2. **Authorization** — RBAC simples (user roles futura)
   - Aluno: acesso apenas seus dados (filtro por userId)
   - Preparador: acesso alunos vinculados (via coaching_relationships)

3. **Rate Limiting** — endpoints críticos
   - `/auth/request-otp`: 5 req/min por IP
   - `/auth/verify-otp`: 10 req/min por IP

### Validação & Sanitização

- **Input**: class-validator em todos os DTOs
- **SQL**: Prisma (queries parametrizadas obrigatórias)
- **XSS**: Next.js escapa JSX automaticamente, `dangerouslySetInnerHTML` bloqueado

### Dados Sensíveis

- Senhas: bcrypt (cost 12)
- JWT: HS256 (NextAuth secret de 32 bytes)
- OTP: não armazenado em logs, apenas em DB (ttl curto)
- Env vars: `.env.production.local` em .gitignore, injetadas em CI/CD

### CORS & CSRF

- CORS: origin da web fixa (ou arquivo nginx/Traefik)
- CSRF: NextAuth gera token automático em cookies (Synchronizer Token Pattern)
- SameSite: Cookie com `SameSite=Strict`

---

## 8. Observabilidade

### Logging (Pino)

```typescript
this.logger.error('user signup failed', {
  email: user.email,
  error: err.message,
  stack: err.stack,
  timestamp: new Date().toISOString()
})
```

**Agregação:** stdout → ECS/CloudWatch (em produção)

### Monitoring (Prometheus)

```
GET /metrics
├─ http_requests_total{method, route, status}
├─ http_request_duration_seconds{quantile}
├─ prisma_query_duration_seconds
└─ bullmq_jobs_processed{queue, status}
```

**Alertas:**
- P99 latência > 500ms
- Taxa de erro > 1%
- Jobs falhados > 3

### Tracing (Sentry)

- Error tracking no backend (não-optional, DSN em env)
- Sourcemap upload automático
- Session replay (opcional)

---

## 9. Disaster Recovery

### Backup & Restore

| Componente | Estratégia | RTO | RPO |
|------------|-----------|-----|-----|
| **Postgres** | Railway managed backups (7 dias) | 1h | 1h |
| **Redis** | Snapshots em Volume (diários) | 2h | 1 dia |
| **MinIO** | Sincronização com S3 (futuro) | 4h | 4h |
| **Código** | Git + GitHub | instant | instant |

### Failover

- **API**: Load balancer automático em K8s, reinicializa pods falhos
- **Database**: Replicação de leitura (standby manual para failover)
- **Redis**: Sentinel (futuro)

---

## 10. Roadmap Técnico (Pós-TASK19)

### Q3 2026
- [ ] Integração Stripe/Paddle (pagamento)
- [ ] WebSocket para chat em tempo real (Socket.io)
- [ ] Busca full-text de exercícios (Elasticsearch)

### Q4 2026
- [ ] Mobile app (React Native)
- [ ] Multi-language (i18n)
- [ ] Integração com smartwatch/fitness trackers

### 2027
- [ ] Inteligência artificial (sugestões de treino)
- [ ] Marketplace de templates (comissão 30%)
- [ ] Migração para GraphQL (opcional)

---

## 11. Contatos & Runbooks

- **Oncall Slack**: #fitflow-incidents
- **Sentry dashboard**: [link em produção]
- **Prometheus**: [link em produção]
- **Runbook de deploy**: `docs/workflows/release-process.md`
- **Runbook de rollback**: `git revert + redeployar`

---

**Documento vigente desde:** 2026-07-22  
**Próxima revisão:** 2026-10-22 (após Q3 roadmap)
