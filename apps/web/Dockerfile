# Build context: monorepo root
# docker build -f apps/web/Dockerfile -t fitflow-web .

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# deps: install workspace dependencies
# layer is cached until any package.json or pnpm-lock.yaml changes
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json              ./apps/web/
COPY packages/config/package.json       ./packages/config/
COPY packages/db/package.json           ./packages/db/
COPY packages/types/package.json        ./packages/types/
COPY packages/ui/package.json           ./packages/ui/
COPY packages/utils/package.json        ./packages/utils/
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# builder: compile Next.js
FROM base AS builder
COPY --from=deps /app/node_modules              ./node_modules
COPY --from=deps /app/apps/web/node_modules     ./apps/web/node_modules
COPY --from=deps /app/packages/db/node_modules  ./packages/db/node_modules
COPY package.json pnpm-workspace.yaml           ./
COPY packages/                                  ./packages/
COPY apps/web/                                  ./apps/web/
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma client precisa existir antes do next build resolver '@fitflow/db' (re-exporta @prisma/client)
RUN pnpm --filter @fitflow/db exec prisma generate
RUN cd apps/web && pnpm run build

# runner: minimal production image (~200 MB vs ~1 GB)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
# standalone output bundles only the required node_modules subset
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static     ./apps/web/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
