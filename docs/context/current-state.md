# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-06-13
**Resumo de progresso global:** Fase 2 (T1-T9) concluída. TASK08 (CRUD de Estratégia/Programas no frontend) concluída — usuário já pode criar, editar, ativar/desativar e excluir programas via UI.
**Resumo da última sessão:** Implementadas as 6 tarefas de TASK08: Dialog primitive, `StrategyFormDialog` (criar/editar compartilhado), `useCreateStrategy`, integração em `/library` e `/program/[id]`. Adicionada infra de teste de componentes (jest-environment-jsdom + @testing-library/react) e 11 testes novos (77/77 total). Commitado em `cfd6548`.

---

## Feature em andamento

**Spec ativo:** (nenhum) — `docs/specs/2026-06-13-task08-crud-estrategia.md` concluído (todas as tarefas `done`).

---

## Tasks (Foco no Presente)

### 🔄 Em progresso

(nenhum) — TASK08 concluída e commitada.

### ⏭ Próximos passos imediatos

1. `/spec TASK09` — CRUD de Rotina & Treinos (próximo item do backlog, depende de TASK08 ✓).
2. Seed script para `exercises`/`muscle_groups`/`equipment` (catálogo vazio em dev — carregado de sessões anteriores, ver README "Solução de problemas").

---

## Decisões desta sessão

- Test infra para componentes React adicionada (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jest-environment-jsdom`) — decisão do usuário, escalação aprovada (Tarefa 6 de TASK08 estava bloqueada sem isso).
- `StrategyFormDialog` é um único componente controlado por `mode: "create" | "edit"` + `initialValues?`, sem lógica de navegação/mutation própria (mitigação de risco do spec).
- `isSplitType()` em `split-presets.ts` é a fonte única de verdade para o mapeamento `type ↔ "Personalizado"`.
- Abertura de `Dialog` a partir de item de `DropdownMenu` deve deferir o `setState` via `setTimeout` (evita focus-fight entre `FocusScope`s do Radix).

---

## Bloqueadores / Perguntas abertas

- (nenhum)
