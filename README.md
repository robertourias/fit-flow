# FitFlow

Plataforma de gestão de treinos para preparadores físicos e alunos.

Monorepo com Next.js (web), NestJS (api) e packages compartilhados, orquestrado por Turborepo e Docker Compose.

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|------------|---------------|
| Node.js | 20.x |
| pnpm | 9.x |
| Docker | 24.x |
| Docker Compose | v2 (plugin) |

Instalar pnpm via corepack:

```sh
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

---

## Setup inicial

### 1. Instalar dependências

```sh
pnpm install
```

### 2. Configurar variáveis de ambiente

```sh
# Variáveis do Docker Compose (banco, Redis, portas)
cp .env.example .env

# Variáveis do Next.js
cp apps/web/.env.example apps/web/.env.local

# Variáveis do NestJS
cp apps/api/.env.example apps/api/.env
```

Edite os arquivos copiados e preencha os valores marcados com `<...>` (chaves do Supabase local, por exemplo).

---

## Rodar com Docker Compose

### Só infra (PostgreSQL + Redis)

```sh
docker compose up
```

Útil quando o Next.js e o NestJS rodam fora do Docker (modo `pnpm dev`).

### Stack completa (infra + api + web)

```sh
docker compose --profile app up --build
```

### Com maildev (SMTP local para jobs de e-mail)

```sh
docker compose --profile app --profile tools up --build
```

### Parar e limpar volumes

```sh
docker compose down -v
```

---

## Portas dos serviços

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Next.js | http://localhost:3000 | Frontend |
| NestJS | http://localhost:3001 | Backend API (`/api/v1/`) |
| PostgreSQL | localhost:5432 | Banco de dados |
| Redis | localhost:6379 | Cache / filas BullMQ |
| Maildev (UI) | http://localhost:1080 | Visualizador de e-mails (profile: tools) |

> Dentro da rede Docker, o NestJS acessa o banco via hostname `db` (não `localhost`).
> O `DATABASE_URL` para uso fora do Docker usa `localhost:5432`.

---

## Desenvolvimento local (sem Docker)

Suba apenas a infra e rode os apps com hot-reload nativo:

```sh
# Terminal 1: banco + Redis
docker compose up

# Terminal 2: todos os apps em paralelo
pnpm dev

# Ou filtrando por app
pnpm turbo dev --filter=@fitflow/web
pnpm turbo dev --filter=@fitflow/api
```

---

## Comandos úteis

```sh
# Build de todos os apps e packages
pnpm build

# Lint
pnpm lint

# Testes
pnpm test

# Limpar outputs de build
pnpm clean

# Build de um app específico
pnpm turbo build --filter=@fitflow/web
```

---

## Estrutura do projeto

```
apps/
  web/        Next.js 15 (App Router) — porta 3000
  api/        NestJS + Prisma — porta 3001
packages/
  ui/         Componentes React compartilhados (shadcn/ui)
  types/      Tipos TypeScript compartilhados
  utils/      Funções utilitárias (cn, etc.)
  config/     Configs de ESLint, TypeScript e Tailwind
docs/         Contexto persistente para agentes de IA
```

---

## Validar o ambiente

Após subir a stack completa com `docker compose --profile app up --build`, verifique cada serviço:

```sh
# Frontend (retorna HTML)
curl -s http://localhost:3000 | head -5

# API health check (retorna {"status":"ok"})
curl http://localhost:3001/api/v1/health

# Banco de dados (via psql ou ferramenta de sua preferência)
psql postgresql://postgres:postgres@localhost:5432/fitflow -c "SELECT 1"
```

---

## Documentação técnica

- [Visão geral da arquitetura](docs/architecture/overview.md)
- [Infraestrutura e deploy](docs/architecture/infra.md)
- [Convenções do projeto](docs/context/conventions.md)
- [Decisões técnicas](docs/context/decisions.md)
