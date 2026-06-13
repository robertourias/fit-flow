# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-06-13
**Resumo de progresso global:** Fase 2 (T1-T9) concluída — Backend T1-T4 + Frontend T5-T9 finalizados. Catálogo de exercícios e Library/Program rodando 100% sobre API real.
**Resumo da última sessão:** Fix bug `/api/proxy/users/me` 500 (ECONNREFUSED) via novo `API_INTERNAL_URL` server-side. TASK08 (Exercícios) e TASK09 (Library/Program) concluídas: ExercisesClientPage+FilterBar com hooks reais (slug/category/search/paginação), WorkoutCard/WorkoutListRow refatorados para `WorkoutDetailDto`+`programColor`, integrados em `/program/[id]`.

---

## Spec Ativo

`docs/specs/2026-06-11-fase2-integracao-frontend-backend.md` (Status: approved) — T1-T9 concluídos.

---

## 🔄 Em Progresso

(nenhum) — Fase 2 concluída.

---

## ⏭ Próximos Passos Imediatos

1. Commitar mudanças pendentes (T8+T9 + fix API_INTERNAL_URL).
2. Avaliar próxima fase do produto (ver `docs/context/product.md`/backlog).
3. Seed script para `exercises`/`muscle_groups`/`equipment` (catálogo vazio em dev — ver README "Solução de problemas").

---

## Decisões desta Sessão

- `API_INTERNAL_URL` (novo env, default `http://api:3001`): usado por código server-side (`apiFetch` server branch + proxy BFF) dentro do container `web`, com fallback para `NEXT_PUBLIC_API_URL`.
- `WorkoutCard`/`WorkoutListRow` usam `programColor(workout.id)` no lugar de imagem mockada.
- `bookmarkCount` (FR-013) considerado N/A — campo não exibido no card/detail real (fora do design atual).

---

## Bloqueadores / Perguntas Abertas

- (nenhum)
