# Infrastructure

> Ambiente, deploy e dependências externas.

## Ambientes

| Ambiente | URL | Deploy trigger |
|----------|-----|----------------|
| Development | localhost | manual (`docker compose up`) |
| Production | Vercel (web) + Railway (api/db/redis) — URLs definidas no primeiro deploy manual (ver seção CI/CD) | `workflow_dispatch` manual (primeira vez) ou push para `main` (`.github/workflows/deploy.yml`, TASK19/T6) |

---

## Hosting por serviço

| Serviço | Plataforma | Observações |
|---------|-----------|-------------|
| Frontend (Next.js) | Vercel | Deploy automático via Git integration — spec separado |
| Backend (NestJS) | Railway | Imagem Docker multi-stage; `PORT` injetada pelo Railway |
| Banco de dados | Railway (PostgreSQL) | `DATABASE_URL` fornecida pelo Railway no painel |
| Object Storage | Supabase Storage | Uploads de imagens e assets |
| Auth | NextAuth.js | Integrado ao Next.js; sessões gerenciadas na app |
| Cache / Filas | Redis (Railway) | Compartilhado com BullMQ para jobs assíncronos |

---

## Ambiente local (Docker Compose)

```
Host
  localhost:3000 → [web]    ┐
  localhost:3001 → [api]    ├─── rede: frontend
                  [api]     ┐
  localhost:5432 → [db]     ├─── rede: backend
  localhost:6379 → [redis]  ┘
  localhost:1080 → [maildev] ─── rede: backend (profile: tools)

  [api] → DATABASE_URL: postgresql://db:5432/...
  [api] → REDIS_URL:    redis://redis:6379
```

`web` e `api` estão na rede `frontend`; `api`, `db`, `redis` e `maildev` estão na rede `backend`. O `web` não acessa `db` ou `redis` diretamente — apenas via `api`.

Perfis disponíveis:
- `(padrão)` — só infra: `db` + `redis`
- `app` — + `api` + `web` (imagens Docker de produção)
- `tools` — + `maildev` (SMTP local)

---

## Variáveis de ambiente obrigatórias

### apps/api (NestJS — Railway)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL (`postgresql://...`) |
| `PORT` | Porta do servidor (Railway injeta automaticamente) |
| `NODE_ENV` | `production` |
| `REDIS_URL` | Connection string Redis (`redis://...`) |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço — nunca expor ao browser |

### apps/web (Next.js — Vercel)

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | URL pública da API NestJS |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública do Supabase (Anon Key scope) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |

> Variáveis `NEXT_PUBLIC_*` são compiladas no bundle — nunca coloque segredos nelas.

---

## Serviços externos

| Serviço | Propósito | Crítico? |
|---------|-----------|----------|
| Railway (PostgreSQL) | Banco de dados em produção | Sim |
| Railway (Redis) | Cache e filas BullMQ | Sim |
| Supabase Storage | Upload de arquivos (imagens, assets) | Não (degradação suave) |
| Vercel | Hosting e CDN do frontend | Sim |

---

## CI/CD

> Implementado na TASK19 (T6). Dois workflows em `.github/workflows/`.

### `ci.yml` — validação de PR/push

Trigger: todo `pull_request` e `push` (qualquer branch). Job único `ci`, steps sequenciais:

1. Checkout (`actions/checkout@v4`)
2. `corepack enable`
3. Setup Node 20 + pnpm com cache (`actions/setup-node@v4`, `cache: pnpm`)
4. `pnpm install --frozen-lockfile`
5. Lint: `pnpm turbo lint` (cobre `tsc --noEmit` de `apps/api`/`packages/*`, cujo script `lint` já é o typecheck)
6. Typecheck explícito de `apps/web`: `pnpm --filter @fitflow/web exec tsc --noEmit` (o `lint` do web é `next lint`, ESLint puro, sem typecheck)
7. Testes com cobertura: `pnpm turbo test -- --coverage` — falha se algum pacote cair abaixo do `coverageThreshold` configurado em `apps/api/jest.config.js`/`apps/web/jest.config.js` (ver seção "Baselines de cobertura" em `docs/context/current-state.md`)
8. Build: `pnpm turbo build`

PR fica vermelho (job falha) se qualquer step falhar. `TURBO_TOKEN`/`TURBO_TEAM` (cache remoto do Turborepo) são opcionais — se ausentes, o workflow roda normalmente sem cache remoto (`env:` apenas referencia `secrets.*`, não há passo que falhe na ausência deles).

### `deploy.yml` — deploy manual/automático

Trigger: `workflow_dispatch` (manual, botão "Run workflow" no GitHub Actions) e `push` para `main`. Dois jobs independentes:

- **`deploy-web`** (Vercel): primeiro step verifica `secrets.VERCEL_TOKEN`; se ausente, grava `skip=true` no `GITHUB_OUTPUT` e loga `::warning::` — todos os steps seguintes (`checkout`, setup Node/pnpm, install, `pnpm dlx vercel deploy --prod --token=... --cwd apps/web`) usam `if: steps.check-secret.outputs.skip == 'false'` e são pulados, **o job não falha**. Usa também `secrets.VERCEL_ORG_ID`/`secrets.VERCEL_PROJECT_ID` como env vars do passo de deploy.
- **`deploy-api`** (Railway): mesmo padrão, checando `secrets.RAILWAY_TOKEN`; se presente, roda `npx -y @railway/cli up --service api`.

Nenhum secret é commitado em texto — todas as referências usam `${{ secrets.* }}`. Sem os secrets configurados, `deploy.yml` roda e termina verde, mas não publica nada (skip limpo) — é o estado esperado até o primeiro deploy manual ser feito (ver passo a passo abaixo).

### Secrets necessários (GitHub Settings → Secrets and variables → Actions)

| Secret | Usado em | Obrigatório? | Onde obter |
|--------|----------|---------------|------------|
| `VERCEL_TOKEN` | `deploy.yml` → `deploy-web` | Sim, para deploy do frontend | Vercel → Account Settings → Tokens |
| `VERCEL_ORG_ID` | `deploy.yml` → `deploy-web` | Sim, para deploy do frontend | Vercel → Project Settings → General (ou `.vercel/project.json` após `vercel link`) |
| `VERCEL_PROJECT_ID` | `deploy.yml` → `deploy-web` | Sim, para deploy do frontend | Idem acima |
| `RAILWAY_TOKEN` | `deploy.yml` → `deploy-api` | Sim, para deploy do backend | Railway → Project Settings → Tokens |
| `TURBO_TOKEN` | `ci.yml`, `deploy.yml` (cache remoto) | Não — opcional | Vercel Remote Cache (`turbo login`) |
| `TURBO_TEAM` | `ci.yml`, `deploy.yml` (cache remoto) | Não — opcional | Idem acima |
| `SENTRY_DSN` | runtime `apps/api` (não é secret de workflow, é env var do Railway) | Não — opcional, ativa Sentry no backend (T3) | Sentry → Project Settings → Client Keys (DSN) |
| `NEXT_PUBLIC_SENTRY_DSN` | runtime `apps/web` (não é secret de workflow, é env var do Vercel) | Não — opcional, ativa Sentry no frontend (T4) | Idem acima (projeto Sentry do tipo Next.js) |

> `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` não são consumidas pelos workflows do GitHub Actions — são variáveis de ambiente de runtime configuradas direto no painel do Railway (`SENTRY_DSN`) e do Vercel (`NEXT_PUBLIC_SENTRY_DSN`). Sem elas, Sentry fica em no-op (nenhuma chamada de rede), conforme FR-004 da TASK19.

### Passo a passo do primeiro deploy manual

Pré-requisito: acesso de administrador ao repositório GitHub (para configurar secrets) e aos serviços abaixo.

1. **Criar conta e projeto na Vercel**: acesse https://vercel.com/signup, crie a conta (pode usar login com GitHub). Em "Add New Project", importe o repositório `fit-flow` e configure o Root Directory como `apps/web` (Vercel detecta Next.js automaticamente). Não finalize o primeiro deploy pela UI se quiser que o primeiro deploy real venha do GitHub Actions — basta criar o projeto vinculado.
2. **Obter `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID`**: localmente, rode `npx vercel link` dentro de `apps/web` e selecione o projeto criado no passo 1; o arquivo gerado `apps/web/.vercel/project.json` contém `orgId` e `projectId`. (Alternativa: Vercel → Project Settings → General mostra o `Project ID`; o `Org ID`/Team ID aparece em Account/Team Settings → General.)
3. **Obter `VERCEL_TOKEN`**: Vercel → Account Settings → Tokens → Create Token. Copie o valor (só é exibido uma vez).
4. **Criar conta e projeto no Railway**: acesse https://railway.app, crie a conta, crie um novo projeto vazio (ou importe o repositório). Adicione os serviços necessários: PostgreSQL (plugin), Redis (plugin), e um serviço `api` apontando para `apps/api/Dockerfile` (build via Dockerfile, contexto = raiz do monorepo, conforme comentário no topo do `Dockerfile`).
5. **Configurar variáveis de ambiente no serviço `api` do Railway**: `DATABASE_URL` e `REDIS_URL` (Railway injeta automaticamente ao linkar os plugins PostgreSQL/Redis ao serviço), `NODE_ENV=production`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, e opcionalmente `SENTRY_DSN` (ver tabela acima).
6. **Obter `RAILWAY_TOKEN`**: Railway → Project Settings → Tokens → Create Token (token de projeto, não de conta pessoal, para escopar o acesso do CI a este projeto).
7. **Configurar variáveis de ambiente no projeto Vercel**: `NEXT_PUBLIC_API_URL` (URL pública do serviço `api` no Railway, gerada após o primeiro deploy do backend), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, e opcionalmente `NEXT_PUBLIC_SENTRY_DSN`.
8. **Cadastrar os secrets no GitHub**: no repositório, acesse Settings → Secrets and variables → Actions → New repository secret. Cadastre, um por um: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `RAILWAY_TOKEN` (os 4 obrigatórios para o deploy funcionar; `TURBO_TOKEN`/`TURBO_TEAM` são opcionais).
9. **Disparar o primeiro deploy**: no GitHub, aba Actions → workflow "Deploy" → "Run workflow" (`workflow_dispatch`) → branch `main` → Run workflow. Acompanhe os jobs `deploy-web` e `deploy-api`; ambos devem rodar (não mais "skip") e terminar verdes.
10. **Validar**: acesse a URL pública gerada pela Vercel (frontend) e confirme que ele consegue se comunicar com a URL pública do Railway (backend) — checar `GET /health` e `GET /metrics` do backend respondem, e que o frontend carrega sem erro de rede.
11. **Deploys seguintes**: depois deste primeiro deploy manual, qualquer `push` para `main` aciona `deploy.yml` automaticamente (mesmo trigger de `workflow_dispatch` já cobre `push: branches: [main]`) — não é necessário repetir os passos acima, apenas manter os secrets válidos.

> Diagnóstico de falha de migration em produção: se `prisma migrate deploy` falhar no boot do container (`apps/api/Dockerfile`, ver FR-006/T5), o processo Node **não inicia** (exit code propagado) e o Railway mostra o serviço como falho/crash-loop — isso é o comportamento esperado (evita rodar com schema inconsistente). Consulte os logs do serviço no painel do Railway para ver o erro exato do Prisma; corrija a migration e faça um novo deploy. Para pular migrations temporariamente (ex.: debugar outro problema sem aplicar schema), defina `SKIP_MIGRATIONS=1` na env do serviço.
