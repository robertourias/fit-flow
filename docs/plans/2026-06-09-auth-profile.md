# Plano Técnico: Autenticação Evoluída e Página de Perfil

**Spec:** `docs/specs/2026-06-09-auth-profile.md`
**Data:** 2026-06-09
**Escopo:** Monorepo global

---

## Contexto Arquitetural

Auth reside **inteiramente no web app** (NextAuth v5 + Server Actions). O NestJS API expõe repositórios de usuário, mas sem controller de auth. Migrações via Prisma em `packages/db`. Todas as mutações de perfil serão Server Actions (padrão já estabelecido).

Fluxo atual de login: `email → OTP → sessão` (sem senha).  
Fluxo novo de login: `email + senha + Turnstile → OTP → verificar dispositivo → sessão`.

---

## Contratos de API

> Sem novos endpoints NestJS nesta iteração — perfil gerenciado via Server Actions + Prisma. NestJS identity module recebe atualização de schema apenas.

### Server Actions novas/modificadas (`apps/web/src/app/(auth)/actions.ts` e `app/settings/profile/actions.ts`)

| Action | Input | Output | Erros |
|--------|-------|--------|-------|
| `requestSignupOtp(name, email, turnstileToken)` | `{ name, email, turnstileToken }` | `{ success: true }` | 400 Turnstile inválido, 409 e-mail já cadastrado, 429 rate limit OTP |
| `verifySignupOtp(email, otp)` | `{ email, otp }` | `{ success: true, tempToken }` | 400 OTP inválido/expirado, 429 muitas tentativas |
| `completeSignup(tempToken, password)` | `{ tempToken, password }` | `{ success: true }` | 400 senha fraca, 400 token inválido/expirado |
| `requestLoginOtp(email, password, turnstileToken)` | `{ email, password, turnstileToken }` | `{ success: true }` | 400 Turnstile inválido, 401 credenciais inválidas, 429 rate limit |
| `updateProfile(data)` | `{ name?, bio?, age?, goals?, avatarUrl? }` | user atualizado | 400 validação, 401 não autenticado |
| `changePassword(currentPassword, newPassword, otp)` | `{ currentPassword, newPassword, otp }` | `{ success: true }` | 401 senha atual errada, 400 senha fraca, 400 OTP inválido |
| `deleteAccount(confirmationText, password, otp)` | `{ confirmationText, password, otp }` | `{ success: true }` | 400 texto errado, 401 senha errada, 400 OTP inválido |

---

## Tarefas Técnicas

---

## Tarefa: TASK-001 — Prisma Migration: schema de auth e perfil
Tipo: chore
Agente: backend

Adicionar ao schema `packages/db/prisma/schema.prisma`:

**Modificações no model `User`:**
```prisma
model User {
  // campos existentes mantidos
  passwordHash  String?       // null para usuários OAuth
  bio           String?       @db.VarChar(300)
  age           Int?
  goals         String[]      // ex: ["HYPERTROPHY", "FAT_LOSS"]
  deletedAt     DateTime?     // soft delete

  devices       UserDevice[]
}
```

**Novo model `UserDevice`:**
```prisma
model UserDevice {
  id            String    @id @default(cuid())
  userId        String
  userAgentHash String    @db.VarChar(64)  // SHA256 do user-agent
  ipAddress     String    @db.VarChar(45)  // suporta IPv6
  location      String?   @db.VarChar(100) // "São Paulo, BR" ou null
  isFirstDevice Boolean   @default(false)
  createdAt     DateTime  @default(now())
  lastSeenAt    DateTime  @default(now())

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, userAgentHash])
  @@map("user_devices")
}
```

**Modificação na `VerificationToken`** — adicionar campo `purpose`:
```prisma
model VerificationToken {
  // campos existentes mantidos
  purpose  String  @default("LOGIN_OTP") // LOGIN_OTP | SIGNUP_OTP | CHANGE_PASSWORD | DELETE_ACCOUNT
}
```

Gerar e aplicar migration: `prisma migrate dev --name add-auth-profile-fields`.

Critérios de Aceite:
- [ ] `npx prisma migrate dev` roda sem erro.
- [ ] `prisma generate` atualiza o client com os novos tipos.
- [ ] Model `UserDevice` visível no Prisma Studio.

Notas: `passwordHash` é nullable para preservar compatibilidade com contas Google OAuth (sem senha local).

---

## Tarefa: TASK-002 — PasswordService (web app)
Tipo: feature
Agente: backend

Criar `apps/web/src/lib/password.ts`:

```typescript
// Responsabilidades:
// - hash(plain: string): Promise<string>           — bcrypt, 12 rounds
// - verify(plain: string, hash: string): Promise<boolean>
// - score(plain: string): PasswordStrength         — { level, score, feedback }
// - isCommon(plain: string): boolean               — rejeita top-1000 comuns
// - meetsPolicy(plain: string): boolean            — min 12 chars + não comum + strength >= STRONG

export type StrengthLevel = 'WEAK' | 'MEDIUM' | 'STRONG' | 'VERY_STRONG'
export type PasswordStrength = { level: StrengthLevel; score: number; feedback: string }
```

Scoring rules (0–4 pontos):
- +1 comprimento ≥ 12
- +1 maiúscula + minúscula
- +1 número
- +1 caractere especial (`!@#$%^&*...`)
- Mapeamento: 0-1 → WEAK, 2 → MEDIUM, 3 → STRONG, 4 → VERY_STRONG

Lista top-1000 senhas comuns: importar de `@codegouvfr/zxcvbn` ou incorporar arquivo JSON estático em `src/lib/common-passwords.json`.

Critérios de Aceite:
- [ ] `hash("senha12345!")` retorna string bcrypt válida.
- [ ] `verify("senha12345!", hash)` retorna `true`.
- [ ] `score("senha12345!")` retorna `STRONG` ou `VERY_STRONG`.
- [ ] `isCommon("password123")` retorna `true`.
- [ ] `meetsPolicy("abc")` retorna `false`.
- [ ] Testes unitários com Jest cobrindo todos os cenários (cobertura ≥ 90%).

---

## Tarefa: TASK-003 — DeviceService + GeoService (web app)
Tipo: feature
Agente: backend

Criar `apps/web/src/lib/device.ts`:

```typescript
// getDeviceFingerprint(userAgent: string): string    — SHA256 truncado (hex 16 chars)
// getApproxLocation(ip: string): Promise<string>     — "Cidade, BR" ou "Localização desconhecida"
// registerDevice(userId, req): Promise<{ isNew: boolean }>
//   — upsert em user_devices; retorna isNew=true se userAgentHash não existia
```

GeoIP: usar `ip-api.com` (gratuito, sem chave) com timeout de 2s e fallback silencioso.

```typescript
// GET http://ip-api.com/json/{ip}?fields=city,country,countryCode
// Timeout: 2000ms — se falhar, retorna "Localização desconhecida"
```

Extrair IP real: `req.headers['x-forwarded-for'] ?? req.socket.remoteAddress`.

Critérios de Aceite:
- [ ] `getDeviceFingerprint` retorna hash idêntico para mesmo user-agent.
- [ ] `getApproxLocation` retorna string formatada ou fallback em caso de erro.
- [ ] `registerDevice` cria registro na primeira chamada; `isNew=false` na segunda com mesmo user-agent.
- [ ] `registerDevice` com user-agent diferente retorna `isNew=true`.
- [ ] Testes unitários mockam `ip-api.com` e Prisma.

---

## Tarefa: TASK-004 — Cloudflare Turnstile: componente + validação
Tipo: feature
Agente: frontend

**Dependência:** `pnpm add @marsidev/react-turnstile` em `apps/web`.

Criar `apps/web/src/components/auth/TurnstileWidget.tsx`:
```typescript
// Props: { onVerify: (token: string) => void; onError?: () => void }
// Usa NEXT_PUBLIC_TURNSTILE_SITE_KEY
// Widget 'managed' (aparece apenas em casos suspeitos)
```

Criar `apps/web/src/lib/turnstile.ts` (validação server-side):
```typescript
// verifyTurnstile(token: string): Promise<boolean>
// POST https://challenges.cloudflare.com/turnstile/v0/siteverify
// { secret: TURNSTILE_SECRET_KEY, response: token }
// Fallback: se timeout > 5s → return true (conforme spec)
```

Variáveis de ambiente novas:
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — chave pública (frontend)
- `TURNSTILE_SECRET_KEY` — chave secreta (somente server)

Adicionar ao `apps/web/.env.local.example`.

Critérios de Aceite:
- [ ] `TurnstileWidget` renderiza e chama `onVerify` com token válido.
- [ ] `verifyTurnstile` retorna `true` com token válido da API Cloudflare.
- [ ] `verifyTurnstile` retorna `false` com token inválido.
- [ ] `verifyTurnstile` retorna `true` em caso de timeout (fallback).
- [ ] `.env.local.example` atualizado com as duas variáveis.

---

## Tarefa: TASK-005 — PasswordStrengthBar: componente UI
Tipo: feature
Agente: frontend

Criar `packages/ui/src/components/PasswordStrengthBar.tsx`:

```typescript
// Props: { password: string }
// Renderiza:
//   - Barra de 4 segmentos coloridos (cinza → vermelho → laranja → verde → verde-escuro)
//   - Rótulo textual: "Fraca" | "Média" | "Forte" | "Muito Forte"
// Recalcula a cada keystroke via useMemo
// Sem dependência de PasswordService (calcular localmente para evitar import server)
```

Exportar do `packages/ui/src/index.ts`.

Critérios de Aceite:
- [ ] Barra exibe 1 segmento vermelho para senhas fracas.
- [ ] Barra exibe 4 segmentos verdes para `"MyStr0ng!Pass#2024"`.
- [ ] Componente é `'use client'` e funciona em form pages.
- [ ] Exportado corretamente do pacote `@fitflow/ui`.

---

## Tarefa: TASK-006 — Fluxo de cadastro multi-step atualizado
Tipo: feature
Agente: frontend

**Pré-requisito:** TASK-001, TASK-002, TASK-003, TASK-004, TASK-005.

### Novo fluxo (3 passos na mesma rota `/signup`):

**Passo 1 — Email + Turnstile (`SignupStep1`)**
- Campos: Nome completo, E-mail
- `TurnstileWidget` invisible
- Ao submeter: chamar `requestSignupOtp(name, email, turnstileToken)`
- Erros: e-mail já cadastrado (409), Turnstile inválido (400), rate limit (429)
- Avança para Passo 2

**Passo 2 — Verificação OTP (`SignupStep2`)**
- Campo: OTP 6 dígitos (input com auto-submit ao completar)
- Botão "Reenviar" habilitado após 60s (countdown)
- Ao submeter: chamar `verifySignupOtp(email, otp)`
- Avança para Passo 3

**Passo 3 — Criação de senha (`SignupStep3`)**
- Campos: senha + confirmação
- `PasswordStrengthBar` ao vivo
- Botão submit desabilitado se level < STRONG
- Ao submeter: chamar `completeSignup(tempToken, password)`
  - `completeSignup` cria o usuário no DB com `passwordHash` + registra dispositivo via `registerDevice`
  - Faz `signIn("credentials")` automaticamente após criar conta

### Modificar `apps/web/src/app/(auth)/actions.ts`:

```typescript
// requestSignupOtp: valida Turnstile → rate limit Redis → envia OTP com purpose='SIGNUP_OTP'
//   → NÃO cria usuário ainda → armazena { name, email } em verification_tokens.metadata (ou Redis TTL 15min)

// verifySignupOtp: valida OTP → gera tempToken (UUID, TTL 15min no Redis) com payload { name, email }
//   → retorna tempToken para o frontend passar ao Passo 3

// completeSignup: valida tempToken → valida política de senha → cria User (passwordHash, emailVerified=now())
//   → chama registerDevice → limpa tempToken do Redis
```

Critérios de Aceite:
- [ ] Cadastro sem validação de OTP é impossível (sem `tempToken` válido, `completeSignup` rejeita).
- [ ] Senha fraca (< STRONG) bloqueia submit no frontend e backend.
- [ ] E-mail duplicado retorna erro claro no Passo 1.
- [ ] Após cadastro completo, usuário é redirecionado ao onboarding.
- [ ] Device registrado em `user_devices` ao final do fluxo.

---

## Tarefa: TASK-007 — Fluxo de login atualizado (email + senha + OTP)
Tipo: feature
Agente: frontend

**Pré-requisito:** TASK-001, TASK-002, TASK-003, TASK-004.

### Novo fluxo de login (2 passos):

**Passo 1 — Credenciais (`LoginStep1`)** — `app/(auth)/login/page.tsx`
- Campos: E-mail, Senha (com toggle show/hide)
- `TurnstileWidget` invisible
- Ao submeter: `requestLoginOtp(email, password, turnstileToken)`
  - Valida Turnstile → busca usuário → verifica bcrypt → se OK, envia OTP com `purpose='LOGIN_OTP'`
  - Não revelar se e-mail existe (mensagem genérica em caso de falha)
- Avança para Passo 2 (redireciona para `/verify?email=...`)

**Passo 2 — OTP** — `app/(auth)/verify/page.tsx` (já existe, ajustar)
- Ao validar OTP com sucesso:
  - Chamar `registerDevice(userId, req)` → se `isNew=true`, disparar `sendNewDeviceAlertEmail`
  - Fazer `signIn("credentials", { email, otpToken })`

### Modificar `apps/web/src/lib/auth.ts` — CredentialsProvider:
```typescript
// authorize(credentials):
//   1. Buscar usuário por email
//   2. Se usuario.passwordHash null → erro "use Google OAuth para fazer login"
//   3. Verificar bcrypt(credentials.password, usuario.passwordHash)
//   4. Verificar OTP (purpose=LOGIN_OTP)
//   5. Retornar user object
```

### Modificar `requestLoginOtp` em `actions.ts`:
```typescript
// 1. verifyTurnstile(token) → se false, lançar erro
// 2. Buscar usuário por email
// 3. Se não encontrado OU passwordHash null → erro genérico (não revelar existência)
// 4. bcrypt.verify(password, user.passwordHash) → se false → erro genérico
// 5. Rate limit: max 3 OTPs/hora via Redis
// 6. Gerar OTP com purpose='LOGIN_OTP', enviar email
```

Critérios de Aceite:
- [ ] Login com senha errada retorna erro genérico (sem revelar se e-mail existe).
- [ ] Login sem OTP é impossível.
- [ ] Após OTP válido, sessão criada e usuário redirecionado corretamente.
- [ ] Usuário Google OAuth continua funcionando (rota de login OAuth inalterada).
- [ ] Conta com `deletedAt` não-null é rejeitada no login.

---

## Tarefa: TASK-008 — E-mail de alerta de novo dispositivo
Tipo: feature
Agente: backend

Criar `apps/web/src/lib/email-templates/new-device-alert.ts`:

```typescript
// sendNewDeviceAlertEmail(params: {
//   to: string,
//   userName: string,
//   device: string,     // user-agent legível (primeiros 60 chars)
//   location: string,   // "São Paulo, BR"
//   date: string,       // "09/06/2026 às 14:32"
//   ip: string
// }): Promise<void>
```

Template HTML: assunto `"Novo acesso à sua conta FitFlow"`, corpo com: data/hora, localização, dispositivo, IP, botão "Não fui eu — proteja minha conta" (link para `/settings/profile`).

Critérios de Aceite:
- [ ] E-mail enviado via Resend (substituir Nodemailer/Gmail — ver nota abaixo).
- [ ] Template renderiza sem erros com todos os campos.
- [ ] Enviado assincronamente (não bloqueia o fluxo de login).

Notas: O commit `fix(auth): resolve OTP delivery` sugere problemas com Gmail SMTP. Migrar todos os envios de e-mail para **Resend** (`resend` npm package) nesta tarefa para unificar o transporte. Adicionar `RESEND_API_KEY` ao `.env.local.example`.

---

## Tarefa: TASK-009 — NestJS Identity: atualizar entidade User com novos campos
Tipo: feature
Agente: backend

**Arquivos:** `apps/api/src/identity/`

Atualizar `domain/user.entity.ts`:
```typescript
// Adicionar campos:
// bio: string | null
// age: number | null
// goals: string[]      // ['HYPERTROPHY', 'FAT_LOSS', ...]
// deletedAt: Date | null
// isDeleted(): boolean  — retorna deletedAt !== null
```

Atualizar `domain/repositories/users.repository.interface.ts`:
```typescript
// Adicionar:
// softDelete(id: string): Promise<void>
// findManyDeletedBefore(date: Date): Promise<User[]>  // para job de limpeza
```

Atualizar `infra/repositories/prisma-users.repository.ts` para implementar os novos métodos.

Critérios de Aceite:
- [ ] `user.isDeleted()` retorna `true` quando `deletedAt` não é null.
- [ ] `softDelete` define `deletedAt = new Date()` no registro.
- [ ] Testes unitários do repositório atualizados.

---

## Tarefa: TASK-010 — Server Actions de perfil
Tipo: feature
Agente: frontend

**Pré-requisito:** TASK-001, TASK-002, TASK-003.

Criar `apps/web/src/app/settings/profile/actions.ts`:

```typescript
// updateProfile(data: ProfileUpdateInput): Promise<User>
//   — valida sessão → valida campos → upsert Prisma → revalida cache
//   — ProfileUpdateInput: { name?, bio?, age?, goals?, avatarUrl? }
//   — Validações: name max 80 chars, bio max 300 chars, age 10-100, goals subset de GoalOption[]

// changePassword(input: { currentPassword, newPassword, otp }): Promise<void>
//   — verifica bcrypt(currentPassword, user.passwordHash)
//   — meetsPolicy(newPassword) → rejeitar se false
//   — verifica OTP (purpose=CHANGE_PASSWORD)
//   — bcrypt.hash(newPassword) → salvar → invalidar todas as sessões

// requestPasswordChangeOtp(): Promise<void>
//   — rate limit → gerar OTP (purpose=CHANGE_PASSWORD) → enviar email

// deleteAccount(input: { confirmationText, password, otp }): Promise<void>
//   — confirmationText === "DELETAR" (exato, case-sensitive)
//   — verifica bcrypt(password, user.passwordHash)
//   — verifica OTP (purpose=DELETE_ACCOUNT)
//   — softDelete no Prisma (deletedAt = now())
//   — signOut() — destruir sessão

// requestDeleteAccountOtp(): Promise<void>
//   — rate limit → gerar OTP (purpose=DELETE_ACCOUNT) → enviar email
```

Critérios de Aceite:
- [ ] `updateProfile` com `age: 5` retorna erro de validação.
- [ ] `changePassword` com senha fraca retorna erro.
- [ ] `changePassword` com OTP inválido retorna erro.
- [ ] `deleteAccount` com texto diferente de "DELETAR" (ex: "deletar") retorna erro.
- [ ] Após `deleteAccount`, sessão destruída e usuário redirecionado ao login.
- [ ] Conta deletada não consegue fazer login.

---

## Tarefa: TASK-011 — Página de Perfil `/settings/profile`
Tipo: feature
Agente: frontend

**Pré-requisito:** TASK-005, TASK-010.

Criar rota `apps/web/src/app/settings/profile/page.tsx` com layout `settings/layout.tsx` wrappando `<AppShell>`.

### Seções da página:

**1. Informações Pessoais**
- Avatar: preview circular + botão upload (Supabase Storage, aceitar jpg/png/webp ≤ 5MB)
- Campos: Nome, Bio (textarea com contador de chars), Idade, Objetivos (checkbox group com 6 opções)
- Formulário com React Hook Form + Zod
- Botão "Salvar" → chama `updateProfile`
- Toast de sucesso/erro com shadcn/ui `<Toast>`

**2. Alterar Senha** (collapsible / accordion)
- Campos: senha atual, nova senha + `PasswordStrengthBar`, confirmar nova senha
- Botão "Enviar código" → `requestPasswordChangeOtp` → campo OTP aparece
- Botão "Confirmar" → `changePassword`
- Seção visível apenas para usuários com `passwordHash` (ocultar para contas Google OAuth)

**3. Excluir Conta** (collapsible, estilo danger zone)
- Texto explicativo (soft delete, 30 dias)
- Botão "Iniciar exclusão" → abre modal de confirmação
- Modal: campo para digitar "DELETAR", campo senha, botão "Enviar código OTP" → campo OTP
- Botão "Excluir definitivamente" → `deleteAccount`

**4. Indicador de método de login** (somente leitura)
- Badge: "Google OAuth" ou "E-mail e senha"

Critérios de Aceite:
- [ ] Upload de foto atualiza preview imediatamente após upload.
- [ ] Contador de Bio mostra "X/300" e bloqueia ao atingir limite.
- [ ] `PasswordStrengthBar` atualiza ao digitar nova senha.
- [ ] Seção "Alterar Senha" não aparece para usuários Google OAuth.
- [ ] Modal de exclusão exige "DELETAR" exato — botão confirmar desabilitado até digitado corretamente.
- [ ] Página acessível apenas com sessão ativa (middleware já protege).

---

## Tarefa: TASK-012 — Testes de Integração e E2E
Tipo: test
Agente: ambos

**Pré-requisito:** Todas as tasks anteriores concluídas.

### Testes E2E (Playwright) — `apps/web/e2e/`:

**`auth-registration.spec.ts`:**
- [ ] Fluxo completo: nome + email → OTP → senha → onboarding
- [ ] Bloqueia cadastro com senha fraca
- [ ] Bloqueia cadastro com e-mail já usado

**`auth-login.spec.ts`:**
- [ ] Fluxo completo: email + senha → OTP → dashboard
- [ ] Bloqueia login com senha errada
- [ ] Bloqueia login com OTP expirado
- [ ] Google OAuth não quebrou (smoke test)

**`profile.spec.ts`:**
- [ ] Editar nome e bio — salva e persiste após reload
- [ ] Trocar senha — fluxo completo com OTP
- [ ] Deletar conta — redirecionado ao login, não consegue logar novamente

### Testes de Integração (Jest + Supertest):
- [ ] `PasswordService.meetsPolicy` — 10+ cenários de borda
- [ ] `DeviceService.registerDevice` — primeiro vs. retorno vs. novo dispositivo
- [ ] `verifyTurnstile` — mock da API Cloudflare

Notas: Usar MSW para mockar `ip-api.com` e Cloudflare Turnstile nos testes.

---

## Ordem de Execução

```
TASK-001 (migration)
  └─► TASK-002 (PasswordService)
  └─► TASK-003 (DeviceService)
  └─► TASK-009 (NestJS entity)
        └─► TASK-004 (Turnstile)
        └─► TASK-005 (PasswordStrengthBar)
              └─► TASK-006 (Fluxo signup)
              └─► TASK-007 (Fluxo login)
                    └─► TASK-008 (Email alerta)
                    └─► TASK-010 (Server Actions perfil)
                          └─► TASK-011 (Página perfil)
                                └─► TASK-012 (Testes E2E)
```

## Variáveis de Ambiente Novas

| Variável | Onde | Descrição |
|----------|------|-----------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `apps/web` | Chave pública Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | `apps/web` | Chave secreta Cloudflare Turnstile (somente server) |
| `RESEND_API_KEY` | `apps/web` | API key do Resend para envio de e-mails |

## Escalar Imediatamente Se

- A migration de `passwordHash` em produção precisar de backfill para usuários existentes (não bloquear login de usuários OAuth sem senha).
- O `ip-api.com` tiver rate limits insuficientes para produção (limite: 45 req/min free tier) — avaliar alternativa paga ou `@maxmind/geoip2-node` com banco local.
