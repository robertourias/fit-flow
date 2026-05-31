# Feature Delivery Workflow

> Step-by-step process for delivering a new feature from requirement to production. All agents must follow this workflow.

## Overview

```
Requirement → [Fase 0: Spec] → ⛔ GATE: aprovação humana → [Fase 1: Plan] → Backend → Frontend → Integration → Review → Deploy → Documentation
```

> O gate entre Fase 0 e Fase 1 é obrigatório. Nenhuma fase de implementação começa sem um spec com `Status: approved` em `docs/specs/`.

## Phase 0: Spec (Planner Agent — Modo Spec)

**Input:** Requisito de produto, user story, ou pedido verbal
**Output:** `docs/specs/YYYY-MM-DD-<topic>.md` com `Status: draft`

1. Ler `docs/architecture/overview.md` e `docs/context/product.md`
2. Conduzir levantamento com o solicitante (uma pergunta por vez)
3. Gerar spec usando `docs/specs/spec-template.md` como base
4. Salvar em `docs/specs/YYYY-MM-DD-<nome-do-topico>.md`
5. **Parar e aguardar** — informar o caminho do arquivo ao solicitante

**⛔ GATE — Aprovação Humana Obrigatória**

O solicitante deve:
- Revisar o spec gerado
- Corrigir ambiguidades, escopos incorretos ou requisitos faltantes
- Alterar `Status: draft` → `Status: approved` no arquivo

**Nenhuma fase subsequente começa antes deste gate ser cumprido.**

---

## Phase 1: Planning (Planner Agent)

**Input:** Spec aprovado em `docs/specs/YYYY-MM-DD-<topic>.md` (campo `Status: approved` obrigatório)
**Output:** Tarefas técnicas ordenadas com contrato de API definido

1. Ler `docs/architecture/overview.md` e `docs/context/product.md`
2. Identificar módulos afetados (backend e frontend)
3. Definir novos modelos de dados ou mudanças de schema
4. Rascunhar o contrato de API (endpoints, request/response)
5. Criar tarefas discretas seguindo o formato em `docs/agents/planner.agent.md`
6. Identificar dependências e ordenar tarefas
7. Sinalizar riscos e perguntas abertas antes de prosseguir

**Gate**: Todas as ambiguidades resolvidas antes de iniciar implementação.

---

## Phase 2: Backend Implementation (Backend Agent)

**Prerequisite**: API contract defined and agreed upon

### Step 2a: Domain & Database
- [ ] Definir ou atualizar entidades de domínio (`domain/entities/`)
- [ ] Criar ou atualizar value objects se necessário
- [ ] Escrever migration(s) para mudanças de schema
- [ ] Rodar migration localmente: `npm run migration:run`

### Step 2b: Application Layer
- [ ] Implementar use case(s) em `application/use-cases/`
- [ ] Definir interface de repository na camada de domínio se nova
- [ ] Escrever testes unitários para use cases (mockar todas as dependências)

### Step 2c: Infrastructure
- [ ] Implementar repository em `infrastructure/repositories/`
- [ ] Registrar módulo: providers, imports, exports

### Step 2d: Presentation
- [ ] Criar ou atualizar controller com DTOs e decorators Swagger
- [ ] Adicionar validação (`class-validator` em todos os DTOs)
- [ ] Escrever testes de integração contra a camada HTTP real

**Gate**: Todos os testes unitários + integração passando. `npm run test` está verde.

---

## Phase 3: Frontend Implementation (Frontend Agent)

**Prerequisite**: Backend API endpoints disponíveis (ou mockados via MSW)

### Step 3a: Data Layer
- [ ] Definir tipos TypeScript para shapes de resposta da API
- [ ] Criar função de serviço/fetch para as novas chamadas de API
- [ ] Configurar handler MSW para mocking no desenvolvimento local

### Step 3b: Components
- [ ] Construir novos componentes seguindo `docs/agents/frontend.agent.md`
- [ ] Aplicar design tokens de `docs/context/ui-guidelines.md`
- [ ] Tratar todos os estados: loading, empty, error, data
- [ ] Escrever testes de componentes

### Step 3c: Page / Route
- [ ] Criar ou atualizar página Next.js seguindo `docs/agents/frontend.agent.md` e `docs/context/decisions.md`
- [ ] Configurar metadata adequado
- [ ] Adicionar `loading.tsx` e `error.tsx` se rota faz data-fetching

**Gate**: Todos os testes de componentes passando. Feature funciona contra mocks MSW.

---

## Phase 4: Integration

- [ ] Apontar frontend para o backend real (remover mock MSW ou ajustar flag)
- [ ] Testar happy path end-to-end
- [ ] Testar casos de erro end-to-end
- [ ] Verificar estados de loading e empty
- [ ] Checar responsividade mobile (ao menos 375px e 768px)
- [ ] Checar acessibilidade (navegação por teclado, screen reader)

---

## Phase 5: Review (Reviewer Agent)

- [ ] Auto-revisão usando checklist em `docs/agents/reviewer.agent.md`
- [ ] Abrir PR com descrição: o que mudou, por quê, como testar
- [ ] Resolver todos os itens BLOCKER e WARNING
- [ ] Obter aprovação de ao menos um outro agente ou membro do time

**Gate**: Sem BLOCKERs não resolvidos. CI passa.

---

## Phase 6: Deploy

Seguir `docs/workflows/release-process.md`.

---

## Phase 7: Documentation (pós-merge para `main`)

Checklist mínimo após cada merge:
- [ ] `docs/changelog/YYYY-MM-DD.md` atualizado
- [ ] `docs/context/current-state.md` atualizado
- [ ] `.env.example` atualizado se novas variáveis foram adicionadas
- [ ] `docs/architecture/overview.md` atualizado se houve decisão arquitetural nova

---

## Definition of Done

A feature is done when:
- [ ] All acceptance criteria from the planning phase are met
- [ ] Unit, integration, and (if applicable) E2E tests are passing
- [ ] Code is reviewed and approved
- [ ] Feature is deployed to staging and verified
- [ ] No regressions in existing features
- [ ] `docs/architecture/overview.md` updated if any architectural decision was made
