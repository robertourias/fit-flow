# Spec: Dashboard Page — Estrutura inicial com mock

**Status:** approved
**Data:** 2026-05-31
**Autor:** planner-agent

---

## Problema

O app FitFlow não possui nenhuma tela implementada ainda. O design do dashboard
já está completo no arquivo `docs/UI/fit-flow.pen` (mobile + desktop, light + dark),
mas ainda não existe código correspondente em `apps/web`. Sem essa tela não é possível
validar a experiência do usuário nem começar a conectar a API.

Esta spec define a implementação da página de dashboard com dados mock — estrutura
visual completa, responsiva, com navegação funcional, sem chamadas de API reais.

---

## Cenários de Usuário

- **P1 (crítico):** Como praticante autenticado, quero ver meu resumo do dia ao abrir o
  app (treino de hoje, métricas da semana, progresso de volume), para saber rapidamente
  o que precisa ser feito.

- **P1 (crítico):** Como praticante, quero navegar entre as seções principais (Rotina,
  Progresso, Treino, Explorar, Personal) de forma intuitiva no celular e no desktop,
  para não me perder no app.

- **P2 (importante):** Como praticante, quero alternar entre light e dark mode conforme
  minha preferência de sistema, para ter uma experiência confortável em qualquer ambiente.

- **P3 (nice-to-have):** Como praticante, quero ver o calendário do mês com os dias de
  treino marcados, para ter uma visão de consistência mensal.

---

## Requisitos Funcionais

### Layout e responsividade
- **FR-001:** A página deve ter dois breakpoints: mobile (< 768px) e desktop (≥ 768px).
  No mobile, exibe Bottom Nav fixo com 5 abas. No desktop, exibe Sidebar lateral de 240px.
- **FR-002:** O layout do desktop usa sidebar + main area com header horizontal no topo
  da área de conteúdo. O layout do mobile usa top bar + scroll vertical + bottom nav absoluto.

### Tema (light / dark mode)
- **FR-003:** A aplicação deve suportar light e dark mode baseado na preferência do
  sistema operacional (`prefers-color-scheme`), com possibilidade de override manual.
- **FR-004:** Os tokens de cor do design system (`docs/UI/fit-flow.pen`) devem ser
  mapeados para CSS custom properties e configurados como tema do shadcn/ui:
  - Primary: `#10B981`
  - Background: `#FFFFFF` / `#091420`
  - Card: `#FFFFFF` / `#0D1D2E`
  - Foreground: `#0F172A` / `#D9EAF7`
  - Muted foreground: `#4F6278` / `#7BA4C0`
  - Border: `#E2E8F0` / `#1C3550`
  - Accent: `#F1F5F9` / `#122338`
  - Raios: s=4px, m=8px, l=12px, xl=16px, pill=9999px
  - Fonte: Inter (Google Fonts)

### Componentes do dashboard (dados mock)
- **FR-005:** **Top Bar (mobile):** botão hamburger (abre drawer de navegação), saudação
  dinâmica (bom dia/boa tarde/boa noite + nome), data atual, avatar com inicial.
- **FR-006:** **Metrics Strip:** 3 cards em row — "dias esta semana", "treinos no mês"
  (com delta +/−), "dias de sequência 🔥". Valores vindos de mock data.
- **FR-007:** **Treino Card (hoje):** badge de dia da semana/estratégia, nome do treino,
  prévia dos exercícios, botão CTA "Iniciar Treino". Dados de mock.
- **FR-008:** **Progress Section:** gráfico de barras verticais do volume semanal (kg)
  com eixo Y e labels de dia da semana. Dados de mock (7 dias).
- **FR-009:** **Calendar Section:** calendário mensal com dias de treino marcados (cor
  primary) e dia atual destacado. Dados de mock.
- **FR-010:** **Bottom Nav (mobile):** 5 abas — Rotina (dumbbell), Progresso (chart-bar),
  Treino (ícone centralizado em círculo primário), Explorar (compass), Personal (user).
  Aba ativa em cor primária, demais em muted-foreground.
- **FR-011:** **Sidebar (desktop):** logo FitFlow, nav items com ícone + label (Rotina
  ativo, Progresso, Explorar, Personal, Exercícios, Biblioteca, Premium com badge warning),
  spacer, user row (avatar + nome/email + ícone settings).
- **FR-012:** **Top Header (desktop):** título da seção atual, badge de plano ("Plano Free"
  em warning), botão de notificações.

### Mock data
- **FR-013:** Criar arquivo `apps/web/src/lib/mock/dashboard.ts` com tipos TypeScript e
  dados estáticos que alimentam todos os componentes da página. Nenhuma chamada de rede.

### Navegação
- **FR-014:** Os itens de navegação devem alterar o estado ativo visualmente (item atual
  em cor primária). Sem roteamento real nesta iteração — apenas estado local.

---

## Critérios de Sucesso

- [ ] Página renderiza em `/dashboard` na app `apps/web` (Next.js App Router)
- [ ] Layout mobile (390px) corresponde visualmente ao frame "Dashboard Light/Dark" do .pen
- [ ] Layout desktop (1440px) corresponde visualmente aos frames "Dashboard Desktop / Dark" do .pen
- [ ] Alternância de tema funciona (light ↔ dark) sem flash nem recarregamento de página
- [ ] Todos os valores visíveis na tela vêm do arquivo de mock data (sem hardcode nas páginas)
- [ ] Nenhum erro de TypeScript (`pnpm typecheck` passa em `apps/web`)
- [ ] Nenhum erro de lint (`pnpm lint` passa em `apps/web`)
- [ ] Fonte Inter carregada via `next/font/google`

---

## Fora do Escopo

- Integração com API ou banco de dados
- Autenticação real (a rota `/dashboard` não precisa de guard nesta iteração)
- Animações e transições de navegação
- Funcionalidade do botão "Iniciar Treino"
- Tela de exercícios, progresso detalhado ou qualquer outra tela além do dashboard
- Testes automatizados (unitários ou E2E) nesta iteração

---

## Estrutura de arquivos esperada

```
apps/web/src/
  app/
    dashboard/
      page.tsx                  ← página principal
      layout.tsx                ← layout autenticado (sidebar + bottom nav)
  components/
    dashboard/
      metrics-strip.tsx
      treino-card.tsx
      progress-chart.tsx
      calendar-section.tsx
    layout/
      sidebar.tsx               ← desktop sidebar
      bottom-nav.tsx            ← mobile bottom nav
      top-bar.tsx               ← mobile top bar
      top-header.tsx            ← desktop top header
    ui/                         ← shadcn/ui components (já existentes ou a adicionar)
  lib/
    mock/
      dashboard.ts              ← tipos + dados mock
  styles/
    globals.css                 ← CSS custom properties do design system
```

---

## Riscos e Premissas

- **Premissa:** shadcn/ui ainda não está instalado em `apps/web` — a tarefa de setup
  (init + tema) faz parte do escopo desta implementação.
- **Premissa:** `next/font/google` com Inter está disponível ou será configurado nesta tarefa.
- **Risco:** O calendário mensal pode ser trabalhoso de construir sem uma lib de datas.
  → Mitigação: usar `date-fns` para cálculo de dias; o componente visual é simples (grid 7×6).
- **Risco:** O gráfico de barras pode requerer uma lib de charts (recharts/visx).
  → Mitigação: implementar como barras CSS puras nesta iteração (sem lib de charts),
  suficiente para validar visual. Lib pode ser adicionada quando dados reais chegarem.
- **Premissa:** O tema do shadcn/ui será configurado com os tokens do design system,
  substituindo os tokens padrão do shadcn.

---

<!-- 
GATE DE APROVAÇÃO
Para desbloquear a criação do plano técnico, altere o Status acima de "draft" para "approved".
O agente planner NÃO deve criar tasks de implementação enquanto Status for "draft".
-->
