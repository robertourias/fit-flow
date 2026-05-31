# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-05-31
**Resumo da última sessão:** Implementação da página de dashboard (`apps/web`) — primeira tela do FitFlow com design responsivo (mobile/tablet/desktop), light/dark mode, dados mock e todos os componentes de layout e conteúdo.

---

## Feature em andamento

**Spec ativo:** `docs/specs/2026-05-31-dashboard-page.md` — Status: approved  
**Plano ativo:** `docs/plans/2026-05-31-dashboard-page.md`  
**Status:** ✅ Todas as tarefas concluídas (T1–T6 + refinamentos de UI)

---

## O que foi feito

### Setup (T1)
- `shadcn/ui` configurado com design tokens do `docs/UI/fit-flow.pen` em CSS custom properties
- `globals.css` com `:root` / `.dark` mapeando tokens do Pencil (primary `#10B981`, card, border, etc.)
- `packages/config/tailwind/index.js` com tema CSS-vars, `darkMode: ["class"]`, tokens de radius/font
- `next-themes` instalado com `ThemeProvider` e `ThemeToggle` (Sun/Moon)
- Fontes Inter + Poppins via `next/font/google`
- Componentes shadcn/ui: `button`, `badge`, `avatar`, `sheet`, `separator`
- `tailwindcss-animate` para animações do Sheet

### Mock data (T2)
- `src/lib/mock/dashboard.ts` — interfaces e dados estáticos: `DashboardUser`, `DashboardMetrics`, `TreinoHoje`, `VolumeData`, `MuscleGroup`, `UpcomingWorkout`

### Tema (T3)
- `ThemeProvider` (`next-themes`, `attribute="class"`, `enableSystem`)
- Preferência salva em `localStorage` automaticamente

### Layout components (T4)
- `NavContent` — conteúdo de nav extraído e compartilhado entre sidebar e mobile sheet
- `Sidebar` — usa `NavContent`, visível em `md:+`
- `TopBar` — mobile: hamburger + saudação dinâmica + avatar; Sheet usa `NavContent` completo com ThemeToggle
- `TopHeader` — desktop: título "Dashboard" + plan badge (Zap + "3 de 6 treinos") + ThemeToggle + bell
- `BottomNav` — mobile: 5 abas com ícone + label (Treino em círculo primário)
- Altura header equalizada: `h-20` em ambos (sidebar logo e top-header)

### Dashboard components (T5)
- `MetricsStrip` — Embla Carousel no mobile/tablet (1/2 tiles visíveis), grid 4-colunas no desktop; ícone no topo (mobile), label+ícone no header (desktop); valor + unidade descritiva
- `TreinoCard` — estilo neutro (`bg-card border`) para todos os breakpoints; `flex-1` spacer para botão CTA ancorado ao fundo
- `ProgressChart` — Recharts `BarChart` com `Cell` por barra, cores tema-aware via `useTheme()` + `useEffect`
- `CalendarSection` — semana começa em Seg, dia atual usa `bg-accent`, workout days em `bg-primary`
- `UpcomingCard` — próximos 3 treinos com day boxes (success-bg / muted), chevron
- `MuscleCard` — 6 grupos musculares com progress bars pill-shaped

### Dashboard route (T6)
- `app/dashboard/layout.tsx` — Client Component com `useState(activeItem)`, sidebar desktop + bottom nav mobile
- `app/dashboard/page.tsx` — 3 layouts:
  - Mobile (`<md`): stack vertical — metrics carousel, treino card, chart, calendar, muscle
  - Tablet (`md` a `lg`): treino+upcoming row com `min-h`, chart, calendar+muscle em grid 2-col
  - Desktop (`lg+`): grid `[1fr_340px]`, top row `min-h-[282px]` para igualar CalendarSection, ProgressChart e MuscleCard flex-1

---

## Decisões desta sessão

- **shadcn/ui sobre Radix** — já estava em decisions.md, confirmado com implementação
- **Recharts** para gráfico de barras (não CSS puro) — mais interativo, tooltip, responsivo
- **Embla Carousel** para métricas no mobile/tablet — `embla-carousel-react`
- **`max-md:` prefix** para override de bg no TreinoCard — resolve conflito de cascata Tailwind quando `md:` não ganha sobre base
- **NavContent extraído** — componente compartilhado entre Sidebar e mobile Sheet
- **`devIndicators: false`** no next.config.ts — remove ícone do Next.js em dev

---

## Próximos passos

1. Implementar páginas de Rotina, Progresso, Exercícios
2. Conectar dashboard a dados reais via API (`apps/api`)
3. Implementar autenticação (NextAuth) e rota guard
4. Adicionar Zustand store para estado de navegação (substituir `useState` em layout.tsx)

---

## Bloqueadores / Perguntas abertas

- Supabase local não está no Docker Compose — variáveis `SUPABASE_*` apontam para instância cloud
- Recharts `BarChart` no headless Chrome (screenshots) não renderiza com timing curto; funciona normalmente em browser real
