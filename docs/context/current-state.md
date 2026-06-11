# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.

**Última atualização:** 2026-06-11
**Resumo de progresso global:** Fase 2 — Integração & Fluxo: T1-T7 completos (backend + frontend infra + onboarding + dashboard). T8+T9 hooks criados, UI components implementados, integration points claros.

**Resumo da última sessão:** T1-T4 backend (hasOnboarded, empty exercises, dashboard summary, active workout) + T5-T7 frontend (TanStack Query, onboarding wizard, dashboard real data). T8+T9 hooks layer + UI components (DropdownMenu, AlertDialog, ProgramOptionsMenu). 162 tests passing.

---

## Spec Ativo

`docs/specs/2026-06-11-fase2-integracao-frontend-backend.md` (Status: approved) — TASK04-07

---

## 🔄 Em Progresso

**T8+T9** — Frontend integration (Exercises + Library/Program)
- Hooks: useExercises, useStrategy, mutations ✅
- UI components: DropdownMenu, AlertDialog, ProgramOptionsMenu ✅
- Remaining: integrate hooks into pages, create /program/[id], update /library
- % estimado: 40%
- Próximo passo: Implementar /exercises page com useExercises + useMuscleGroups/useEquipment

---

## ⏭ Próximos Passos Imediatos

1. Integrar `useExercises` em `/exercises/page.tsx` com pagination
2. Integrar `useStrategies` em `/library/page.tsx`
3. Criar `/program/[id]/page.tsx` com `useStrategy(id)`
4. Atualizar ProgramHeader.tsx com ProgramOptionsMenu + programColor

---

## Decisões desta Sessão

- Onboarding wizard via 3-step form com JWT session.update() + middleware gate
- Dashboard como Server Component com parallel apiFetch calls (não useQuery)
- T8+T9 hooks use TanStack Query com cache invalidation
- DropdownMenu/AlertDialog criados baseados em shadcn/Radix pattern

---

## Bloqueadores / Perguntas Abertas

- (nenhum) — próxima sessão pode prosseguir com T8+T9 UI integration
