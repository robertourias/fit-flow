# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-06-12
**Resumo de progresso global:** Fase 2 completa a 80% — Backend T1-T4 + Frontend T5-T7 finalizados; T8+T9 em progresso (80% done). Infraestrutura TanStack Query + hooks + UI components prontos. Library/program pages usando dados reais via API.
**Resumo da última sessão:** Integração T8+T9 — /library refatorada com useStrategies, /program/[id] criado como Server Component com ProgramHeader integrado, ProgramHeader refatorado para aceitar StrategyDetailDto e renderizar ProgramOptionsMenu. ExercisesClientPage preparado com prop opcional (TODO hook integration). 3 commits incrementais.

---

## Spec Ativo

`docs/specs/2026-06-11-fase2-integracao-frontend-backend.md` (Status: approved) — T8+T9 UI Integration

---

## 🔄 Em Progresso

**T8+T9** — Frontend UI integration (Exercises + Library/Program)
- Hooks layer: 100% ✅ (useExercises, useStrategy, useStrategies, mutations)
- UI components: 100% ✅ (DropdownMenu, AlertDialog, ProgramOptionsMenu)
- Server pages: 100% ✅ (/program/[id], /library refactored, /exercises shell)
- Client component integration: 80% (ExercisesClientPage needs useExercises + InfiniteQuery, FilterBar needs hook options)
- Estimated: 80% overall completion
- Próximo passo: Refatorar ExercisesClientPage para useExercises({search, muscleGroupSlug, equipmentSlug, category}) com InfiniteQuery

---

## ⏭ Próximos Passos Imediatos

1. Refatorar ExercisesClientPage: substituir filtro local por useExercises hook com params
2. Integrar useMuscleGroups/useEquipment em FilterBar para preencher opções dinâmicas
3. Mapear ExerciseDto → Exercise shape (primaryMuscles via isPrimary, bookmarkCount fixo)
4. Testar /exercises e /exercises/[id] com dados reais da API

---

## Decisões desta Sessão

- /program/[id] como Server Component (parallel apiFetch, não useQuery)
- ProgramHeader como client component com inline ProgramOptionsMenu (não modal)
- ExercisesClientPage prop opcional com fallback (facilita refactor incremental)
- Status em docs/plans/ atualizado para 80% (T8), 75% (T9)

---

## Bloqueadores / Perguntas Abertas

- (nenhum) — ExercisesClientPage refactor é trabalho direto, sem dependências externas
