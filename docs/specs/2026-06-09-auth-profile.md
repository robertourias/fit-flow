# Spec: Autenticação Evoluída e Página de Perfil

**Status:** approved
**Data:** 2026-06-09
**Autor:** planner-agent

---

## Problema

O fluxo atual de cadastro e login não valida a posse do e-mail, não exige senha forte e não possui segundo fator de autenticação. Isso expõe a plataforma a contas falsas, credential stuffing e acessos não autorizados — crítico pois o produto lida com dados de saúde e treino. Além disso, não existe página de perfil, impedindo o usuário de gerenciar seus dados pessoais.

---

## Cenários de Usuário

- **P1 (crítico):** Como novo usuário, quero confirmar meu e-mail via OTP antes de criar minha senha, para garantir que a conta realmente me pertence.
- **P1 (crítico):** Como usuário, quero fazer login com e-mail + senha + OTP, para que minha conta esteja protegida mesmo que minha senha seja comprometida.
- **P1 (crítico):** Como usuário, quero ser alertado por e-mail quando um acesso ocorrer de um dispositivo não reconhecido, para detectar acessos não autorizados.
- **P2 (importante):** Como usuário, quero ver um indicador de força ao criar ou alterar minha senha, para saber se ela é segura o suficiente.
- **P2 (importante):** Como usuário, quero editar meu perfil (nome, foto, bio, idade, objetivos), para que minha conta reflita minha identidade e metas.
- **P2 (importante):** Como usuário, quero poder alterar minha senha e deletar minha conta na página de perfil, para ter controle total sobre minha conta.
- **P3 (nice-to-have):** Como administrador da plataforma, quero que bots sejam bloqueados via Cloudflare Turnstile nos formulários críticos, para reduzir cadastros fraudulentos e ataques automatizados.

---

## Requisitos Funcionais

### Cadastro

- **FR-001:** Ao submeter nome + e-mail, o sistema envia um OTP de 6 dígitos ao e-mail informado. OTP expira em 10 minutos. O usuário pode solicitar reenvio após 60 segundos.
- **FR-002:** O passo de criação de senha só é exibido após validação correta do OTP.
- **FR-003:** A senha deve ter no mínimo 12 caracteres. O campo exibe um indicador visual de força em tempo real com níveis: Fraca / Média / Forte / Muito Forte. Cadastro só é permitido com nível mínimo "Forte".
- **FR-004:** No momento do primeiro acesso pós-cadastro, o sistema registra: user-agent do dispositivo (hash), endereço IP e localização aproximada (país/cidade via geolocalização por IP).
- **FR-005:** O formulário de cadastro é protegido por Cloudflare Turnstile (widget invisible ou managed). O token é validado no backend antes de enviar o OTP.

### Login

- **FR-006:** O login exige e-mail + senha. Após validação da senha, o sistema envia um OTP de 6 dígitos ao e-mail do usuário.
- **FR-007:** O OTP de login expira em 10 minutos. Falhas consecutivas (5 tentativas) bloqueiam o OTP atual e exigem novo envio.
- **FR-008:** O OTP é obrigatório em todo login, independente de dispositivo reconhecido ou não.
- **FR-009:** Ao detectar login de dispositivo não reconhecido (user-agent hash diferente dos registrados), o sistema envia e-mail de alerta com informações do acesso (data/hora, localização aproximada, dispositivo) sem bloquear o acesso.
- **FR-010:** O formulário de login é protegido por Cloudflare Turnstile.
- **FR-011:** Usuários com Google OAuth continuam com o fluxo atual (sem OTP adicional). O indicador "login via Google" é exibido no perfil.

### Política de Senhas

- **FR-012:** Comprimento mínimo de 12 caracteres. Sem limite máximo definido (aceitar até 128 caracteres).
- **FR-013:** O indicador de força calcula: comprimento, presença de maiúsculas, minúsculas, números e caracteres especiais. Exibe barra colorida e rótulo textual.
- **FR-014:** Senhas comuns (lista top-1000) são rejeitadas com mensagem clara.

### Página de Perfil (`/settings/profile`)

- **FR-015:** O usuário pode editar: Nome completo, Foto (upload para Supabase Storage), Bio (texto livre, máx. 300 chars), Idade (número inteiro, 10–100), Objetivos (multi-seleção de opções pré-definidas: Hipertrofia, Emagrecimento, Força, Condicionamento, Saúde Geral, Flexibilidade).
- **FR-016:** O usuário pode alterar a senha informando a senha atual + nova senha (com mesma política de força). Confirmação por OTP enviado ao e-mail antes de efetivar a troca.
- **FR-017:** O usuário pode deletar a conta. O fluxo exige: digitar "DELETAR" + senha atual + confirmação via OTP. Dados são marcados para exclusão (soft delete) e removidos permanentemente após 30 dias.

---

## Critérios de Sucesso

- [ ] Cadastro sem validação de OTP é impossível — endpoint recusa sem token OTP válido.
- [ ] Login sem OTP é impossível para contas email/senha.
- [ ] Senha com menos de 12 caracteres ou nível "Fraca/Média" é rejeitada no frontend e no backend.
- [ ] E-mail de alerta é enviado dentro de 30 segundos ao detectar dispositivo não reconhecido.
- [ ] Turnstile bloqueia requests sem token válido antes de qualquer processamento.
- [ ] Usuário consegue editar todos os campos de perfil e visualizar a atualização imediatamente.
- [ ] Fluxo de deleção remove a sessão ativa e redireciona para login imediatamente após confirmação.
- [ ] Google OAuth não é afetado pelo novo fluxo de OTP.

---

## Fora do Escopo

- Autenticadores TOTP (Google Authenticator, Authy) — apenas OTP por e-mail nesta iteração.
- OTP por SMS.
- Funcionalidade "lembrar dispositivo" (OTP sempre obrigatório).
- Recuperação de conta por métodos alternativos ao e-mail.
- Links de redes sociais no perfil.
- Verificação de dois fatores para usuários Google OAuth.
- Exportação de dados pessoais (LGPD export — iteração futura).

---

## Riscos e Premissas

- **Premissa:** Provedor de e-mail (Resend) já está configurado e funcional — confirmado pelo commit `fix(auth): resolve OTP delivery`.
- **Premissa:** Redis disponível para armazenar OTPs com TTL — já em uso pelo BullMQ.
- **Premissa:** Supabase Storage configurado para upload de fotos de perfil — já documentado nas decisões.
- **Premissa:** Conta Cloudflare existe ou será criada para ativar o Turnstile.
- **Risco:** OTP flooding (usuário malicioso solicita centenas de OTPs para um e-mail alvo) → Mitigação: rate limit de 3 OTPs por e-mail por hora via Redis.
- **Risco:** Geolocalização por IP pode ser imprecisa (VPN, Tor) ou indisponível → Mitigação: campo "localização" é best-effort; exibir "Localização desconhecida" quando não disponível.
- **Risco:** Fingerprint de dispositivo por user-agent é frágil (updates de browser criam falsos positivos) → Mitigação: alerta não bloqueia — apenas informa. Falsos positivos causam no máximo um e-mail extra.
- **Risco:** Cloudflare Turnstile adiciona dependência externa; falha no serviço pode bloquear cadastros → Mitigação: configurar fallback (modo "pass" em caso de timeout do Turnstile após 5s).

---

<!-- 
GATE DE APROVAÇÃO
Para desbloquear a criação do plano técnico, altere o Status acima de "draft" para "approved".
O agente planner NÃO deve criar tasks de implementação enquanto Status for "draft".
-->
