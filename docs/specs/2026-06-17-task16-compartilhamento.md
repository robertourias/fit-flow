# Spec & Plan: TASK16 — Compartilhamento

**Status:** approved
**Data:** 2026-06-17
**Autor:** Claude (Planner)

---

## 1. Problema e Visão Geral

Usuários terminam um treino ou acompanham progresso (TASK11-TASK13) mas não têm como divulgar isso fora do app. TASK16 adiciona um gerador de card-imagem (PNG) com resumo do treino concluído ou do progresso semanal, pronto para compartilhar em redes sociais. Decisão de produto (confirmada com usuário): cobre os dois gatilhos (sessão concluída e progresso), geração 100% client-side (sem novo endpoint), com fallback de download + Web Share API quando disponível.

Feature é puramente frontend: todos os dados necessários (sessão, dashboard) já são buscados por hooks existentes (`useWorkoutSession`, `/workout-sessions/summary`). Não há migration nem endpoint novo.

---

## 2. Cenários de Usuário

- **P1 (crítico):** Como usuário, quero compartilhar um card-resumo do treino recém-concluído como imagem, para postar nas redes sociais.
- **P2 (importante):** Como usuário, quero compartilhar um card-resumo do meu progresso da semana, para mostrar evolução.
- **P3 (nice-to-have):** Como usuário em mobile, quero usar o share sheet nativo (Web Share API) ao compartilhar, para postar direto no Instagram/WhatsApp sem precisar salvar e abrir o app manualmente.

---

## 3. Requisitos Funcionais

- **FR-001:** Adicionar dependência `html-to-image` em `apps/web`. Util `apps/web/src/lib/share/export-image.ts`: `exportNodeToPngBlob(node: HTMLElement): Promise<Blob>` — aguarda `document.fonts.ready` antes de capturar, usa `toBlob` com `pixelRatio: 2`.
- **FR-002:** Mesmo arquivo: `shareOrDownloadImage(blob: Blob, filename: string): Promise<"shared" | "downloaded">`. Se `navigator.canShare?.({ files: [file] })` retornar `true`, usa `navigator.share({ files: [file] })`; senão cria `<a download>` a partir de `URL.createObjectURL(blob)` e dispara o clique.
- **FR-003:** `apps/web/src/lib/training/session-volume.ts`: `computeSessionVolume(exercises: SessionExerciseDto[]): number` — soma `kg × reps` de todos os `executedSets` de todos os exercícios (sets com `kg = null` contam como 0).
- **FR-004:** `apps/web/src/components/share/ShareCardSessionTemplate.tsx` — formato fixo 1080×1350px (proporção 4:5, compatível com feed e stories com margem). Mostra: nome do treino (`workoutName`), data (`startedAt` formatado via `date-fns`), duração (`endedAt - startedAt`), volume total (via `computeSessionVolume`), número de exercícios, wordmark "FitFlow" e fundo com gradiente da cor `--primary`.
- **FR-005:** `apps/web/src/components/share/ShareCardProgressTemplate.tsx` — mesmo formato 1080×1350px. Mostra: rótulo de período ("Esta semana"), `volumeSemanal`, `diasSequencia`, `treinosNoMes`, e os 3 grupos musculares com maior `percentual` de `DashboardSummaryDto.muscleGroups`.
- **FR-006:** `apps/web/src/components/share/ShareCardDialog.tsx` — modal (`Dialog` existente) com preview do card renderizado em tamanho real (sem offscreen — captura do próprio elemento visível, evita falhas de captura fora da viewport). Botão "Baixar imagem" sempre visível. Botão "Compartilhar" visível somente se `typeof navigator !== "undefined" && navigator.canShare` (feature-detect em `useEffect`, evita mismatch de SSR). Spinner no botão durante a exportação (`isExporting` state).
- **FR-007:** `apps/web/src/components/history/SessionDetailPage.tsx`: botão "Compartilhar" visível somente quando `status === "FINISHED"`. Abre `ShareCardDialog` com `ShareCardSessionTemplate` preenchido pelos dados já carregados por `useWorkoutSession`.
- **FR-008:** Página de Progresso (`apps/web/src/app/progress/page.tsx` / componente client correspondente): botão "Compartilhar progresso" abre `ShareCardDialog` com `ShareCardProgressTemplate`, alimentado pelo `DashboardSummaryDto` já carregado na página (sem novo fetch).

---

## 4. Fora do Escopo & Riscos

- **Fora do Escopo:** Customização de template pelo usuário (cores, layout, escolha de métricas).
- **Fora do Escopo:** Compartilhamento via link público / upload da imagem a um servidor — exportação é local ao dispositivo.
- **Fora do Escopo:** Geração server-side de imagem (satori/sharp) — fica para iteração futura se o client-side se mostrar insuficiente.
- **Fora do Escopo:** Formato dedicado 9:16 para Stories — usa-se único formato 4:5 (1080×1350), que renderiza bem tanto em feed quanto em Stories (com margem).
- **Premissa:** `WorkoutSessionDetailDto.exercises[].executedSets` já contém `kg` e `reps` suficientes para calcular volume (confirmado em `packages/types/src/index.ts`).
- **Premissa:** `DashboardSummaryDto` já contém `volumeSemanal`, `diasSequencia`, `treinosNoMes`, `muscleGroups` (confirmado em `packages/types/src/index.ts:243-259`).
- **Risco:** Fontes customizadas (Poppins/Inter) podem não estar carregadas no momento da captura, gerando fallback visual feio no PNG → Mitigação: `await document.fonts.ready` antes de chamar `exportNodeToPngBlob`.
- **Risco:** `navigator.share`/`canShare` indisponíveis em desktop e em browsers mais antigos → Mitigação: botão "Baixar imagem" sempre funciona como fallback único garantido; "Compartilhar" é estritamente progressive enhancement.
- **Risco:** Captura de elemento fora da viewport pode falhar silenciosamente em alguns browsers com `html-to-image` → Mitigação: o card é sempre renderizado visível dentro do `Dialog` (preview = elemento real capturado), nunca offscreen.

---

## 5. Contratos de API

Não aplicável — feature 100% client-side. Nenhum endpoint novo; reaproveita dados já buscados por `useWorkoutSession` (sessão) e `/workout-sessions/summary` (progresso).

---

## 6. Plano de Implementação (Tarefas)

### Ordem de Execução & Dependências

| Onda | Tarefas (paralelas) | Agente(s) | Pré-requisito |
|------|---------------------|-----------|---------------|
| 1 | T1, T2, T4 | frontend | — |
| 2 | T3, T5 | frontend | T1, T2 |
| 3 | T6, T7 | frontend | T3, T4, T5 |
| 4 | T8 | frontend | T6, T7 |

```
Onda 1: T1 (export-image util) | T2 (session-volume util) | T4 (ShareCardProgressTemplate)  ← paralelo
Onda 2: T3 (ShareCardSessionTemplate, depende de T2) | T5 (ShareCardDialog, depende de T1)   ← paralelo
Onda 3: T6 (integração SessionDetailPage) | T7 (integração Progress page)                    ← paralelo
Onda 4: T8 (testes finais + fechamento)
```

---

### Tarefa T1: Util de exportação de imagem
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T2, T4
- **Descrição:**
  - Adicionar dependência `html-to-image` em `apps/web/package.json`.
  - `apps/web/src/lib/share/export-image.ts`:
    - `exportNodeToPngBlob(node: HTMLElement): Promise<Blob>` — `await document.fonts.ready`, depois `toBlob(node, { pixelRatio: 2 })` (lança se `null`).
    - `shareOrDownloadImage(blob: Blob, filename: string): Promise<"shared" | "downloaded">`:
      - Monta `File` a partir do blob.
      - Se `navigator.canShare?.({ files: [file] })`: `await navigator.share({ files: [file], title: filename })`; retorna `"shared"`.
      - Senão: cria `<a>` com `URL.createObjectURL(blob)` + `download = filename`, dispara `.click()`, revoga a URL; retorna `"downloaded"`.
- **Critérios de Aceite:**
  - [x] `exportNodeToPngBlob` aguarda fonts antes de capturar.
  - [x] `shareOrDownloadImage` usa Web Share API quando `canShare` é `true`; cai para download quando `false`/ausente.
  - [x] Testes unitários (jest, mocks de `navigator.share`/`canShare` e do módulo `html-to-image`) cobrindo os dois caminhos.

---

### Tarefa T2: Util de cálculo de volume da sessão
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T1, T4
- **Descrição:**
  - `apps/web/src/lib/training/session-volume.ts`: `computeSessionVolume(exercises: SessionExerciseDto[]): number` — soma `(set.kg ?? 0) * set.reps` de todos os `executedSets` de todos os `exercises`.
- **Critérios de Aceite:**
  - [x] Soma correta com múltiplos exercícios e sets.
  - [x] Sets com `kg = null` contam como 0 (não quebram o cálculo).
  - [x] Teste unitário cobrindo lista vazia, um exercício e múltiplos exercícios.

---

### Tarefa T4: `ShareCardProgressTemplate`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T1, T2
- **Descrição:**
  - `apps/web/src/components/share/ShareCardProgressTemplate.tsx`: componente puro, `1080×1350px` (usar `aspect-[4/5]` + largura fixa em px, sem depender de viewport), recebe `summary: DashboardSummaryDto` via props.
  - Conteúdo: rótulo "Esta semana", `volumeSemanal` (kg), `diasSequencia` (dias), `treinosNoMes`, top 3 de `muscleGroups` ordenado por `percentual` desc. Fundo gradiente `--primary`, wordmark "FitFlow".
- **Critérios de Aceite:**
  - [x] Renderiza todos os campos a partir de `DashboardSummaryDto`.
  - [x] Top 3 grupos musculares corretos (ordenação por `percentual`).
  - [x] Teste RTL cobrindo render com dados de exemplo.

---

### Tarefa T3: `ShareCardSessionTemplate`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T2
- **Paralelizável com:** T5
- **Descrição:**
  - `apps/web/src/components/share/ShareCardSessionTemplate.tsx`: mesmo formato 1080×1350px, recebe `session: WorkoutSessionDetailDto` via props.
  - Conteúdo: `workoutName`, data (`startedAt` formatado `date-fns`, ex: "17 de junho"), duração (`endedAt - startedAt` em min), volume total (`computeSessionVolume(session.exercises)`), `session.exercises.length`. Mesmo fundo/wordmark de T4 (reaproveitar estilos/sub-componentes comuns se fizer sentido, ex: `ShareCardFrame`).
- **Critérios de Aceite:**
  - [x] Renderiza todos os campos a partir de `WorkoutSessionDetailDto`.
  - [x] Volume exibido usa `computeSessionVolume`.
  - [x] Teste RTL cobrindo render com dados de exemplo.

---

### Tarefa T5: `ShareCardDialog`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T1
- **Paralelizável com:** T3
- **Descrição:**
  - `apps/web/src/components/share/ShareCardDialog.tsx`: `Dialog` com `DialogContent` exibindo `children` (o template) em uma `ref` interna.
  - Props: `open`, `onOpenChange`, `filename: string`, `children: ReactNode`.
  - Estado `canShare` setado em `useEffect` via `typeof navigator !== "undefined" && !!navigator.canShare`.
  - Botão "Baixar imagem": chama `exportNodeToPngBlob(ref.current)` → `shareOrDownloadImage(blob, filename)` com `mode` forçado para download (ou reaproveita a mesma função, já que ela só compartilha se `canShare`; manter um único botão "Compartilhar/Baixar" é aceitável, mas a spec pede aceite explícito de ambos os caminhos — preferir **dois botões**: "Baixar imagem" sempre chama o caminho de download direto; "Compartilhar" só aparece se `canShare` e chama `navigator.share`).
  - `isExporting` state com spinner durante a chamada.
- **Critérios de Aceite:**
  - [x] "Baixar imagem" sempre visível e funcional.
  - [x] "Compartilhar" só renderiza quando `canShare` é `true` no client.
  - [x] Spinner exibido durante exportação; erros de exportação não quebram a UI (toast de erro).
  - [x] Teste RTL (mock de `export-image.ts`) cobrindo os dois botões e o estado de loading.

---

### Tarefa T6: Integração — `SessionDetailPage`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T3, T5
- **Paralelizável com:** T7
- **Descrição:**
  - `apps/web/src/components/history/SessionDetailPage.tsx`: adicionar botão "Compartilhar" visível somente quando `session.status === "FINISHED"`. Ao clicar, abre `ShareCardDialog` (filename ex: `treino-${session.workoutName}.png`) renderizando `ShareCardSessionTemplate` com `session`.
- **Critérios de Aceite:**
  - [x] Botão "Compartilhar" ausente para sessões `ACTIVE`/`ABANDONED`.
  - [x] Botão presente e abre o dialog para sessões `FINISHED`.
  - [x] Teste RTL cobrindo os dois casos.

---

### Tarefa T7: Integração — Página de Progresso
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T4, T5
- **Paralelizável com:** T6
- **Descrição:**
  - `apps/web/src/app/progress/page.tsx` (ou componente client já existente nessa página): adicionar botão "Compartilhar progresso" que abre `ShareCardDialog` (filename ex: `progresso-semana.png`) renderizando `ShareCardProgressTemplate` com o `DashboardSummaryDto` já carregado na página.
- **Critérios de Aceite:**
  - [x] Botão presente na página de Progresso.
  - [x] Dialog abre com os dados corretos do resumo já carregado (sem novo fetch).
  - [x] Teste RTL cobrindo abertura do dialog com dados mockados.

---

### Tarefa T8: Testes finais + fechamento
- **Tipo:** chore
- **Agente:** frontend
- **Depende de:** T6, T7
- **Paralelizável com:** —
- **Descrição:**
  - `tsc`/lint/jest limpos em `apps/web`.
  - `docs/context/product-backlog.md`: TASK16 → `done`, coluna Spec preenchida.
- **Critérios de Aceite:**
  - [x] `tsc`/lint/jest limpos em `apps/web`.
  - [x] Backlog atualizado.

---

<!--
GATE DE APROVAÇÃO
Revise as regras de negócio e as tarefas técnicas.
Se tudo estiver correto, altere o Status acima de "review" para "approved" para liberar os agentes de frontend/backend para iniciar a implementação.
-->
