# Product Context

> **Purpose**: Help AI agents understand the product domain, user needs, and business rules. Update this as the product evolves.

## Product Overview

**Product name**: FitFlow
**Tagline**: Webapp para acompanhamento e orientação de rotinas e estratégia de treino
**Stage**: Ideia

FitFlow é um webapp voltado para praticantes de musculação que desejam organizar, acompanhar e evoluir seus treinos. A plataforma permite cadastrar estratégias e rotinas de treino, visualizar progresso e, futuramente, conectar alunos a preparadores físicos.

## Target Users

### Primary User
- **Who**: Praticante de musculação
- **Goal**: Organizar e acompanhar suas rotinas e estratégias de treino
- **Pain point**: Falta de uma ferramenta centralizada para planejar treinos, monitorar progresso e receber orientação
- **Technical level**: Não-técnico

### Secondary User
- **Who**: Preparador (treinador/treinadora ou professor/professora)
- **Goal**: Gerenciar e acompanhar os treinos dos alunos, oferecer orientação personalizada

## Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| Rotina de treino | Cadastro da estratégia de treino e do treino com seleção de exercícios | Planejado |
| Progresso | Visualização de progresso: volume, duração, dias de treino no mês, músculos trabalhados na semana e heatmap | Planejado |
| Exercícios | Visualização dos exercícios por grupo muscular | Planejado |
| Compartilhamento | Gerador de informativo para compartilhamento em redes sociais | Planejado |
| Notificações | Informativos, lembretes e avisos durante o treino (intervalos e tempo) | Planejado |
| Explorar | Área para explorar estratégias de treinos pré-criadas | Planejado |
| Alunos | Área para preparador gerenciar e acompanhar treinos dos alunos | Planejado |
| Personal | Área de comunicação e visualização de orientação do preparador | Planejado |

## Business Rules

> Critical business logic that AI agents must never violate. These are non-negotiable constraints.

- **Isolamento de dados**: Preparador só acessa dados dos próprios alunos — nunca de alunos vinculados a outros preparadores
- **Limite do plano gratuito**:
  - Máximo de **2 programas** ativos simultaneamente
  - Máximo de **4 treinos por programa**
  - **Histórico de sessões**: 60 dias
  - **Medidas corporais** (peso, medida corporal, avaliação de bioimpedância): histórico de 60 dias
  - Não permitir criação além desses limites sem upgrade
- **Moderação de conteúdo**: Não permitir linguagem imprópria na comunicação entre preparador e aluno
- **Autenticação obrigatória**: Acesso a todas as telas somente em ambiente autenticado — nenhuma tela de conteúdo é acessível sem login

## Domain Glossary

> Use these terms consistently in code, documentation, and conversations.

| Term | Definition |
|------|-----------|
| Rotina | Conjunto de treinos semanais |
| Estratégia | Divisão muscular (ABC, Upper/Lower, etc.) |
| Preparador | Treinador/treinadora ou professor/professora |
| Split | Divisão de treino |
| Full Body | Treino de corpo inteiro |
| Upper/Lower | Divisão superior/inferior |
| Push/Pull/Legs (PPL) | Empurrar/puxar/pernas |
| Periodização | Planejamento progressivo do treino |
| Repetição (Rep) | Uma execução do movimento |
| Série (Set) | Conjunto de repetições |
| Carga | Peso utilizado |
| Falha muscular | Incapacidade de completar outra repetição |
| RM (Repetition Maximum) | Repetição máxima |
| Volume de treino | Quantidade total de trabalho realizado |
| Intensidade | Nível de esforço/carga |
| Cadência/Tempo | Velocidade de execução do movimento |
| Drop set | Reduzir carga sem descanso entre séries |
| Bi-set / Superset | Dois exercícios consecutivos sem descanso |
| Rest-pause | Pausa curta dentro da série para continuar |
| Pirâmide | Progressão ou regressão de carga ao longo das séries |
| Isometria | Contração estática (sem movimento) |
| Ativação muscular | Recrutamento do músculo alvo no início do exercício |

## User Journeys

### Journey 1: Primeiro treino
```
1. Usuário se cadastra e faz login
2. Escolhe ou cria uma estratégia de treino
3. Monta uma rotina semanal com seus treinos
4. Seleciona os exercícios de cada treino
5. Executa o treino e registra séries, cargas e repetições
6. Visualiza o progresso ao final
```

### Journey 2: Acompanhamento com preparador
```
1. Usuário se cadastra e vincula a um preparador
2. Preparador cria e atribui a rotina ao aluno
3. Aluno executa os treinos e registra o progresso
4. Preparador acompanha evolução e envia orientações
5. Aluno visualiza as orientações na área Personal
```

## Metrics & Success Criteria

<!-- a definir -->
- **Primary metric**: <!-- a definir -->
- **Secondary metrics**: <!-- a definir -->
- **Current targets**: <!-- a definir -->

## Out of Scope

- Planos de dieta ou nutrição
- Integração com wearables (por enquanto)
- Marketplace de preparadores

## Competitive Context

<!-- a definir -->
- **Similar products**: <!-- a definir -->
- **Our differentiation**: <!-- a definir -->

## Roadmap (High Level)

> Fases ordenadas por dependência. Cada fase vira um ou mais specs em `docs/specs/`. Specs dentro de uma fase podem ser paralelizados entre frontend/backend quando o contrato de API estiver definido.

### Fase 0 — Concluída
- Monorepo, Auth (signup/login/OTP, Google OAuth, device alerts, profile settings)
- UI estática com mock data: Dashboard, Exercícios, Biblioteca, Treino (execução)
- Data model Prisma + entidades/repositórios NestJS: Identity, Catalog, Training

### Fase 1 — API REST Core (Backend)
**Bounded contexts**: Identity, Catalog, Training
- Controllers + DTOs + Swagger para entidades já modeladas (Identity, Catalog, Training)
- Validação `class-validator`, paginação cursor-based, filtro por `tenantId`
- Testes de integração (Supertest)
- **Bloqueia** Fase 2

### Fase 2 — Integração Frontend ↔ Backend
- Substituir mock data por chamadas reais (TanStack Query) nas páginas existentes (Dashboard, Exercícios, Biblioteca, Treino)
- Implementar onboarding (`/onboarding`) — rota existe, sem conteúdo
- Criar rota `/program/[programId]` (destino do `WorkoutFinishForm`)
- E2E happy path: cadastro → onboarding → login → dashboard

### Fase 3 — Rotina de Treino (CRUD completo)
**Bounded context**: Training
- Cadastro de Estratégia (split: ABC, Upper/Lower, PPL, Full Body)
- Cadastro de Rotina (semanal) e Treinos (seleção de exercícios, séries, reps, carga, técnicas: drop set, bi-set, rest-pause, pirâmide)
- Enforce limites do plano gratuito: máx. 2 programas ativos, máx. 4 treinos/programa
- Depende de Fase 2 (API + integração)

### Fase 4 — Execução de Treino e Histórico
**Bounded context**: Training
- Registrar sessão (séries/cargas/reps executados), timer de intervalo, conclusão de treino
- Histórico de sessões (retenção 60 dias no plano gratuito)
- Notificações in-app durante treino (lembretes, intervalo) — pode reusar `useWakeLock`
- Depende de Fase 3

### Fase 5 — Progresso
**Bounded context**: Training (read models)
- Dashboards: volume, duração, dias de treino no mês, músculos trabalhados na semana, heatmap
- Medidas corporais (peso, bioimpedância) — cadastro + histórico (60 dias plano gratuito)
- Depende de Fase 4 (dados de sessão existentes)

### Fase 6 — Explorar
**Bounded context**: Catalog
- Área de estratégias/rotinas pré-criadas (templates) para importar
- Depende de Fase 3 (modelo de Estratégia/Rotina já validado)

### Fase 7 — Compartilhamento
- Gerador de informativo (imagem/card) com resumo do treino/progresso para redes sociais
- Depende de Fase 5 (dados de progresso)

### Fase 8 — Área do Preparador: Alunos
**Novo bounded context**: Coaching
- Vínculo aluno ↔ preparador (multi-tenant: isolamento garantido por `tenantId`)
- Preparador cria/atribui rotinas a alunos, acompanha evolução
- Depende de Fase 3 e 5 (rotinas e progresso já existentes para reaproveitar)

### Fase 9 — Personal (Comunicação)
**Bounded context**: Coaching
- Área de comunicação preparador → aluno (orientações)
- Moderação de conteúdo (linguagem imprópria)
- Notificações assíncronas via BullMQ
- Depende de Fase 8

### Fase 10 — Hardening & Release
- Observabilidade: Pino, Sentry, Prometheus
- Cobertura de testes nas metas definidas em `docs/context/decisions.md`
- CI/CD completo (GitHub Actions), deploy produção (Vercel + Railway)
- Resolver débitos técnicos abertos em `docs/context/current-state.md` (next-auth v5 beta workaround, migrations automáticas no Docker)
