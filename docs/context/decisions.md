# Decisões do Projeto

Escolhas técnicas que substituem padrões gerais. Separadas por domínio.
Registradas aqui para que agentes não inventem convenções não acordadas.

## Backend

### Arquitetura
- **Modular Monolith First**: monólito modular em `apps/api` — sem microsserviços prematuros
- Clean Architecture com limites de camada estritos
- DI baseado em tokens: `{ provide: IUsersRepository, useClass: PrismaUsersRepository }`
- Entidades de domínio: classes TypeScript puras — zero imports NestJS
- Exceções de domínio tipadas que estendem as built-ins do NestJS
- **Multi-tenant desde o início**: toda entidade com escopo de tenant — queries sempre filtradas por `tenantId`
- **Docker desde o início**: ambiente de desenvolvimento e produção containerizado

### ORM e banco
- ORM: **Prisma**
- Banco: **PostgreSQL** (hospedado no Railway)
- `synchronize: false` em produção — migrations obrigatórias para toda mudança de schema

### Object Storage
- **Supabase Storage** para uploads de arquivos (imagens, assets)

### API
- REST com Swagger (`@nestjs/swagger`)
- Versionamento via prefixo: `/api/v1/`
- Paginação cursor-based preferida sobre offset em tabelas grandes

### Erros e logs
- Filtro global de exceções para erros inesperados — shape consistente de resposta
- Log sempre com contexto: `this.logger.error('msg', { entityId, error })`
- **Observabilidade**: Pino (logging estruturado), Sentry (error tracking), Prometheus (métricas)

### Fila
- **BullMQ** — operações pesadas (email, notificações, jobs) vão para fila — nunca bloqueiam HTTP
- Backed por Redis

### Auth
- **NextAuth** — integração nativa com Next.js

### Cache
- **Redis** — compartilhado com BullMQ

### Testes backend
- Unit: Jest com interfaces de repositório mockadas
- Integration: Supertest contra app NestJS real com banco de teste
- Cobertura mínima: use cases 90%, controllers 80%, repos 60%

---

## Frontend

### Renderização
- App Router (Next.js) — sem Pages Router
- Server Components por padrão; `'use client'` apenas para interatividade ou browser APIs
- Server Actions para mutações internas — não API routes
- Dados em Server Components sempre que possível — evitar `useEffect` para fetch

### Estilização
- **Tailwind CSS** — sem CSS Modules, sem styled-components
- **Framer Motion** para animações e transições

### Componentes
- **shadcn/ui** sobre Radix UI — sem MUI, sem Chakra, sem Ant Design

### Estado global
- **Zustand** — sem Redux, sem Jotai, sem Context API para estado global

### Formulários
- **React Hook Form + Zod** — sem Formik; Zod é a única fonte de verdade para schemas de validação

### Data fetching no cliente
- **TanStack Query** — sem SWR, sem fetch manual em componentes

### Ícones
- **Lucide React** — sem Heroicons, sem Phosphor

### Testes frontend
- React Testing Library + Jest — sem Enzyme
- MSW para mock de rede — sem mocks manuais de fetch
- Playwright para E2E
- Cobertura mínima: componentes 70%, hooks e utils 90%, fluxos P0 (E2E) 100%
