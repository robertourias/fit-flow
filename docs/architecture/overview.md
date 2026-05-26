# Visão Arquitetural

> Atualize sempre que uma decisão arquitetural significativa for tomada.

## Sistema

**Produto**: FitFlow
**Status**: Desenvolvimento inicial

## Stack

| Camada | Tecnologia | Notas |
|--------|-----------|-------|
| Frontend | Next.js (App Router) | |
| Backend | NestJS | |
| Monorepo | Turborepo | Builds incrementais, pacotes compartilhados |
| ORM | Prisma | |
| Banco | PostgreSQL | Hospedado no Railway |
| Auth | NextAuth | |
| Fila | BullMQ | Backed por Redis |
| Cache | Redis | Compartilhado com BullMQ |
| Hospedagem | Vercel (frontend) + Railway (backend + DB + Redis) | |
| CI/CD | GitHub Actions | |

## Fluxo de dados

```
User → Next.js (SSR/RSC) → NestJS API → PostgreSQL (via Prisma)
                         ↘ Redis (cache / BullMQ)
                         ↘ External Services
```

## Bounded Contexts

<!-- Adicione ao longo do projeto -->
- [Contexto 1]: [Descrição, quais entidades ele possui]

## Decisões registradas

| Decisão | Escolha | Data | Justificativa |
|---------|---------|------|---------------|
| Monorepo | Turborepo | — | Builds incrementais, pacotes compartilhados |
| Backend | NestJS | — | DI, modular, TypeScript-first |
| Frontend | Next.js | — | SSR, RSC, edge-ready |
| Arquitetura | Clean Architecture | — | Domínio testável sem dependência de framework |
| ORM | Prisma | — | Type-safe, migrations declarativas, ecossistema maduro |
| Banco | PostgreSQL | — | Relacional, robusto, suportado pelo Railway |
| Auth | NextAuth | — | Integração nativa com Next.js, suporte a múltiplos providers |
| Fila | BullMQ | — | Jobs confiáveis com retry, backed por Redis |
| Cache | Redis | — | Compartilhado com BullMQ, baixa latência |
| Hospedagem | Vercel + Railway | — | Vercel para frontend/edge, Railway para backend e infraestrutura |
| CI/CD | GitHub Actions | — | Integração nativa com repositório |

## Constraints conhecidos

<!-- Documente débito técnico, limitações ou não-óbvios aqui -->
