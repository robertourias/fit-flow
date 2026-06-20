# syntax=docker/dockerfile:1
# Build context: monorepo root
# Usage: docker build -f apps/api/Dockerfile -t fitflow-api .

ARG NODE_VERSION=20

# ────────────────────────────────────────────────────────────────────────────
# pruner — turbo prune extrai somente os pacotes que @fitflow/api precisa
# ────────────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS pruner
RUN npm install -g turbo@2 --ignore-scripts
WORKDIR /repo
COPY . .
RUN turbo prune @fitflow/api --docker

# ────────────────────────────────────────────────────────────────────────────
# deps — instala dependências do lockfile podado
# ────────────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS deps
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /repo
COPY --from=pruner /repo/.npmrc ./
COPY --from=pruner /repo/out/json/ .
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ────────────────────────────────────────────────────────────────────────────
# builder — gera Prisma client, compila TypeScript, exporta bundle de prod
# ────────────────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /repo
COPY --from=pruner /repo/out/full/ .
# Prisma client precisa existir antes do tsc resolver os tipos de @fitflow/db
# (prisma é devDep de @fitflow/db, não de @fitflow/api — filtro deve apontar pro pacote certo)
RUN pnpm --filter @fitflow/db exec prisma generate
# turbo respeita dependsOn: ["^build"], portanto @fitflow/types é compilado antes
RUN pnpm exec turbo build --filter=@fitflow/api
# pnpm deploy cria /deploy com node_modules flat de prod (sem devDeps)
RUN pnpm --filter @fitflow/api deploy --prod /deploy
# pnpm deploy reinstala @prisma/client do zero em /deploy sem rodar `prisma generate`
# (prisma é devDep de @fitflow/db, fora do --prod) — fica com stub "did not initialize yet".
# Sobrescreve com o client real já gerado em /repo (mesmo hash .pnpm, mesmo lockfile).
RUN cp -r node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/* \
       /deploy/node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/

# ────────────────────────────────────────────────────────────────────────────
# runner — imagem mínima de produção
# ────────────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# prisma é devDep em apps/api — instalado globalmente para `prisma migrate deploy` no startup.
# Alternativa mais limpa: mover prisma de devDependencies para dependencies em apps/api/package.json.
RUN npm install -g prisma@6 --ignore-scripts

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# nestjs (não-root) precisa escrever em node_modules/prisma/node_modules/@prisma/engines
# ao rodar `prisma migrate deploy` — sem isso falha com EACCES e o CMD abaixo
# (que ignora erro do migrate via ";") nunca aplica migrations automaticamente.
RUN chown -R nestjs:nodejs /usr/local/lib/node_modules/prisma

# node_modules de produção (flat, sem symlinks pnpm)
COPY --from=builder --chown=nestjs:nodejs /deploy/node_modules ./node_modules
# dist compilado — pnpm deploy exclui se estiver no .gitignore
COPY --from=builder --chown=nestjs:nodejs /repo/apps/api/dist ./dist
# schema e migrations reais para `prisma migrate deploy` em runtime
# (apps/api/prisma é um scaffold vazio sem migrations — o schema canônico
# com models e migrations/ vive em packages/db/prisma)
COPY --from=builder --chown=nestjs:nodejs /repo/packages/db/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /deploy/package.json ./package.json

USER nestjs
EXPOSE 3001

# SKIP_MIGRATIONS=1 para desabilitar migrations (ex: réplicas de leitura)
# Falha de `prisma migrate deploy` deve impedir o processo Node de subir —
# nunca rodar em produção com schema inconsistente (exit code propagado via `|| exit 1`).
CMD ["sh", "-c", "if [ \"$SKIP_MIGRATIONS\" != \"1\" ]; then prisma migrate deploy || exit 1; fi; exec node dist/main.js"]
