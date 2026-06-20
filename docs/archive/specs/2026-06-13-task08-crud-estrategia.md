# Spec & Plan: TASK08 — CRUD de Estratégia (Programas)

**Status:** approved
**Data:** 2026-06-13
**Autor:** Planner (IA)

---

## 1. Problema e Visão Geral

`/strategies` (backend) já expõe CRUD completo (TASK03) e `/library` já lista programas reais (TASK09). Porém o frontend só permite **ler**, **ativar/desativar** e **excluir** um programa (Estratégia). Não há como **criar** um novo programa nem **editar** nome/split/descrição de um existente — o botão "Criar novo programa" em `/library` é decorativo e `ProgramOptionsMenu` não tem opção "Editar".

Esta task fecha o ciclo CRUD no frontend, usando os endpoints já existentes, e desbloqueia TASK09 (CRUD de Rotina & Treinos), que assume que o usuário pode criar um programa vazio e depois popular com treinos.

---

## 2. Cenários de Usuário

- **P1 (crítico):** Como usuário, quero criar um novo programa (nome + split opcional + descrição opcional) a partir de `/library`, para depois adicionar treinos a ele.
- **P1 (crítico):** Como usuário, quero editar nome, split e descrição de um programa existente em `/program/[id]`, para corrigir ou reorganizar minha divisão de treino.
- **P2 (importante):** Como usuário, quero escolher "Personalizado" quando meu split não se encaixa em ABC/Upper-Lower/PPL/Full Body, para nomear minha própria divisão livremente.
- **P3 (nice-to-have):** Como usuário, quero ver uma mensagem clara se o nome ficar vazio ou se a API falhar, sem perder o que já digitei.

> P1 = sem isso o produto não funciona. P2 = valor claro mas contornável. P3 = melhoria futura.

---

## 3. Requisitos Funcionais

- **FR-001:** Em `/library`, o card "Criar novo programa" abre um dialog com campos Nome (obrigatório), Split (select: ABC, Upper/Lower, PPL, Full Body, Personalizado — opcional) e Descrição (textarea, opcional).
- **FR-002:** Ao submeter o dialog de criação com nome válido, chama `POST /strategies` (`{ name, type?, description? }`); se `type === "Personalizado"`, envia `type: undefined`. Em caso de sucesso, fecha o dialog, invalida `["strategies"]` e navega para `/program/[novoId]`.
- **FR-003:** Em `/program/[id]`, o menu "⋮" (`ProgramOptionsMenu`) ganha a opção "Editar", que abre o mesmo dialog pré-preenchido com `name`, `type` (ou "Personalizado" se `type` for `null`) e `description` do programa atual.
- **FR-004:** Ao submeter o dialog de edição com nome válido, chama `PATCH /strategies/:id` (`{ name, type, description }`) com os mesmos mapeamentos de FR-002. Em caso de sucesso, fecha o dialog e invalida `["strategies"]` e `["strategy", id]` (já feito por `useUpdateStrategy`).
- **FR-005:** Nome vazio (ou só espaços) bloqueia o submit e mostra erro inline "Nome é obrigatório" — sem chamar a API.
- **FR-006:** Durante a mutation (`isPending`), o botão "Salvar" mostra estado de loading e fica desabilitado; campos permanecem editáveis.
- **FR-007:** Erro de API (qualquer status) mantém o dialog aberto, preserva os valores digitados e mostra mensagem inline "Não foi possível salvar. Tente novamente.".

> Cada FR deve ser independente e testável.

---

## 4. Fora do Escopo & Riscos

- **Fora do Escopo:**
  - Criação/edição/reordenação de treinos (Rotinas) dentro do programa — TASK09.
  - Enforce de limites do plano gratuito (máx. 2 programas ativos) — TASK10.
  - Duplicar/clonar programa, templates pré-criados (Fase 6 — Explorar).
  - Alterações no backend: `CreateStrategyDto`/`UpdateStrategyDto`/use cases já suportam `name`, `type`, `description`, `isActive` (TASK03) — nenhum endpoint novo necessário.
- **Premissa:** `@radix-ui/react-dialog` já está em `apps/web/package.json` (dependência presente, sem componente shadcn `Dialog` ainda criado).
- **Risco:** Reuso do form entre criar/editar pode acoplar demais os dois fluxos → Mitigação: um único componente `StrategyFormDialog` controlado por props (`mode: "create" | "edit"`, `initialValues?`, `onSubmit`), sem lógica de navegação/mutation interna além do `onSubmit` recebido.
- **Risco:** Mapeamento `type` ↔ "Personalizado" pode dessincronizar com `ProgramHeader` (que já trata `type ?? "Personalizado"` como exibição) → Mitigação: centralizar essa constante/mapeamento em `apps/web/src/lib/onboarding/split-presets.ts` (reusar `SPLIT_PRESETS` keys + novo valor `"Personalizado"`), única fonte de verdade.

---

## 5. Contratos de API (já implementados — TASK03, sem mudanças)

- `POST /strategies`
  - **Request:** `{ name: string; type?: string; description?: string }`
  - **Response:** `StrategySummaryDto`
- `PATCH /strategies/:id`
  - **Request:** `{ name?: string; type?: string; description?: string; isActive?: boolean }`
  - **Response:** `StrategySummaryDto`

---

## 6. Plano de Implementação (Tarefas)

### Tarefa 1: Dialog UI primitive
- **Tipo:** chore
- **Agente:** frontend
- **Descrição:** Criar `apps/web/src/components/ui/dialog.tsx` (padrão shadcn/ui sobre `@radix-ui/react-dialog`, já é dependência): `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`. Seguir o mesmo padrão visual/estrutural de `alert-dialog.tsx`.
- **Critérios de Aceite:**
  - [x] Componente renderiza overlay + content com animações consistentes com `AlertDialog`.
  - [x] `tsc`/lint sem erros novos.

### Tarefa 2: Hook `useCreateStrategy`
- **Tipo:** feature
- **Agente:** frontend
- **Descrição:** Criar `apps/web/src/lib/api/hooks/use-create-strategy.ts`, mutation `POST /strategies` via `apiFetch<StrategySummaryDto>`, `onSuccess` invalida `["strategies"]`. Seguir o padrão de `use-update-strategy.ts`/`use-delete-strategy.ts`.
- **Critérios de Aceite:**
  - [x] `mutateAsync({ name, type?, description? })` retorna `StrategySummaryDto`.
  - [x] `["strategies"]` invalidado em `onSuccess`.
  - [x] Teste unitário cobrindo sucesso e invalidation.

### Tarefa 3: `StrategyFormDialog` (componente compartilhado criar/editar)
- **Tipo:** feature
- **Agente:** frontend
- **Descrição:** Criar `apps/web/src/components/library/StrategyFormDialog.tsx`. Props: `open`, `onOpenChange`, `mode: "create" | "edit"`, `initialValues?: { name: string; type: SplitType | "Personalizado" | undefined; description?: string }`, `onSubmit: (values: { name: string; type?: string; description?: string }) => Promise<unknown>`. Campos: `Input` (nome), `Select` (split: chaves de `SPLIT_PRESETS` + `"Personalizado"`), `Textarea` (descrição). Implementa FR-005/FR-006/FR-007 (validação de nome, loading, erro inline).
- **Critérios de Aceite:**
  - [x] Nome vazio/whitespace bloqueia submit com mensagem inline (FR-005).
  - [x] `type === "Personalizado"` mapeado para `type: undefined` no `onSubmit` (FR-002/FR-004).
  - [x] `onSubmit` em erro mantém dialog aberto + valores + mensagem de erro (FR-007).
  - [x] Botão "Salvar" desabilitado e com loading durante `onSubmit` pendente (FR-006).

### Tarefa 4: Criar programa — `/library`
- **Tipo:** feature
- **Agente:** frontend
- **Descrição:** Em `apps/web/src/components/library/LibraryListPage.tsx`, transformar `CreateNewCard` em trigger do `StrategyFormDialog` (`mode="create"`, sem `initialValues`). `onSubmit` chama `useCreateStrategy().mutateAsync`; em sucesso, `router.push(`/program/${strategy.id}`)` (FR-001/FR-002).
- **Critérios de Aceite:**
  - [x] Clique em "Criar novo programa" abre o dialog.
  - [x] Submit válido cria a estratégia e navega para `/program/[id]`.
  - [x] Lista de `/library` reflete o novo programa após navegação de volta (cache invalidado).

### Tarefa 5: Editar programa — `/program/[id]`
- **Tipo:** feature
- **Agente:** frontend
- **Descrição:** Em `apps/web/src/components/library/ProgramOptionsMenu.tsx`, adicionar item "Editar" no `DropdownMenu` que abre `StrategyFormDialog` (`mode="edit"`, `initialValues` derivados de `strategy` — `type: strategy.type ?? "Personalizado"`). `onSubmit` chama `useUpdateStrategy().mutateAsync({ id: strategy.id, data })` (FR-003/FR-004).
- **Critérios de Aceite:**
  - [x] "Editar" abre dialog pré-preenchido com dados atuais do programa.
  - [x] Submit válido atualiza nome/split/descrição; `ProgramHeader` reflete a mudança sem reload manual.
  - [x] Programa sem `type` (`null`) abre o dialog com "Personalizado" selecionado.

### Tarefa 6: Testes
- **Tipo:** test
- **Agente:** frontend
- **Descrição:** Cobrir `use-create-strategy.test.ts`, `StrategyFormDialog.test.tsx` (validação, mapeamento "Personalizado", erro/loading) e fluxos de `LibraryListPage`/`ProgramOptionsMenu` (criar → navega; editar → atualiza header).
- **Critérios de Aceite:**
  - [x] Todos os testes novos passam (`pnpm --filter web test`).
  - [x] Nenhum teste existente quebra (77/77, sendo 66 anteriores + 11 novos).

---

<!--
GATE DE APROVAÇÃO
Revise as regras de negócio e as tarefas técnicas.
Se tudo estiver correto, altere o Status acima de "review" para "approved" para liberar os agentes de frontend/backend para iniciar a implementação.
-->
