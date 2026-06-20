# Spec & Plan: TASK13 — Dashboards de Progresso

**Status:** approved
**Data:** 2026-06-16
**Autor:** Claude (Planner)

---

## 1. Problema e Visão Geral

O `/dashboard` exibe um resumo semanal básico (volume, músculos, calendário do mês). Não existe uma página dedicada a progresso com: duração de treinos (faltante no DTO atual), heatmap de atividade das últimas 12 semanas e comparação de métricas. O usuário não tem um espaço específico para acompanhar sua evolução além do snapshot semanal no dashboard.

`GET /workout-sessions/summary` já computa `volumeData`, `muscleGroups` e `trainDates`. Faltam `durationData` (duração por dia da semana), `semanalDuracao` (total semanal em minutos) e `heatmapData` (últimas 12 semanas). A janela de busca atual (`prevMonthStart` ≈ 31–62 dias) deve ser ampliada para 84 dias para suportar o heatmap.

---

## 2. Cenários de Usuário

- **P1 (crítico):** Como usuário, quero ver uma página de progresso com volume, duração, dias treinados no mês e músculos trabalhados esta semana, para acompanhar minha evolução.
- **P1 (crítico):** Como usuário, quero um heatmap de atividade das últimas 12 semanas (estilo GitHub), para visualizar minha consistência de longo prazo.
- **P2 (importante):** Como usuário, quero ver quanto tempo (minutos/horas) treinei esta semana, dia a dia, para monitorar volume de tempo além de carga.
- **P3 (nice-to-have, fora de escopo):** Comparação semana a semana / mês a mês em gráfico de tendência.

---

## 3. Requisitos Funcionais

- **FR-001:** Backend — `DashboardSummaryDto` ganha três campos: `durationData: DurationDataDto[]` (duração total em minutos por dia da semana desta semana), `semanalDuracao: number` (soma total em minutos desta semana) e `heatmapData: HeatmapDataDto[]` (últimas 12 semanas = 84 dias, cada item `{ date: string; count: number }` onde `date` é ISO `YYYY-MM-DD` e `count` é número de sessões concluídas naquele dia).
- **FR-002:** Backend — `GetDashboardSummaryUseCase` amplia o lookback de `prevMonthStart` para `now - 84 dias` (12 semanas), mantendo toda a lógica existente de `treinosNoMes`/`treinosMesAnterior` (filtros internos já usam `monthStart` e `prevMonthStart`, não o lookback global). Duração de cada sessão: `endedAt - startedAt` em minutos (truncado); sessões sem `endedAt` contribuem 0 minutos.
- **FR-003:** `@fitflow/types` — espelha `DurationDataDto { dia: string; totalMinutos: number }`, `HeatmapDataDto { date: string; count: number }` e os novos campos em `DashboardSummaryDto`.
- **FR-004:** `DurationChartClient` (novo, `"use client"`) — gráfico de barras (Recharts, mesmo padrão de `ProgressChartClient`) exibindo `durationData` (eixo Y em minutos, dias no eixo X: "Seg"–"Dom").
- **FR-005:** `ActivityHeatmapClient` (novo, `"use client"`) — grade 12 semanas × 7 dias onde cada célula representa um dia. Cor: sem sessão = `bg-muted`, 1 sessão = intensidade baixa, 2+ sessões = intensidade alta (3 tons usando variáveis CSS do tema). Tooltip com data e contagem. Semanas exibidas da mais antiga (esquerda) para a mais recente (direita); dias da semana no eixo Y (Seg–Dom).
- **FR-006:** `/progress` (nova rota, Server Component `ProgressPage`) — busca `DashboardSummaryDto` via `apiFetch("/workout-sessions/summary")` (mesmo endpoint do dashboard); renderiza: `MetricsStrip` (reutilizado, mesmos dados), `ProgressChartClient` (volume semanal, reutilizado), `DurationChartClient` (duração semanal, novo), `ActivityHeatmapClient` (heatmap 12 semanas, novo), `MuscleCard` (músculos da semana, reutilizado). Erro 401 → mensagem. Outros erros → mensagem genérica.
- **FR-007:** Navegação — `nav-content.tsx` ganha item "Progresso" (ícone `TrendingUp`, lucide) em `extraNavItems`, `href: "/progress"`. `AppShell.tsx`: `getActiveItem` mapeia `/progress` → `"progresso"`; `sectionTitles.progresso = "Progresso"`. Novo `apps/web/src/app/progress/layout.tsx` (padrão `history/layout.tsx`).

---

## 4. Fora do Escopo & Riscos

- **Fora do Escopo:** Gráfico de tendência semana a semana / mês a mês.
- **Fora do Escopo:** Per-exercise progression charts (evolução de carga por exercício).
- **Fora do Escopo:** Adicionar `semanalDuracao` ao `MetricsStrip` do `/dashboard` existente (escopo mínimo: novos campos apenas em `/progress`).
- **Fora do Escopo:** Heatmap interativo com filtros (TASK16 pode estender).
- **Premissa:** `WorkoutSession.endedAt` está sempre preenchido para sessões `FINISHED` (garantido por TASK11).
- **Premissa:** `GET /workout-sessions/summary` não tem outros consumidores além de `/dashboard` e `/progress` — adicionar campos é retrocompatível.
- **Risco:** Ampliar lookback para 84 dias aumenta volume de sessões carregadas na query. → Mitigação: `findFinishedSince` já usa índice em `(tenantId, startedAt)`; 84 dias com sessões diárias = ~84 rows por usuário — aceitável.
- **Risco:** `streak` usa `sessions` para detectar dias consecutivos. Com lookback de 84 dias, streaks > 84 dias terão undercount. → Mitigação: aceitável para MVP; documentar limite em código com comentário.

---

## 5. Contratos de API

- `GET /workout-sessions/summary` (existente, sem breaking change)
  - **Response:** `DashboardSummaryDto` com campos adicionais:
    ```json
    {
      "durationData": [
        { "dia": "Seg", "totalMinutos": 45 },
        { "dia": "Ter", "totalMinutos": 0 }
      ],
      "semanalDuracao": 45,
      "heatmapData": [
        { "date": "2026-03-25", "count": 1 },
        { "date": "2026-03-26", "count": 0 }
      ]
    }
    ```
  - `heatmapData` contém exatamente 84 entradas (um por dia, dos últimos 84 dias inclusive hoje), `count` ≥ 0.
  - `durationData` contém exatamente 7 entradas (Seg–Dom), `totalMinutos` ≥ 0.

---

## 6. Plano de Implementação (Tarefas)

### Ordem de Execução & Dependências

| Onda | Tarefas (paralelas) | Agente(s) | Pré-requisito |
|------|---------------------|-----------|---------------|
| 1    | T1, T2, T5          | backend, frontend | — |
| 2    | T3                  | frontend  | T2 |
| 3    | T4                  | frontend  | T1, T2, T3, T5 |
| 4    | T6                  | ambos     | T1, T3, T4 |

```
Onda 1: T1 (backend) | T2 (types) | T5 (nav+layout)   ← paralelo
Onda 2: T3 (componentes de chart)
Onda 3: T4 (progress page)
Onda 4: T6 (testes + fechamento)
```

---

### Tarefa T1: Backend — duração + heatmap em DashboardSummaryDto
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** —
- **Paralelizável com:** T2, T5
- **Descrição:**
  - `apps/api/src/training/application/dto/dashboard-summary.dto.ts`: adicionar `DurationDataDto { dia: string; totalMinutos: number }` e `HeatmapDataDto { date: string; count: number }` (com `@ApiProperty()`); `DashboardSummaryDto` ganha `durationData: DurationDataDto[]`, `semanalDuracao: number`, `heatmapData: HeatmapDataDto[]`.
  - `apps/api/src/training/application/use-cases/get-dashboard-summary.use-case.ts`:
    - Alterar lookback: `const lookbackStart = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000)` (em vez de `prevMonthStart`); passar `lookbackStart` para `findFinishedSince`. As variáveis `monthStart` e `prevMonthStart` permanecem para os filtros internos de `treinosNoMes`/`treinosMesAnterior`.
    - Dentro do loop: se `inWeek` e `session.endedAt` existe, calcular `durationMinutes = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 60000)` e acumular em `durationData[dayIdx].totalMinutos` e `semanalDuracao`.
    - Antes de retornar: construir `heatmapData` iterando os últimos 84 dias (do mais antigo ao mais recente); para cada dia criar `{ date: dateKey(d), count: 0 }`; depois iterar `sessions` e para cada sessão dentro dos 84 dias incrementar `count` no mapa.
    - Mapear `durationData` com `WEEKDAY_LABELS` (mesmo padrão de `volumeData`).
    - `dto.durationData = durationData; dto.semanalDuracao = semanalDuracao; dto.heatmapData = heatmapData`.
- **Critérios de Aceite:**
  - [x] `GET /workout-sessions/summary` retorna `durationData` (7 itens Seg–Dom), `semanalDuracao` e `heatmapData` (84 itens).
  - [x] `heatmapData` com sessões no dia correto incrementa `count`; dias sem sessão têm `count: 0`.
  - [x] `durationData` acumula apenas sessões `inWeek` com `endedAt`; sessões sem `endedAt` contribuem 0.
  - [x] Testes unitários em `get-dashboard-summary.use-case.spec.ts` cobrindo os novos campos (sessões com/sem endedAt, heatmap vazio, heatmap com múltiplas sessões no mesmo dia).
- **Notas:** sem migration (apenas lógica de cálculo). `findFinishedSince` já existe com índice correto.

---

### Tarefa T2: `@fitflow/types` — DurationDataDto + HeatmapDataDto
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T1, T5
- **Descrição:** Em `packages/types/src/index.ts`:
  - Adicionar `export interface DurationDataDto { dia: string; totalMinutos: number }`.
  - Adicionar `export interface HeatmapDataDto { date: string; count: number }`.
  - `DashboardSummaryDto` ganha `durationData: DurationDataDto[]`, `semanalDuracao: number`, `heatmapData: HeatmapDataDto[]`.
- **Critérios de Aceite:**
  - [x] `tsc` limpo em `apps/web` e `apps/api`.

---

### Tarefa T5: Navegação + layout `/progress`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T1, T2
- **Descrição:**
  - `apps/web/src/components/layout/nav-content.tsx`: novo item em `extraNavItems` — `{ id: "progresso", label: "Progresso", icon: TrendingUp, href: "/progress" }` (import `TrendingUp` de `lucide-react`).
  - `apps/web/src/components/layout/AppShell.tsx`: `getActiveItem` → `if (pathname.startsWith("/progress")) return "progresso";`; `sectionTitles.progresso = "Progresso"`.
  - Novo `apps/web/src/app/progress/layout.tsx`: `export default function ProgressLayout({ children }) { return <AppShell>{children}</AppShell>; }` (padrão `apps/web/src/app/history/layout.tsx`).
- **Critérios de Aceite:**
  - [x] Item "Progresso" aparece na sidebar/menu, navega para `/progress` e fica destacado (sidebar ativa + título "Progresso" no `TopHeader`).

---

### Tarefa T3: Componentes de chart — DurationChartClient + ActivityHeatmapClient
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T2
- **Paralelizável com:** nenhuma
- **Descrição:**
  - `apps/web/src/components/progress/DurationChartClient.tsx` (`"use client"`): gráfico de barras Recharts com `durationData` (prop `data: DurationDataDto[]`). Eixo X = `dia`, eixo Y = `totalMinutos`. Mesmo padrão visual de `ProgressChartClient` (tema, responsividade via `ResponsiveContainer`, cores CSS var). Exibir total no topo: `"{semanalDuracao} min esta semana"` (prop separada).
  - `apps/web/src/components/progress/ActivityHeatmapClient.tsx` (`"use client"`): grade de células. Prop: `data: HeatmapDataDto[]` (84 itens, ordenados do mais antigo ao mais recente). Organizar em 12 colunas (semanas) × 7 linhas (dias da semana, Seg–Dom). Cada célula: `w-4 h-4 rounded-sm`. Cor por `count`: 0 → `bg-muted`, 1 → `bg-primary/40`, 2+ → `bg-primary`. Tooltip (Radix `Tooltip` ou title nativo) com `date` formatado (`dd/MM/yyyy`) e `count` sessões. Labels de dia da semana (Seg, Ter, ..., Dom) no eixo Y (coluna de labels à esquerda). Labels de mês no eixo X (acima das colunas, quando `date` muda de mês).
- **Critérios de Aceite:**
  - [x] `DurationChartClient` renderiza 7 barras com alturas proporcionais a `totalMinutos`; barra com `totalMinutos: 0` ainda aparece (altura zero).
  - [x] `ActivityHeatmapClient` renderiza exatamente 84 células em grade 12×7; célula com `count: 0` tem `bg-muted`; célula com `count ≥ 2` tem `bg-primary`.
  - [x] Testes RTL (jest.mock não necessário — componentes puramente visuais com props): snapshot ou asserções de className nos níveis de cor.

---

### Tarefa T4: `/progress` — página de progresso
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T1, T2, T3, T5
- **Paralelizável com:** nenhuma
- **Descrição:**
  - `apps/web/src/app/progress/page.tsx`: Server Component assíncrono (mesmo padrão de `apps/web/src/app/dashboard/page.tsx`). Chama `apiFetch<DashboardSummaryDto>("/workout-sessions/summary")`.
  - Layout da página (mobile-first, adapta para desktop):
    - `MetricsStrip` (reutilizado, `{ diasEstaSemana, treinosNoMes, treinosNoMesDelta, diasSequencia, volumeSemanal }`).
    - Seção "Volume semanal": `ProgressChartClient` (reutilizado, `data={summary.volumeData}`).
    - Seção "Duração semanal": `DurationChartClient` (`data={summary.durationData}`, `semanalDuracao={summary.semanalDuracao}`).
    - Seção "Músculos esta semana": `MuscleCard` (reutilizado, `muscles={summary.muscleGroups}`).
    - Seção "Atividade": `ActivityHeatmapClient` (`data={summary.heatmapData}`).
  - Erro 401 → `<div className="p-4 text-center text-destructive">Sessão expirada. Faça login novamente.</div>`.
  - Outros erros → `<div className="p-4 text-center text-destructive">Erro ao carregar progresso.</div>`.
- **Critérios de Aceite:**
  - [x] `/progress` renderiza `MetricsStrip`, dois gráficos (volume e duração), `MuscleCard` e `ActivityHeatmapClient` com dados reais.
  - [x] Erro de autenticação mostra mensagem correta.
  - [x] Layout responsivo: mobile empilhado, desktop dois-colunas (volume+duração à esquerda, músculos+heatmap à direita) — ou layout razoável.

---

### Tarefa T6: Testes finais, cobertura e fechamento
- **Tipo:** chore
- **Agente:** ambos
- **Depende de:** T1, T3, T4
- **Paralelizável com:** nenhuma
- **Descrição:**
  - Rodar `tsc`/lint/jest em `apps/api` e `apps/web`.
  - Garantir cobertura de `decisions.md` para arquivos novos/alterados (use case backend 90%, componentes frontend 70%).
  - `docs/context/product-backlog.md`: marcar TASK13 `done`, preencher coluna "Spec" com `docs/specs/2026-06-16-task13-dashboards-progresso.md`.
- **Critérios de Aceite:**
  - [x] `tsc`/lint/jest limpos em `apps/api` e `apps/web`.
  - [x] Cobertura dentro das metas de `decisions.md`.
  - [x] Backlog atualizado.

---

<!--
GATE DE APROVAÇÃO
Revise as regras de negócio e as tarefas técnicas.
Se tudo estiver correto, altere o Status acima de "review" para "approved" para liberar os agentes de frontend/backend para iniciar a implementação.
-->
