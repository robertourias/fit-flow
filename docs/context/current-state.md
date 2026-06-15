# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-06-15
**Resumo de progresso global:** Fase 2 (T1-T9) e Fase 3 TASK08-TASK11 concluídas. App cobre dashboard, biblioteca de exercícios, CRUD de programas/estratégias/rotinas/treinos, limites do plano gratuito e execução real de treino (start → session → finish) persistida via `/workout-sessions`.
**Resumo da última sessão:** PR #2 (TASK10) mergeado em `main`. TASK11 (Execução de treino): spec gerada/aprovada; T1-T10 implementadas via `/hands-on` em 4 ondas paralelas — fluxo `/workout/[id]` → `/start` → `/session` → `/finish` migrado de mock (`@/lib/mock/workout`, removido) para dados reais (API + `useLastFinishedSession`/`useCreateWorkoutSession`); `tsc`/lint/jest limpos (api 19 suites/175 tests, web 32 suites/212 tests).

---

## Feature em andamento

**Spec ativo:** (nenhum) — `docs/specs/2026-06-15-task11-execucao-treino.md` concluído (T1-T10 `done`, backlog atualizado).

---

## Tasks (Foco no Presente)

### 🔄 Em progresso

(nenhum) — TASK11 concluída, commit/PR em andamento.

### ⏭ Próximos passos imediatos

1. Abrir PR de TASK11 (branch `feat/task11-execucao-treino`) e mergear em `main`.
2. `/spec TASK12` — Histórico de sessões (próximo item do backlog, depende de TASK11 ✓).
3. Seed script para `exercises`/`muscle_groups`/`equipment` (catálogo vazio em dev — carry-over, ver README "Solução de problemas").

---

## Decisões desta sessão

- `@/lib/mock/workout.ts` removido — fluxo de execução de treino 100% real, sem fallback mock.
- `startSession(workoutId, exerciseIds)` (Zustand) muda assinatura: semeia `exercises` por `exerciseId` na ordem `workout.exercises` (`order` asc), sem depender de tipos mock.
- Editor DnD inline de `/workout/[id]` (antigo `WorkoutDetailPage` + `SuggestionsPanel.tsx`) removido — edição completa já cobre `/workout/[id]/edit` (TASK09).
- Sessão só é persistida (`POST /workout-sessions`, sempre `status: "FINISHED"`) ao concluir "Salvar Treino"; status `ACTIVE`/retomar entre dispositivos fora de escopo (TASK11).

---

## Bloqueadores / Perguntas abertas

- (nenhum)
