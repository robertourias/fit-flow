# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-06-16
**Resumo de progresso global:** Fase 2 (T1-T9) e Fase 3 TASK08-TASK12 concluídas. App cobre dashboard, biblioteca de exercícios, CRUD de programas/estratégias/rotinas/treinos, limites do plano gratuito, execução real de treino (start → session → finish) e histórico de sessões (`/history` + `/history/[id]`) com retenção de 60 dias (FREE) aplicada server-side.
**Resumo da última sessão:** TASK12 (Histórico de sessões): spec gerada/aprovada; T1-T7 implementados via `/hands-on` em 4 ondas paralelas — backend `workoutName` no entity/DTO, `@fitflow/types` atualizado, nav "Histórico" + layout, hooks `useWorkoutSessions`/`useWorkoutSession`/`useUserMe`, páginas `/history` (lista + banner FREE + load more) e `/history/[id]` (detalhe + séries executadas); tsc/lint/jest limpos (api 19s/177t, web 37s/239t). Alterações ainda não commitadas.

---

## Feature em andamento

**Spec ativo:** (nenhum) — `docs/specs/2026-06-15-task12-historico-sessoes.md` concluído (T1-T7 `done`, backlog atualizado).

---

## Tasks (Foco no Presente)

### 🔄 Em progresso

(nenhum) — TASK12 concluída, commit/PR pendentes.

### ⏭ Próximos passos imediatos

1. Commitar e abrir PR para TASK12 (branch `feat/task11-execucao-treino` ou nova branch `feat/task12-historico-sessoes`).
2. `/spec TASK13` — Dashboards de Progresso (depende de TASK12 ✓).
3. Seed script para `exercises`/`muscle_groups`/`equipment` (catálogo vazio em dev — carry-over).

---

## Decisões desta sessão

- `workoutName` denormalizado via join (`workout: { select: { name: true } }`) no repositório — reflete nome atual do treino, sem snapshot histórico; aceitável para v1.
- Mocks de `next/link` em RTL exigem `__esModule: true` para interop de default export — padrão a seguir em todos os testes futuros que mockam `next/link`.
- `useInfiniteQuery.fetchNextPage()` em testes: usar `act(() => { result.current.fetchNextPage(); })` + `waitFor` (não `await act(async)`).

---

## Bloqueadores / Perguntas abertas

- (nenhum)
