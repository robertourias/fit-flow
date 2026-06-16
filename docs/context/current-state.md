# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-06-16
**Resumo de progresso global:** Fases 0-3 e TASK10-TASK13 concluídas. App cobre dashboard, biblioteca de exercícios, CRUD de programas/estratégias/rotinas/treinos, limites do plano gratuito, execução real de treino, histórico de sessões (`/history`) e página de progresso dedicada (`/progress`) com volume, duração, músculos e heatmap de atividade (12 semanas).
**Resumo da última sessão:** TASK13 (Dashboards de Progresso): spec gerada/aprovada; T1-T6 implementados em 4 ondas — backend `durationData`/`semanalDuracao`/`heatmapData` em `DashboardSummaryDto` com lookback 84 dias; `@fitflow/types` rebuild; nav "Progresso" com href + `progress/layout.tsx`; `DurationChartClient` + `ActivityHeatmapClient` (grade 12×7, 3 intensidades); `progress/page.tsx` Server Component; tsc limpo, 18 testes passando. Commitado em `089e0a1`.

---

## Feature em andamento

**Spec ativo:** (nenhum) — `docs/specs/2026-06-16-task13-dashboards-progresso.md` concluído, backlog atualizado.

---

## Tasks (Foco no Presente)

### 🔄 Em progresso

(nenhum) — TASK13 concluída e commitada.

### ⏭ Próximos passos imediatos

1. `/spec TASK14` — Medidas Corporais (peso, bioimpedância, histórico 60 dias; depende de TASK12 ✓).
2. Seed script para `exercises`/`muscle_groups`/`equipment` (catálogo vazio em dev — carry-over).
3. Abrir PR para branch `feat/task11-execucao-treino` (contém TASK11-TASK13).

---

## Decisões desta sessão

- Lookback do `GetDashboardSummaryUseCase` ampliado de `prevMonthStart` (~31-62 dias) para `now - 84 dias`; streak ainda usa a mesma janela — cap de 84 dias documentado em código com comentário.
- `ActivityHeatmapClient` usa `title` nativo (HTML) em vez de Radix Tooltip — `@radix-ui/react-tooltip` não instalado em `apps/web`.
- `@fitflow/types` dist gerado por `tsc` (não bundler) — rebuild manual necessário após mudanças em `packages/types/src/index.ts`.
- 3 mocks de TASK11 (`WorkoutActiveSession`, `WorkoutFinishForm`, `WorkoutStartPreview`) faltavam `workoutName` em fixtures; corrigidos como parte de T6.

---

## Bloqueadores / Perguntas abertas

- (nenhum)
