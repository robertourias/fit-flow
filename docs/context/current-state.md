# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-05-26
**Resumo da última sessão:** Concluído T10 (validação e README de desenvolvimento) — última tarefa do plano de setup do monorepo. Build e docs validados.

---

## Feature em andamento

**Spec ativo:** `docs/specs/2026-05-26-monorepo-setup.md`
**Plano ativo:** `docs/plans/2026-05-26-monorepo-setup.md`
**Status:** ✅ Todas as tarefas concluídas (T1–T10)

---

## Tasks

### ✅ Concluídas
- T1 — Estrutura raiz do monorepo
- T2 — Packages compartilhados (`@fitflow/config`, `types`, `utils`, `ui`)
- T3 — App Next.js (`apps/web`)
- T4 — App NestJS + Prisma (`apps/api`)
- T5 — `turbo.json` com pipelines completos
- T6 — Dockerfile multi-stage para Next.js
- T7 — Dockerfile multi-stage para NestJS
- T8 — Docker Compose completo
- T9 — Variáveis de ambiente e `.gitignore`
- T10 — Validação e README de desenvolvimento

### 🔄 Em progresso
- (nenhuma)

### ⏭ Próximos passos
1. Validar stack em ambiente Docker real (`docker compose --profile app up --build`)
2. Iniciar primeira feature de produto — usar `/spec` para gerar spec

---

## Decisões desta sessão

- Diagrama de rede do `infra.md` corrigido: docker-compose usa duas redes (`frontend` e `backend`), não uma única `fitflow-net`
- `REDIS_URL` adicionado ao `apps/api/.env.example` (estava faltando)

---

## Bloqueadores / Perguntas abertas

- Validação de containers Docker pendente (requer Docker em execução)
- Supabase local não está no Docker Compose — as variáveis `SUPABASE_*` apontam para instância cloud ou Supabase CLI rodando separadamente
