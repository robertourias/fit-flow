# Plano Técnico: Setup do Monorepo com Turborepo, Docker e Supabase

**Spec:** `docs/specs/2026-05-26-monorepo-setup.md`
**Status:** approved
**Data:** 2026-05-26

---

## Contrato de Ambiente

| Serviço | Local | Variável de Ambiente |
|---------|-------|---------------------|
| Next.js (web) | `localhost:3000` | — |
| NestJS (api) | `localhost:3001` | `PORT=3001` |
| PostgreSQL | `localhost:5432` | `DATABASE_URL` |
| Supabase REST/Auth | `localhost:54321` | `SUPABASE_URL` |
| Supabase Studio | `localhost:54323` | — |

### Variáveis de ambiente por serviço

**apps/api `.env.example`:**
```
DATABASE_URL=postgresql://postgres:postgres@db:5432/postgres
PORT=3001
NODE_ENV=development
```

**apps/web `.env.example`:**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key-local>
```

---

## Estratégia de Supabase Local

> O Supabase CLI usa Docker internamente — rodar CLI dentro do Compose cria Docker-in-Docker.
> **Abordagem adotada:** usar o docker-compose oficial do Supabase (subset das imagens oficiais) integrado ao docker-compose.yml do projeto. Isso replica exatamente o comportamento do `supabase start` sem Docker-in-Docker.

Serviços Supabase incluídos no Compose local:
- `supabase/postgres` → banco de dados
- `supabase/studio` → painel visual
- `postgrest/postgrest` → REST API
- `supabase/gotrue` → autenticação (GoTrue)
- `kong` → API gateway (proxy para PostgREST + GoTrue)

---

## Tarefas (ordenadas por dependência)

---

### T1 — Estrutura raiz do monorepo
**Tipo:** chore | **Agente:** ambos | **Depende de:** nada

Criar a fundação do monorepo: pnpm workspaces, configurações raiz e estrutura de diretórios. Sem isso nenhum app ou package pode ser scaffolado.

**Critérios de aceite:**
- [ ] `package.json` raiz com `"workspaces": ["apps/*", "packages/*"]` e scripts: `dev`, `build`, `lint`, `test` delegando ao turbo
- [ ] `.npmrc` com `shamefully-hoist=false` e `strict-peer-dependencies=false`
- [ ] `turbo.json` com esqueleto de pipelines (`build`, `dev`, `lint`, `test`)
- [ ] `.gitignore` raiz cobrindo: `node_modules`, `.turbo`, `.next`, `dist`, `.env`, `.env.local`, `.env.production`
- [ ] `pnpm install` roda sem erros na raiz (sem apps ainda)
- [ ] Estrutura de diretórios criada: `apps/`, `packages/`

**Notas:** Usar pnpm `9.x`. Turborepo `^2.x`. Node mínimo `20.x` (declarar em `package.json` engines).

---

### T2 — Packages compartilhados
**Tipo:** chore | **Agente:** ambos | **Depende de:** T1

Criar os quatro packages que serão consumidos pelos apps. Devem ser TypeScript-first e exportar corretamente via `exports` no `package.json`.

**Critérios de aceite:**
- [ ] `packages/config` com `tsconfig.base.json` (target ES2022, moduleResolution bundler), config ESLint base e config Tailwind base exportados
- [ ] `packages/types` com `index.ts` exportando tipos compartilhados iniciais (ex: `ApiResponse<T>`)
- [ ] `packages/utils` com `index.ts` exportando ao menos uma função utilitária (ex: `cn()` para classnames)
- [ ] `packages/ui` com esqueleto de componente (ex: `Button`) usando Tailwind e exportando via `"exports": {"./button": "./src/button.tsx"}`
- [ ] Cada package tem `package.json` com `name: "@fitflow/<nome>"`, `private: true` e campo `main`/`exports`
- [ ] `pnpm turbo build --filter=./packages/*` executa sem erros

**Notas:** Não instalar dependências de runtime nos packages por ora — foco em tipos e config. `packages/ui` dependerá do Tailwind do consuming app (peer dependency).

---

### T3 — App Next.js (apps/web)
**Tipo:** chore | **Agente:** frontend | **Depende de:** T2 | **Paralelo com:** T4

Inicializar o app Next.js com App Router, configurado para usar os packages compartilhados do monorepo.

**Critérios de aceite:**
- [ ] `apps/web` criado com Next.js 15+ (App Router), TypeScript, Tailwind CSS
- [ ] `tsconfig.json` extende `@fitflow/config/tsconfig.base.json`
- [ ] Tailwind configurado via preset de `@fitflow/config`
- [ ] `package.json` com `name: "@fitflow/web"` e dependência de `@fitflow/ui`, `@fitflow/types`, `@fitflow/utils`
- [ ] Rota raiz `/` renderiza uma página placeholder sem erros
- [ ] `pnpm turbo dev --filter=@fitflow/web` inicia o servidor em `localhost:3000`

**Notas:** Usar `create-next-app` ou scaffold manual. Não configurar autenticação (fora do escopo).

---

### T4 — App NestJS + Prisma (apps/api)
**Tipo:** chore | **Agente:** backend | **Depende de:** T2 | **Paralelo com:** T3

Inicializar o app NestJS com Prisma ORM configurado para conectar ao PostgreSQL via `DATABASE_URL`.

**Critérios de aceite:**
- [ ] `apps/api` criado com NestJS 10+, TypeScript strict
- [ ] `tsconfig.json` extende `@fitflow/config/tsconfig.base.json`
- [ ] Prisma instalado com `schema.prisma` configurando `provider = "postgresql"` e `datasource db { url = env("DATABASE_URL") }`
- [ ] `package.json` com `name: "@fitflow/api"` e dependência de `@fitflow/types`
- [ ] Endpoint de health check: `GET /health` retorna `{ status: "ok" }` com HTTP 200
- [ ] Porta configurada via variável `PORT` (default `3001`) em `main.ts`
- [ ] `pnpm turbo dev --filter=@fitflow/api` inicia o servidor em `localhost:3001`

**Notas:** Não criar migrations ainda — o schema inicial será vazio. `PORT` deve ser lido de `process.env.PORT` para compatibilidade com Railway.

---

### T5 — turbo.json com pipelines completos
**Tipo:** chore | **Agente:** ambos | **Depende de:** T3, T4

Completar o `turbo.json` com todos os pipelines e dependências corretas entre apps e packages, garantindo builds incrementais e cache eficiente.

**Critérios de aceite:**
- [ ] Pipeline `build`: apps dependem do build dos packages (`"dependsOn": ["^build"]`); outputs: `.next/**`, `dist/**`
- [ ] Pipeline `dev`: sem cache (`"cache": false`), sem dependências (`"dependsOn": []`), persistente (`"persistent": true`)
- [ ] Pipeline `lint`: sem cache de outputs, roda em paralelo
- [ ] Pipeline `test`: sem cache de outputs, roda em paralelo
- [ ] `pnpm turbo build` executa build de packages antes dos apps, sem erros
- [ ] Segunda execução de `pnpm turbo build` usa cache (output: `>>> FULL TURBO`)

**Notas:** Configurar `TURBO_TOKEN` e `TURBO_TEAM` como placeholders no `.env.example` raiz para habilitar Turbo Remote Cache futuramente.

---

### T6 — Dockerfile multi-stage para Next.js
**Tipo:** chore | **Agente:** frontend | **Depende de:** T3 | **Paralelo com:** T7

Criar Dockerfile para `apps/web` com build multi-stage otimizado para execução no Docker Compose local.

**Critérios de aceite:**
- [ ] Stages: `deps` (instala dependências), `builder` (build Next.js), `runner` (imagem final slim)
- [ ] Imagem base: `node:20-alpine`
- [ ] Suporte a monorepo: copia `package.json` raiz, `pnpm-workspace.yaml`, `packages/*` e `apps/web`
- [ ] `WATCHPACK_POLLING=true` configurado para hot-reload funcionar com volume binding no Docker
- [ ] Expõe porta `3000`
- [ ] Build da imagem sem erros: `docker build -f apps/web/Dockerfile .` (contexto na raiz)

**Notas:** O contexto do Docker build deve ser a raiz do monorepo (não `apps/web/`) para ter acesso aos packages. Usar `.dockerignore` na raiz cobrindo `node_modules`, `.next`, `.turbo`.

---

### T7 — Dockerfile multi-stage para NestJS
**Tipo:** chore | **Agente:** backend | **Depende de:** T4 | **Paralelo com:** T6

Criar Dockerfile para `apps/api` com build multi-stage otimizado para produção no Railway.

**Critérios de aceite:**
- [ ] Stages: `deps` (instala dependências), `builder` (compila TypeScript), `production` (imagem final sem devDependencies)
- [ ] Imagem base: `node:20-alpine`
- [ ] Suporte a monorepo: copia `package.json` raiz, `pnpm-workspace.yaml`, `packages/*` e `apps/api`
- [ ] `CMD ["node", "dist/main.js"]` na imagem final
- [ ] Porta exposta via `EXPOSE $PORT` (variável, não hardcoded)
- [ ] Build da imagem sem erros: `docker build -f apps/api/Dockerfile .` (contexto na raiz)
- [ ] `prisma generate` executado durante o build

**Notas:** No Railway, a variável `PORT` é injetada automaticamente. A imagem não deve ter `ts-node` em produção — apenas o JS compilado.

---

### T8 — Docker Compose completo
**Tipo:** chore | **Agente:** ambos | **Depende de:** T6, T7

Criar o `docker-compose.yml` na raiz orquestrando todos os serviços com health checks, volumes e rede interna.

**Critérios de aceite:**
- [ ] Serviço `web`: build via `apps/web/Dockerfile`, porta `3000:3000`, volume para hot-reload (`./apps/web:/app/apps/web`), env_file `.env.web`
- [ ] Serviço `api`: build via `apps/api/Dockerfile`, porta `3001:3001`, env_file `.env.api`, health check em `GET /health`, depende de `db` estar healthy
- [ ] Serviço `db` (supabase/postgres): imagem `supabase/postgres:15`, porta `5432:5432`, volume persistente, health check via `pg_isready`
- [ ] Serviço `studio` (Supabase Studio): imagem `supabase/studio`, porta `54323:3000`, depende de `db`
- [ ] Serviço `rest` (PostgREST): imagem `postgrest/postgrest`, porta `54321:3000`, conecta ao `db`, depende de `db`
- [ ] Todos os serviços na mesma rede interna (`fitflow-net`)
- [ ] `docker compose up` sobe todos os serviços sem erros
- [ ] `docker compose up --build` reconstrói e sobe sem erros
- [ ] `docker compose down -v` derruba e limpa volumes

**Notas:** Usar `docker-compose.yml` (não `docker-compose.yaml`). O `DATABASE_URL` interno do Compose usa hostname `db` (não `localhost`). Documentar no README que `localhost` é usado fora do Compose.

---

### T9 — Variáveis de ambiente e .gitignore
**Tipo:** chore | **Agente:** ambos | **Depende de:** T3, T4 | **Paralelo com:** T6, T7

Organizar variáveis de ambiente por serviço e garantir que nenhum segredo seja comitado.

**Critérios de aceite:**
- [ ] `apps/web/.env.example` documenta todas as variáveis de `apps/web`
- [ ] `apps/api/.env.example` documenta todas as variáveis de `apps/api`
- [ ] `.env.example` na raiz documenta variáveis do Docker Compose (senhas do Supabase local, etc.)
- [ ] `.gitignore` raiz cobre: `.env`, `.env.local`, `.env.production`, `.env.*.local`
- [ ] Nenhum arquivo `.env` real existe no repositório (verificar com `git status`)
- [ ] README de desenvolvimento referencia os `.env.example`

**Notas:** Senhas do Supabase local (ex: `POSTGRES_PASSWORD=postgres`) podem ter valores default no `.env.example` pois são apenas para desenvolvimento.

---

### T10 — Validação e README de desenvolvimento
**Tipo:** chore | **Agente:** ambos | **Depende de:** T8, T9

Validar que toda a stack funciona conforme os critérios de sucesso do spec e documentar o fluxo de setup local.

**Critérios de aceite:**
- [ ] `docker compose up` sobe todos os serviços sem erros e todos ficam healthy
- [ ] `curl localhost:3000` retorna HTML da página placeholder do Next.js
- [ ] `curl localhost:3001/health` retorna `{"status":"ok"}`
- [ ] `curl localhost:54321/rest/v1/` retorna resposta do PostgREST
- [ ] `localhost:54323` carrega o Supabase Studio no browser
- [ ] `pnpm turbo build` na raiz compila todos os apps e packages sem erros
- [ ] `README.md` na raiz documenta: pré-requisitos, como copiar `.env.example`, como rodar `docker compose up`, portas de cada serviço
- [ ] `docs/architecture/infra.md` atualizado com hosting (Railway/Supabase/Vercel) e variáveis obrigatórias

**Notas:** Esta tarefa é o gate de qualidade — só marcar como concluída quando todos os critérios do spec estiverem verificados.

---

## Diagrama de Dependências

```
T1 (raiz)
  └─ T2 (packages)
       ├─ T3 (web)    ──── T6 (Dockerfile web) ──┐
       └─ T4 (api)    ──── T7 (Dockerfile api) ──┤── T8 (Compose) ──┐
                      └─ T5 (turbo.json)          └─ T9 (env vars) ──┤
                                                                      └─ T10 (validação)
```

## Ordem de execução sugerida

| Rodada | Tarefas (podem ser paralelas) |
|--------|-------------------------------|
| 1 | T1 |
| 2 | T2 |
| 3 | T3, T4 |
| 4 | T5, T6, T7, T9 |
| 5 | T8 |
| 6 | T10 |
