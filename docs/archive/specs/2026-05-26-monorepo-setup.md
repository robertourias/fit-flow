# Spec: Setup do Monorepo com Turborepo, Docker e Supabase

**Status:** approved
**Data:** 2026-05-26
**Autor:** planner-agent

---

## Problema

O projeto FitFlow ainda não possui uma base de código estruturada. Antes de qualquer feature ser desenvolvida, é necessário criar o monorepo com Turborepo, configurar o Docker para orquestrar todos os serviços localmente e definir a estratégia de deploy em produção. Sem essa fundação, o desenvolvimento paralelo de frontend e backend é inviável e os ambientes local e produção ficam desalinhados.

---

## Cenários de Usuário

- **P1 (crítico):** Como desenvolvedor, quero subir todos os serviços (Next.js, NestJS, Supabase) com um único comando (`docker compose up`), para que o ambiente local esteja pronto sem configuração manual.
- **P1 (crítico):** Como desenvolvedor, quero que o NestJS seja empacotado como imagem Docker e deployado no Railway, para ter o backend em produção de forma reproduzível.
- **P2 (importante):** Como desenvolvedor, quero que o Turborepo gerencie os builds e scripts do monorepo, para que eu possa rodar apenas o que mudou e aproveitar cache de build.
- **P2 (importante):** Como desenvolvedor, quero que o Supabase local (via Supabase CLI) seja inicializado automaticamente pelo Docker Compose, para ter um ambiente de banco isolado igual ao de produção.
- **P3 (nice-to-have):** Como desenvolvedor, quero que variáveis de ambiente estejam organizadas por serviço e por ambiente (`.env.local`, `.env.production`), para não confundir configurações entre ambientes.

---

## Requisitos Funcionais

- **FR-001:** O monorepo deve usar Turborepo com a seguinte estrutura: `apps/web` (Next.js), `apps/api` (NestJS), `packages/ui`, `packages/config`, `packages/types`, `packages/utils`.
- **FR-002:** O `docker-compose.yml` na raiz deve orquestrar três serviços: `web` (Next.js), `api` (NestJS) e `supabase` (via Supabase CLI ou imagem oficial do PostgreSQL com configurações do Supabase).
- **FR-003:** O serviço `api` deve ter um `Dockerfile` multi-stage (build + produção) compatível com deploy no Railway.
- **FR-004:** O serviço `web` deve ter um `Dockerfile` multi-stage para execução local dentro do Docker Compose.
- **FR-005:** O Supabase local deve expor PostgreSQL na porta `5432`, Studio na `54323` e a API REST/Auth na `54321`.
- **FR-006:** O NestJS deve conectar ao PostgreSQL via Prisma, usando a `DATABASE_URL` injetada por variável de ambiente.
- **FR-007:** Em produção, o NestJS (Railway) deve conectar ao Supabase cloud via `DATABASE_URL` fornecida pelo Supabase.
- **FR-008:** O Turborepo deve ter pipelines definidos em `turbo.json` para `build`, `dev`, `lint` e `test` com dependências corretas entre apps e packages.
- **FR-009:** O `package.json` raiz deve usar `pnpm workspaces` com scripts que delegam ao Turborepo (`dev`, `build`, `lint`).
- **FR-010:** Variáveis de ambiente sensíveis não devem ser comitadas; cada app deve ter um `.env.example` documentando todas as variáveis necessárias.

---

## Critérios de Sucesso

- [ ] `docker compose up` sobe os três serviços sem erros e todos ficam healthy.
- [ ] Next.js acessível em `http://localhost:3000` dentro do Docker.
- [ ] NestJS acessível em `http://localhost:3001` dentro do Docker.
- [ ] Supabase Studio acessível em `http://localhost:54323`.
- [ ] NestJS conecta ao PostgreSQL local (Supabase) via Prisma sem erros.
- [ ] `pnpm turbo build` executa o build de todos os apps e packages com sucesso.
- [ ] O `Dockerfile` do NestJS gera uma imagem válida e funcional para deploy no Railway.
- [ ] Não há segredos comitados no repositório (`.env` está no `.gitignore`).

---

## Fora do Escopo

- Configuração de CI/CD (GitHub Actions) — será feito em spec separado.
- Setup de autenticação (NextAuth) — será feito em spec separado.
- Configuração de Redis / BullMQ — será feito em spec separado.
- Deploy do Next.js no Vercel — será feito em spec separado.
- Migrations de banco de dados com dados reais — ambiente está em desenvolvimento inicial.
- Configuração de domínio customizado no Railway ou Supabase.

---

## Riscos e Premissas

- **Premissa:** O desenvolvedor tem Docker Desktop instalado e com permissão de execução.
- **Premissa:** O desenvolvedor tem conta no Supabase cloud e no Railway para produção.
- **Premissa:** pnpm está instalado globalmente na máquina de desenvolvimento.
- **Risco:** O Supabase CLI dentro do Docker Compose pode ter conflitos de porta com uma instância do Supabase já rodando localmente → Mitigação: documentar portas padrão e como sobrescrevê-las via `.env`.
- **Risco:** O Next.js em modo dev dentro do Docker tem hot-reload mais lento por causa do volume binding → Mitigação: usar `WATCHPACK_POLLING=true` e documentar a limitação.
- **Risco:** O Railway pode ter limitações na imagem Docker gerada (ex: porta hardcoded) → Mitigação: usar variável `PORT` no NestJS e expor dinamicamente.

---

<!--
GATE DE APROVAÇÃO
Para desbloquear a criação do plano técnico, altere o Status acima de "draft" para "approved".
O agente planner NÃO deve criar tasks de implementação enquanto Status for "draft".
-->
