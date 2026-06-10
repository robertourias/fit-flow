# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-06-08
**Resumo da última sessão:** Depuração e correção completa do fluxo de autenticação em Docker: Prisma engine, DATABASE_URL, JWT strategy, PrismaAdapter image field, SMTP config e UX de cadastro.

---

## Feature em andamento

**Spec ativo:** docs/specs/2026-06-05-auth.md
**Plano ativo:** docs/plans/2026-06-05-auth.md

---

## Tasks

### ✅ Concluídas (sessões anteriores)

**Frontend (web):**
- Dashboard, Exercícios, Biblioteca, Treino — fluxo completo de execução com mock data

**Backend (data model):**
- packages/db: schema Prisma, migration, PrismaClient singleton
- apps/api: Identity, Catalog, Training — entidades, repositórios, módulos NestJS

### ✅ Concluídas (sessão 2026-06-08 — auth)

- Corrigir `api/auth/error?error=Configuration` — `AUTH_SECRET` ausente em `apps/web/.env.local`
- Corrigir incompatibilidade NextAuth v5: `Credentials` + `session: database` → migrar para `jwt` strategy com callbacks `jwt`/`session`
- Corrigir Prisma engine binary ausente no standalone Docker (`outputFileTracingIncludes` em `next.config.ts`)
- Adicionar `DATABASE_URL` + rede `backend` + `depends_on: db` ao serviço web no docker-compose
- Adicionar campo `image String?` no User model (requerido pelo PrismaAdapter para Google OAuth) + migration `20260608000000_add_user_image`
- Refatorar fluxo de cadastro: `requestSignup` apenas cria usuário (sem OTP), redireciona para `/login?registered=1` com banner de sucesso
- Adicionar try/catch em `requestLoginOtp` e `resendOtp` — Gmail 535 retorna erro tratável em vez de 500
- Atualizar `email.ts`: `service:"gmail"` → config explícita STARTTLS (host/port via `SMTP_HOST`/`SMTP_PORT`)
- Atualizar App Password Gmail e vars SMTP no `.env` e docker-compose
- Corrigir OOM no build Docker: `NODE_OPTIONS=--max_old_space_size=4096`

### 🔄 Em progresso
- (nenhuma — fixes de auth implantados em produção Docker)

### ⏭ Próximos passos
1. **Manual obrigatório**: adicionar `http://localhost:3000/api/auth/callback/google` em Authorized redirect URIs no Google Cloud Console (OAuth client `124527683396-...`)
2. Testar fluxo completo: cadastro → login OTP → Google OAuth → redirect pós-login
3. Implementar onboarding (`/onboarding`) — atualmente a rota existe mas não há conteúdo funcional
4. Spec + plano de API REST — endpoints para Identity, Catalog e Training (NestJS controllers, use cases, DTOs)
5. Conectar frontend ao backend — substituir mock data por chamadas API reais
6. Criar rota `/program/[programId]` — `WorkoutFinishForm` redireciona para ela mas não existe

---

## Decisões desta sessão

- **JWT strategy em vez de database** — Credentials provider é incompatível com database sessions no NextAuth v5 beta; PrismaAdapter continua ativo para persistir User/Account do Google OAuth
- **Signup sem OTP** — criação de conta apenas registra o usuário; verificação de email ocorre no primeiro login via OTP; simplifica o fluxo e elimina dependência do Gmail no cadastro
- **`image` field no User** — campo exigido pelo PrismaAdapter; mantido ao lado de `avatarUrl` (app usa `avatarUrl`, adapter usa `image`)
- **SMTP explícito** — `nodemailer` com `host`/`port`/`secure: false` em vez de `service: "gmail"` para suportar qualquer provider via env vars
- **Web service na rede `backend`** — necessário para server actions e auth callbacks que acessam Prisma diretamente

---

## Bloqueadores / Perguntas abertas

- **Google OAuth**: redirect URI `http://localhost:3000/api/auth/callback/google` precisa ser adicionado manualmente no Google Cloud Console antes de funcionar
- `WorkoutFinishForm` redireciona para `/program/[programId]` mas rota não existe
- next-auth v5 ainda em beta — TS2742 workaround com `any` em `auth.ts`; remover quando estabilizar
- Migration system do API Docker sem migrations aplicadas automaticamente — `apps/api/prisma/` não contém pasta `migrations/`; schema é mantido via push manual
