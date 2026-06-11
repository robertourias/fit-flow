/# Product Backlog

> Gerado por `/backlog` em 2026-06-11. Atualizado em 2026-06-11 com progresso real.
> Fonte: `docs/context/product.md` + planos em `docs/plans/`.
> Use `/spec TASKXX` para gerar a especificação de cada tarefa.

## Legenda de Status

| Status | Significado |
|--------|-------------|
| backlog | Aguardando especificação |
| spec-draft | Spec gerado, aguardando aprovação |
| spec-approved | Spec aprovado, pronto para /plan |
| in-progress | Em implementação |
| done | Concluído |

---

## Fase 0 — Fundação (Concluída)

> Executada antes da geração deste backlog. Planos em `docs/plans/`.

| ID | Título | Descrição | Status | Dependências | Plano |
|----|--------|-----------|--------|--------------|-------|
| TASK00-A | Monorepo Setup | Turborepo + pnpm workspaces, apps/web (Next.js), apps/api (NestJS), packages/* (config, types, utils, ui, db), Docker Compose local | done | — | [2026-05-26-monorepo-setup](../plans/2026-05-26-monorepo-setup.md) |
| TASK00-B | UI Estática — Dashboard | Página `/dashboard` com mock data, design system (shadcn/ui, tokens, dark mode, fontes) | done | TASK00-A | [2026-05-31-dashboard-page](../plans/2026-05-31-dashboard-page.md) |
| TASK00-C | UI Estática — Exercícios | Páginas `/exercises` e `/exercises/[id]` com mock data e filtros | done | TASK00-B | [2026-05-31-exercises-page](../plans/2026-05-31-exercises-page.md) |
| TASK00-D | UI Estática — Biblioteca | Página `/library` com mock data, grade/lista, painel desktop | done | TASK00-B | [2026-05-31-library-page](../plans/2026-05-31-library-page.md) |
| TASK00-E | UI Estática — Treino | Fluxo `/workout/[id]` → `/start` → `/session` → `/finish` com Zustand e mock data | done | TASK00-C, TASK00-D | [2026-06-01-workout-detail](../plans/2026-06-01-workout-detail.md) |
| TASK00-F | Data Model | Schema Prisma completo (Identity, Catalog, Training), entidades de domínio NestJS, repositórios Prisma, NextAuth Prisma Adapter | done | TASK00-A | [2026-06-02-data-model](../plans/2026-06-02-data-model.md) |
| TASK00-G | Autenticação Core | Login/signup com OTP por email, Google OAuth, middleware de proteção de rotas, página `/onboarding` placeholder | done | TASK00-F | [2026-06-05-auth](../plans/2026-06-05-auth.md) |
| TASK00-H | Auth Evoluída + Perfil | Senha + Turnstile + alerta de novo dispositivo, página `/settings/profile` com edição, troca de senha e exclusão de conta | done | TASK00-G | [2026-06-09-auth-profile](../plans/2026-06-09-auth-profile.md) |

---

## Fase 1 — API REST Core

| ID | Título | Descrição | Status | Dependências | Spec |
|----|--------|-----------|--------|--------------|------|
| TASK01 | API Identity | Auth guard JWT (NextAuth), ValidationPipe, Swagger, interceptor/filter globais, endpoints `GET/PATCH/DELETE /users/me` | done | TASK00-H | [2026-06-10-api-rest-core](../plans/2026-06-10-api-rest-core.md) |
| TASK02 | API Catalog | Endpoints `/muscle-groups`, `/equipment` e CRUD paginado de `/exercises` com filtros e isolamento de tenant | done | TASK01 | [2026-06-10-api-rest-core](../plans/2026-06-10-api-rest-core.md) |
| TASK03 | API Training | CRUD de `/strategies`, `/workouts` (aninhado com exercises/sets) e `/workout-sessions` com filtro de retenção 60 dias | done | TASK02 | [2026-06-10-api-rest-core](../plans/2026-06-10-api-rest-core.md) |

## Fase 2 — Integração & Fluxo

| ID | Título | Descrição | Status | Dependências | Spec |
|----|--------|-----------|--------|--------------|------|
| TASK04 | Integração Dashboard | Substituição do mock data por endpoints da API (TanStack Query) | backlog | TASK01, TASK03 | — |
| TASK05 | Integração Exercícios | Conexão da biblioteca com API e filtros dinâmicos | backlog | TASK02 | — |
| TASK06 | Onboarding Fluxo | Implementar wizard inicial: perfil, seleção de objetivo, criação do 1º programa | backlog | TASK01 | — |
| TASK07 | Rota /program/[id] | Gestão de programas ativos e conexão com formulário de conclusão | backlog | TASK03 | — |

## Fase 3 — Complementar

| ID | Título | Descrição | Status | Dependências | Spec |
|----|--------|-----------|--------|--------------|------|
| TASK08 | CRUD de Estratégia | Cadastro e edição de estratégias de treino (splits: ABC, Upper/Lower, PPL, Full Body) no frontend + endpoints de suporte | backlog | TASK06, TASK07 | — |
| TASK09 | CRUD de Rotina & Treinos | Cadastro de rotina semanal com treinos: seleção de exercícios, séries, reps, carga e técnicas avançadas (drop set, bi-set, etc.) | backlog | TASK08 | — |
| TASK10 | Limites do plano gratuito | Enforce de: máx. 6 Workouts por usuário no plano FREE — validação no backend (uso case + repositório) e feedback visual no frontend | backlog | TASK09 | — |
| TASK11 | Execução de treino | Registrar sessão em tempo real: séries/cargas/reps executados, timer de intervalo e conclusão de treino | backlog | TASK09 | — |
| TASK12 | Histórico de sessões | Listar e exibir histórico de sessões com retenção de 60 dias (plano gratuito) | backlog | TASK11 | — |

## Fase 4 — Polimento

| ID | Título | Descrição | Status | Dependências | Spec |
|----|--------|-----------|--------|--------------|------|
| TASK13 | Dashboards de Progresso | Dashboards de volume, duração, dias de treino no mês, músculos trabalhados na semana e heatmap de atividade | backlog | TASK12 | — |
| TASK14 | Medidas Corporais | Cadastro e histórico (60 dias) de peso, medidas corporais e avaliação de bioimpedância | backlog | TASK12 | — |
| TASK15 | Explorar (Templates) | Área para explorar e importar estratégias/rotinas pré-criadas (Catalog templates) | backlog | TASK09, TASK13 | — |
| TASK16 | Compartilhamento | Gerador de card/imagem com resumo do treino ou progresso para redes sociais | backlog | TASK13, TASK14 | — |
| TASK17 | Área do Preparador: Alunos | Bounded context Coaching: vínculo aluno ↔ preparador, criação/atribuição de rotinas e acompanhamento de evolução | backlog | TASK09, TASK13 | — |
| TASK18 | Personal (Comunicação) | Canal de comunicação preparador → aluno: orientações, moderação de conteúdo e notificações assíncronas via BullMQ | backlog | TASK17 | — |
| TASK19 | Hardening & Release | Observabilidade (Pino, Sentry, Prometheus), cobertura de testes, CI/CD completo e deploy em produção (Vercel + Railway) | backlog | TASK18 | — |
