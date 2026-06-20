# Spec & Plan: TASK19 — Hardening & Release

**Status:** approved
**Data:** 2026-06-19
**Autor:** Planner (IA)

---

## 1. Problema e Visão Geral

O produto cobre todo o roadmap funcional (Fases 0-9, TASK00-TASK18), mas roda hoje só em `docker compose up` local sem rede de segurança: nenhum CI valida PRs, não há observabilidade em produção (logs não estruturados, sem error tracking, sem métricas), a cobertura de testes nunca foi medida formalmente, e o entrypoint Docker da API sobe o processo mesmo se a migration de banco falhar. Esta spec endurece o projeto para release: pipeline de CI (lint/typecheck/test/build em PR), observabilidade (Pino, Sentry no-op-by-default, Prometheus), baseline de cobertura com gate anti-regressão, correção do entrypoint de migrations, e o esqueleto do workflow de deploy (Vercel + Railway) — sem provisionar contas/secrets nem executar o primeiro deploy real (decisão do usuário: isso é manual).

---

## 2. Cenários de Usuário

- **P1 (crítico):** Como desenvolvedor, quero que todo PR rode lint, typecheck, testes e build automaticamente, para não mergear código quebrado.
- **P1 (crítico):** Como desenvolvedor, quero que a cobertura de testes não regrida silenciosamente, para manter o nível de confiança já alcançado.
- **P1 (crítico):** Como operador, quero que o container da API não suba se a migration de banco falhar, para não rodar em produção com schema inconsistente.
- **P2 (importante):** Como operador, quero logs estruturados e métricas Prometheus expostas, para investigar incidentes em produção.
- **P2 (importante):** Como operador, quero que erros não tratados sejam reportados no Sentry quando eu configurar o DSN, sem precisar mudar código.
- **P3 (nice-to-have):** Como desenvolvedor, quero um workflow de deploy pronto (Vercel + Railway) que eu só precise acionar depois de configurar os secrets.

> P1 = sem isso o produto não funciona. P2 = valor claro mas contornável. P3 = melhoria futura.

---

## 3. Requisitos Funcionais

- **FR-001:** `.github/workflows/ci.yml` roda em todo PR e push: instala deps (`pnpm install --frozen-lockfile`), lint (`turbo lint`), typecheck (`turbo check-types` ou `tsc --noEmit` por pacote, conforme scripts existentes), testes com cobertura (`turbo test -- --coverage`), build (`turbo build`). PR fica vermelho se qualquer etapa falhar.
- **FR-002:** `apps/api/jest.config.js` e `apps/web/jest.config.js` ganham `coverageThreshold` calculado a partir do baseline real medido nesta tarefa (rodando a suíte completa com `--coverage` e arredondando para baixo) — **não** as metas aspiracionais de `docs/context/decisions.md` (90/80/60 backend, 70/90/100 frontend). CI falha se a cobertura cair abaixo do baseline registrado (ratchet anti-regressão); subir o baseline é trabalho futuro incremental, fora desta tarefa.
- **FR-003:** Backend usa logging estruturado via Pino (`nestjs-pino`), substituindo o logger padrão do Nest em todos os módulos, preservando o padrão de contexto já documentado (`this.logger.error('msg', { entityId, error })`).
- **FR-004:** Sentry inicializa condicionalmente: backend só ativa se `SENTRY_DSN` estiver definido no ambiente; frontend só ativa se `NEXT_PUBLIC_SENTRY_DSN` estiver definido. Sem a env var, nenhuma chamada de rede é feita e nenhum erro é lançado por falta de configuração.
- **FR-005:** Backend expõe `GET /metrics` (formato de exposição Prometheus, via `prom-client`) com métricas HTTP padrão (contagem e duração de requests por rota e status code), fora do prefixo `/api/v1` (rota de infra, não de produto) e sem autenticação (mesmo padrão do `/health` existente).
- **FR-006:** `apps/api/Dockerfile` para de usar `;` entre `prisma migrate deploy` e `node dist/main.js` — troca para `&&`/`exec` de forma que falha de migration impede o processo de subir (exit code propagado), respeitando `SKIP_MIGRATIONS=1` como já existe hoje.
- **FR-007:** `.github/workflows/deploy.yml` existe, acionável por `workflow_dispatch` e por push em `main`, mas cada job de deploy (Vercel, Railway) verifica se os secrets necessários existem (`vars`/`secrets` do GitHub Actions) e faz **skip** (não falha) quando ausentes — primeiro deploy real é manual, executado pelo usuário após provisionar as contas.
- **FR-008:** `docs/architecture/infra.md` documenta a lista de secrets do GitHub Actions necessários (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RAILWAY_TOKEN`, etc.) e o passo a passo do primeiro deploy manual.

---

## 4. Fora do Escopo & Riscos

- **Fora do Escopo:**
  - Bater as metas de cobertura completas de `docs/context/decisions.md` em código pré-existente (TASK00-TASK18) — só baseline + gate anti-regressão + gaps críticos óbvios (ex. use-case sem teste nenhum), por decisão do usuário.
  - Provisionar contas/projetos reais no Vercel e Railway, configurar secrets de produção, ou executar o primeiro deploy — manual, pelo usuário.
  - Configurar um DSN real do Sentry ou validar report de erro ponta-a-ponta contra uma conta real — wire-up no-op até o usuário fornecer o DSN.
  - Upgrade do `next-auth` de `5.0.0-beta.29` para uma versão estável (se existir) — troca de major/beta é risco de quebra de autenticação, não solicitado; segue como débito técnico registrado em `docs/context/current-state.md`.
  - Dashboards Grafana ou alerting sobre as métricas Prometheus — só o endpoint `/metrics` é exposto nesta fase.
- **Premissa:** Scripts `lint`, `check-types`/`tsc --noEmit`, `test`, `build` já existem e funcionam por pacote (confirmados ao longo das specs anteriores) — o workflow de CI só os orquestra via `turbo`, sem inventar novos scripts além do necessário para coverage.
- **Risco:** Baseline de cobertura medido pode ser baixo em módulos antigos mal testados, e o gate apenas trava regressão, não força melhoria. → Mitigação: aceito como trade-off desta fase (decisão do usuário); registrar o número exato do baseline na spec/checkpoint para visibilidade.
- **Risco:** Pino/Sentry/Prometheus podem interferir com o filtro global de exceções e interceptors já existentes. → Mitigação: testes de integração existentes (Supertest) continuam passando após a integração; checagem manual do fluxo de erro e do Swagger.
- **Risco:** `prisma migrate deploy` falhando e agora derrubando o processo pode causar crash-loop em produção se uma migration está de fato quebrada. → Mitigação: esse é o comportamento correto (falhar alto e visível é melhor que rodar com schema inconsistente); documentar em `infra.md` como diagnosticar.

---

## 5. Contratos de API

- `GET /metrics`
  - **Response:** texto formato de exposição Prometheus (`text/plain; version=0.0.4`)
  - Sem autenticação, fora do prefixo `/api/v1` (mesmo padrão do `GET /health` existente em `apps/api/src/health/`)

---

## 6. Plano de Implementação (Tarefas)

### Ordem de Execução & Dependências

| Onda | Tarefas (paralelas) | Pré-requisito |
|------|---------------------|----------------|
| 1    | T1, T2, T5           | —              |
| 2    | T3, T4               | T1, T2         |
| 3    | T6                   | T1-T5          |
| 4    | T7                   | T6             |

> T1 (gate de cobertura backend), T2 (gate de cobertura frontend) e T5 (fix do entrypoint Docker) tocam arquivos disjuntos e não dependem de nada — rodam em paralelo na Onda 1. T3 (observabilidade backend) e T4 (observabilidade frontend) precisam que o gate de cobertura já exista (T1/T2) para que o código novo que escrevem seja obrigado a vir com teste e não regrida o baseline — rodam em paralelo entre si na Onda 2. T6 (workflow de CI) só faz sentido depois que lint/test/build refletem o estado final do código (T1-T5), então fecha a Onda 3. T7 (documentação do runbook de deploy) referencia o conteúdo real de `deploy.yml` criado em T6, por isso vem por último.

### Tarefa 1: Baseline + gate de cobertura (Backend)
- **Tipo:** chore
- **Agente:** backend
- **Depende de:** — (nenhuma)
- **Paralelizável com:** T2, T5
- **Descrição:** Rodar `apps/api` com `jest --coverage` na suíte completa, registrar os números reais (statements/branches/functions/lines) no resumo da tarefa e em `docs/context/current-state.md`. Configurar `coverageThreshold` (global) em `apps/api/jest.config.js` com esses números arredondados para baixo (ex.: 1-2 pontos percentuais de margem para não quebrar por flutuação mínima). Adicionar script `"test:coverage": "jest --coverage"` em `apps/api/package.json` se não existir. Revisar o relatório de cobertura por arquivo: se algum use-case/controller de regra de negócio crítica estiver em 0% (sem teste nenhum), escrever o teste mínimo faltante — não perseguir 100%, só eliminar lacunas grosseiras.
- **Critérios de Aceite:**
  - [x] `jest --coverage` roda limpo e `coverageThreshold` reflete o baseline medido (CI falharia se cobertura cair abaixo dele).
  - [x] Nenhum use-case ou controller de regra de negócio crítica permanece em 0% de cobertura.
  - [x] Número do baseline registrado em `docs/context/current-state.md`.

### Tarefa 2: Baseline + gate de cobertura (Frontend)
- **Tipo:** chore
- **Agente:** frontend
- **Depende de:** — (nenhuma)
- **Paralelizável com:** T1, T5
- **Descrição:** Mesmo processo da Tarefa 1, em `apps/web`: rodar `jest --coverage`, registrar baseline real, configurar `coverageThreshold` em `apps/web/jest.config.js`, adicionar script `"test:coverage"` se não existir, e fechar lacunas grosseiras (hook ou componente de fluxo crítico em 0%).
- **Critérios de Aceite:**
  - [x] `jest --coverage` roda limpo e `coverageThreshold` reflete o baseline medido.
  - [x] Nenhum hook ou componente de fluxo crítico permanece em 0% de cobertura.
  - [x] Número do baseline registrado em `docs/context/current-state.md`.

### Tarefa 3: Observabilidade (Backend — Pino, Sentry, Prometheus)
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** T1
- **Paralelizável com:** T4
- **Descrição:** Instalar e configurar `nestjs-pino` substituindo o logger padrão do Nest em `apps/api/src/main.ts` (bootstrap com `app.useLogger(app.get(Logger))`), preservando o padrão de log com contexto já usado no projeto. Instalar `@sentry/nestjs` (ou `@sentry/node` + integração manual no filtro global de exceções existente), inicializando **somente** se `process.env.SENTRY_DSN` estiver definido (sem DSN, no-op total — não import side-effects que quebrem o boot). Instalar `prom-client`, criar `apps/api/src/metrics/` (`metrics.module.ts`, `metrics.controller.ts` com `GET /metrics` fora do prefixo global `/api/v1`, e um interceptor/middleware leve coletando duração e contagem de requests HTTP por rota/status, conforme Seção 5). Escrever testes cobrindo: o controller de métricas retorna formato Prometheus, Sentry não inicializa sem DSN (e inicializa se DSN mockado presente), e que o boot da aplicação não quebra com as três integrações.
- **Critérios de Aceite:**
  - [x] Logs do Nest saem estruturados via Pino (JSON em produção).
  - [x] Sem `SENTRY_DSN`, nenhuma chamada de rede ocorre (verificável por teste/mock); com `SENTRY_DSN` mockado, o SDK inicializa.
  - [x] `GET /metrics` retorna texto no formato de exposição Prometheus com pelo menos uma métrica de contagem e uma de duração de request HTTP.
  - [x] Suíte de testes completa de `apps/api` continua passando (incluindo os testes de integração e o gate de cobertura da T1).

### Tarefa 4: Observabilidade (Frontend — Sentry)
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T2
- **Paralelizável com:** T3
- **Descrição:** Instalar e configurar `@sentry/nextjs` em `apps/web` (config padrão gerado pelo wizard ou manual: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`), inicializando **somente** se `NEXT_PUBLIC_SENTRY_DSN` estiver definido — sem a env var, os arquivos de config devem ser no-op (early return antes de `Sentry.init`), sem quebrar o build nem o dev server. Escrever teste/verificação de que a ausência da env var não inicializa o SDK.
- **Critérios de Aceite:**
  - [x] Build (`next build`) e dev server continuam funcionando sem `NEXT_PUBLIC_SENTRY_DSN` definido.
  - [x] Sem a env var, `Sentry.init` não é chamado (verificável por teste com mock do módulo `@sentry/nextjs`).
  - [x] Suíte de testes completa de `apps/web` continua passando (incluindo o gate de cobertura da T2).

### Tarefa 5: Fix do entrypoint Docker (migrations falham alto)
- **Tipo:** fix
- **Agente:** backend
- **Depende de:** — (nenhuma)
- **Paralelizável com:** T1, T2
- **Descrição:** Em `apps/api/Dockerfile`, trocar a linha `CMD` final de `[ \"$SKIP_MIGRATIONS\" != \"1\" ] && prisma migrate deploy; node dist/main.js` para uma forma onde falha de `prisma migrate deploy` impede `node dist/main.js` de rodar (ex.: `CMD ["sh", "-c", "if [ \"$SKIP_MIGRATIONS\" != \"1\" ]; then prisma migrate deploy || exit 1; fi; exec node dist/main.js"]`). Validar localmente: (a) com migration válida e `SKIP_MIGRATIONS` não definido, o container sobe normalmente; (b) simulando uma migration inválida (ex. apontando `DATABASE_URL` para schema incompatível ou injetando uma migration quebrada num teste local), o container encerra com exit code != 0 e **não** chega a rodar `node dist/main.js`; (c) com `SKIP_MIGRATIONS=1`, migrations são puladas e o processo sobe normalmente, como hoje.
- **Critérios de Aceite:**
  - [x] Migration válida + `SKIP_MIGRATIONS` ausente → container sobe normalmente (`docker build` + `docker run` local).
  - [x] Migration inválida simulada → container falha com exit code != 0, processo Node nunca inicia.
  - [x] `SKIP_MIGRATIONS=1` → comportamento de pular migration preservado.

### Tarefa 6: Pipeline de CI/CD (GitHub Actions)
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** T1, T2, T3, T4, T5
- **Paralelizável com:** nenhuma
- **Descrição:** Criar `.github/workflows/ci.yml`: trigger em `pull_request` e `push` (qualquer branch), jobs (podem ser um único job com steps sequenciais ou jobs separados com cache de `pnpm`/`turbo` compartilhado): checkout, setup Node 20 + pnpm (corepack), `pnpm install --frozen-lockfile`, `turbo lint`, typecheck (`turbo check-types` se existir o script, senão `tsc --noEmit` por pacote), `turbo test -- --coverage` (respeitando os `coverageThreshold` das T1/T2), `turbo build`. Criar `.github/workflows/deploy.yml`: trigger em `workflow_dispatch` e `push` para `main`; dois jobs (`deploy-web`, `deploy-api`), cada um com um step inicial que verifica `secrets.VERCEL_TOKEN`/`secrets.RAILWAY_TOKEN` (conforme o job) e usa `if:` de job/step para pular (`skip`, não `failure`) quando o secret não existir — logue uma mensagem clara ("secret X não configurado, pulando deploy — configure em Settings > Secrets") em vez de falhar. Cache de `pnpm`/`turbo` (remote cache via `TURBO_TOKEN`/`TURBO_TEAM`, já citados em `.env.example`, são opcionais — não falhar se ausentes).
- **Critérios de Aceite:**
  - [x] `ci.yml` roda localmente validável com `act` ou, no mínimo, revisão manual de sintaxe (`actionlint`/yaml válido) — PR de teste real dispara o workflow e os 4 steps (lint/typecheck/test/build) aparecem no Actions. **Nota:** `act`/`actionlint` não estavam disponíveis neste ambiente (sem rede confiável para instalar); validado via `python -c "import yaml; yaml.safe_load(...)"` (YAML sintaticamente válido) + revisão manual da estrutura (`on`/`jobs`/`steps`/`if`/`uses` corretos) + reprodução de cada um dos 4 steps lógicos localmente com os comandos exatos do workflow (`pnpm turbo lint`, `pnpm --filter @fitflow/web exec tsc --noEmit`, `pnpm turbo test -- --coverage`, `pnpm turbo build`), todos com exit code 0. Não foi possível disparar o workflow real no GitHub Actions nesta sessão (sem rede/PR real) — risco residual de erros específicos do runner do Actions (versões de runner image, permissões) não detectáveis localmente.
  - [x] `deploy.yml` existe, é acionável via `workflow_dispatch`, e cada job de deploy faz skip limpo (não falha o workflow) quando o secret correspondente está ausente. Cada job (`deploy-web`, `deploy-api`) usa um step inicial que escreve `skip=true/false` em `GITHUB_OUTPUT` checando `secrets.VERCEL_TOKEN`/`secrets.RAILWAY_TOKEN`; todos os steps seguintes usam `if: steps.check-secret.outputs.skip == 'false'` (nunca falham, apenas pulam) e logam `::warning::` com mensagem clara de onde configurar o secret.
  - [x] Nenhum secret de produção é commitado no workflow (uso exclusivo de `${{ secrets.* }}`). Confirmado via grep: todas as 10 referências a secrets nos dois arquivos usam exclusivamente `${{ secrets.* }}`, nenhum valor literal.

### Tarefa 7: Documentação do runbook de deploy
- **Tipo:** chore
- **Agente:** backend
- **Depende de:** T6
- **Paralelizável com:** nenhuma
- **Descrição:** Atualizar `docs/architecture/infra.md`: preencher a seção "CI/CD" (hoje "a ser definido") com a descrição real dos workflows criados em T6, listar todos os secrets necessários (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RAILWAY_TOKEN`, `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` opcionais) e escrever um passo a passo numerado do primeiro deploy manual (criar conta/projeto Vercel, criar conta/projeto Railway, obter cada token, configurar em GitHub Settings > Secrets, disparar `workflow_dispatch`). Atualizar `docs/context/current-state.md`: marcar o débito "migrations automáticas no Docker" como resolvido (referenciar T5), registrar os baselines de cobertura (T1/T2) e o estado de CI/CD (T6) no resumo de progresso.
- **Critérios de Aceite:**
  - [x] `docs/architecture/infra.md` não tem mais a seção CI/CD como "a ser definido".
  - [x] Passo a passo do primeiro deploy manual é executável por alguém sem contexto prévio do projeto.
  - [x] `docs/context/current-state.md` reflete o estado real pós-TASK19 (débito de migration resolvido, baselines registrados).

---

<!--
GATE DE APROVAÇÃO
Revise as regras de negócio e as tarefas técnicas.
Se tudo estiver correto, altere o Status acima de "review" para "approved" para liberar os agentes de frontend/backend para iniciar a implementação.
-->
