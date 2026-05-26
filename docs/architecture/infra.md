# Infrastructure

> Ambiente, deploy e dependências externas.

## Ambientes

| Ambiente | URL | Deploy trigger |
|----------|-----|----------------|
| Development | localhost | manual (`docker compose up`) |
| Production | a definir | push para `main` (CI/CD — spec separado) |

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

> A ser definido em spec separado.

Planejado: GitHub Actions com:
- `pnpm turbo build` + lint em PRs
- Deploy automático para Vercel (Next.js) e Railway (NestJS) no merge para `main`
- `TURBO_TOKEN` + `TURBO_TEAM` para cache remoto do Turborepo
