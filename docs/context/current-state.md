# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-06-20 03:01
**Resumo de progresso global:** Fases 0-9 e TASK09-TASK19 concluídas (roadmap funcional completo). App cobre dashboard, biblioteca de exercícios, CRUD de programas/estratégias/rotinas/treinos, limites do plano gratuito, execução real de treino, histórico de sessões, dashboards de progresso, medidas corporais, explorar/importar templates, compartilhamento de treino/progresso, bounded context Coaching (vínculo aluno↔preparador, TASK17; chat + notificações BullMQ, TASK18) e hardening de release (TASK19): CI/CD completo, gate de cobertura anti-regressão, observabilidade (Pino/Sentry/Prometheus), entrypoint Docker que falha alto em migration quebrada. Produto pronto para o primeiro deploy manual (Vercel + Railway), ainda não executado (decisão do usuário: manual, fora de qualquer spec).
**Resumo da última sessão:** TASK18 (chat preparador↔aluno + notificações BullMQ) e TASK19 (Hardening & Release) implementadas e commitadas juntas em `a765f61` (specs concluídas T1-T7 cada). TASK19 em 4 ondas (T1,T2,T5 → T3,T4 → T6 → T7): baselines de cobertura travados como ratchet anti-regressão (T1/T2), Dockerfile da API corrigido para propagar falha de migration (T5), Pino + Sentry condicional + `GET /metrics` no backend e Sentry condicional no frontend (T3/T4 — wiring final em `main.ts`/`app.module.ts` precisou de correção manual: subagente criou os arquivos mas não os plugou), `.github/workflows/ci.yml`+`deploy.yml` (T6), runbook de deploy em `infra.md` (T7). Backlog TASK18 e TASK19 → `done`.

---

## Feature em andamento

**Spec ativo:** (nenhum) — `docs/specs/2026-06-18-task18-personal-comunicacao.md` e `docs/specs/2026-06-19-task19-hardening-release.md` concluídas (T1-T7 cada, todos os critérios `[x]`), backlog atualizado para `done`. Roadmap funcional (`docs/context/product.md`) sem fases pendentes.

---

## Tasks (Foco no Presente)

### 🔄 Em progresso

(nenhum) — TASK18 e TASK19 concluídas e commitadas (`a765f61`).

### ⏭ Próximos passos imediatos

1. Executar o primeiro deploy manual real (Vercel + Railway) seguindo o passo a passo em `docs/architecture/infra.md` § CI/CD — decisão do usuário (manual), próximo bloqueador para produção real.
2. Seed script para `exercises`/`muscle_groups`/`equipment` (catálogo vazio em dev — carry-over de sessões anteriores).
3. Abrir PR para branch `feat/task11-execucao-treino` (acumula TASK11-TASK19, ainda não mergeada) — não há mais tasks de backlog pendentes, bom momento para mergear.
4. Trabalho futuro incremental, sem spec própria: subir os baselines de cobertura (T1/T2 da TASK19) em direção às metas de `docs/context/decisions.md` (90/80/60 backend, 70/90/100 frontend); upgrade do `next-auth` de `5.0.0-beta.29` para versão estável, quando existir.

---

## Decisões desta sessão

- Gate de cobertura é ratchet anti-regressão (baseline real medido, margem ~2pp), não as metas aspiracionais de `docs/context/decisions.md` — subir o número é trabalho futuro incremental, não desta spec.
- **Débito "migrations automáticas no Docker" resolvido:** `apps/api/Dockerfile` agora propaga falha de `prisma migrate deploy` (`|| exit 1` antes do `exec node dist/main.js`) — container não sobe mais com schema inconsistente. `SKIP_MIGRATIONS=1` preservado.
- `ResponseInterceptor` global envelopava toda resposta em `{data,error}`, o que quebraria o formato de exposição Prometheus em `/metrics` — criado decorator `@RawResponse()` para rotas de infra escaparem do envelope.
- Sentry (backend e frontend) é no-op total sem DSN configurado — sem chamada de rede, sem side-effect de import. Primeiro DSN real e primeiro deploy manual ficam por conta do usuário.
- Detalhes completos (baselines exatos, contratos, lista de arquivos) em `docs/changelog/2026-06-18.md` § TASK18/TASK19.

---

## Bloqueadores / Perguntas abertas

- (nenhum)
