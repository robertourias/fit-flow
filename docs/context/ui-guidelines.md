# UI Guidelines

> Decisões de design system e padrões de componentes para o frontend.

## Design System

**Component library**: shadcn/ui sobre Radix UI — sem MUI, sem Chakra
**Styling solution**: Tailwind CSS — sem CSS Modules, sem styled-components
**Animation library**: Framer Motion — respeitar sempre `prefers-reduced-motion`
**Icon library**: Lucide React — sem Heroicons
**Design tokens source**: `docs/UI/fit-flow.pen` — variáveis definidas no Pencil

## Color Tokens

Use variáveis semânticas — nunca valores hex diretos em componentes.

```css
/* Core brand — verde profundo + dourado (decisão 2026-07-03) */
--primary: light=hsl(163 42% 22%)  dark=hsl(158 52% 46%)   /* verde-esmeralda profundo */
--primary-foreground: light=hsl(150 40% 97%)  dark=hsl(166 45% 8%)
--ring: light=hsl(163 42% 30%)  dark=hsl(158 52% 46%)      /* focus ring */
--gold: light=hsl(42 48% 50%)   dark=hsl(43 52% 58%)       /* acento premium */
--gold-foreground: light=hsl(40 45% 12%)  dark=hsl(42 55% 12%)

/* Backgrounds / surfaces */
--background:            light=hsl(150 25% 98%)   dark=hsl(166 38% 7%)
--foreground:            light=hsl(168 35% 10%)   dark=hsl(148 22% 92%)
--card:                  light=hsl(0 0% 100%)     dark=hsl(164 32% 10%)
--card-foreground:       light=hsl(168 35% 10%)   dark=hsl(148 22% 92%)
--muted:                 light=hsl(152 20% 94%)   dark=hsl(163 26% 14%)
--muted-foreground:      light=hsl(162 12% 38%)   dark=hsl(152 14% 63%)
--accent:                light=hsl(152 26% 91%)   dark=hsl(162 28% 17%)
--accent-foreground:     light=hsl(168 35% 13%)   dark=hsl(148 22% 92%)
--secondary:             light=hsl(152 22% 94%)   dark=hsl(163 26% 14%)
--secondary-foreground:  light=hsl(168 35% 13%)   dark=hsl(148 22% 92%)

/* Borders / inputs */
--border: light=hsl(152 16% 88%)  dark=hsl(161 22% 19%)
--input:  light=hsl(152 16% 88%)  dark=hsl(161 22% 19%)

/* Feedback — success */
--color-success: #10B981
--color-success-bg:          light=#ECFDF5   dark=#042E1A
--color-success-foreground:  #FFFFFF
--color-success-text:        light=#065F46   dark=#6EE7B7

/* Feedback — warning */
--color-warning: #F59E0B
--color-warning-bg:          light=#FFFBEB   dark=#3A1A02
--color-warning-foreground:  #FFFFFF
--color-warning-text:        light=#92400E   dark=#FCD34D

/* Feedback — error */
--color-error: #EF4444
--color-error-bg:            light=#FEF2F2   dark=#3A0A0A
--color-error-foreground:    #FFFFFF
--color-error-text:          light=#991B1B   dark=#FCA5A5

/* Feedback — info */
--color-info: #3B82F6
--color-info-bg:             light=#EFF6FF   dark=#0A1E3A
--color-info-foreground:     #FFFFFF
--color-info-text:           light=#1E40AF   dark=#93C5FD

/* Destructive */
--destructive: #EF4444
--destructive-foreground: #FFFFFF
```

Dark mode: implementado via CSS variables com tema `mode: light | dark`. Contraste mínimo: 4.5:1 para texto normal, 3:1 para texto grande.

## Border Radius Tokens

```css
--radius-none: 0px
--radius-s:    6px
--radius-m:    10px   /* default */
--radius-l:    14px   /* botões */
--radius-xl:   18px   /* cards */
--radius-pill: 9999px
```

## Sombras & Superfícies

- Sombras suaves com tom esverdeado — `shadow-sm` (cards em repouso), `shadow-md` (hover), `shadow-lg` (modals/popovers); definidas em `packages/config/tailwind`
- Cards: `rounded-xl border border-border/70 bg-card shadow-sm` — usar o componente `Card` (`components/ui/card.tsx`), padding interno p-5
- Bordas de cards sempre com opacidade reduzida (`border-border/70`); bordas 100% opacas reservadas para divisores estruturais (`border-b`/`border-t` de headers e nav)

## Espaçamento & Layout

- Grid de 4px — todos os valores de espaçamento são múltiplos de 4 (usar escala Tailwind)
- Breakpoints: padrão Tailwind (`sm` / `md` / `lg` / `xl` / `2xl`)
- Max-width: conteúdo `max-w-7xl` centralizado; prose `max-w-prose`; formulários `max-w-md` ou `max-w-lg`
- Layouts de página: CSS Grid; layouts de componente: Flexbox

## Tipografia

```
Headings: Poppins, pesos 600/700   (var: --font-secondary)
Body:     Inter, pesos 400/500     (var: --font-primary)
Mono:     [a definir]              (blocos de código, conteúdo técnico)
```

Usar escala de tipo do Tailwind (`text-sm`, `text-base`, `text-lg` etc.) — sem tamanhos de fonte customizados salvo exceção justificada.

## Padrões de Componentes

### Buttons

Variantes: `primary` (sólido — máximo um por seção de tela), `secondary` (tonal: `bg-primary/5` + borda `primary/20`), `outline`, `ghost`, `destructive` (outline vermelho, preenche no hover — sempre pedir confirmação antes de executar), `gold` (acento premium — CTAs de upgrade/plano).
Preferir variantes outline/ghost/tonal como padrão; sólido reservado para a ação primária.
Sempre exibir loading state durante ações assíncronas (spinner ou skeleton).

### Forms

- Sempre associar inputs a labels visíveis — nunca usar placeholder como substituto de label
- Validar no blur, não no keystroke
- Erros inline ao lado do campo; campos obrigatórios marcados com `*`
- Schema de validação sempre via Zod

### Empty & Error States

Toda lista ou tabela exige ambos:
- **Empty state:** ícone + título + descrição + botão de ação
- **Error state:** título + descrição + botão de retry

### Loading States

- Áreas de conteúdo: skeleton screens preferidos sobre spinners
- Ações de botão e áreas pequenas: spinner

## Motion

- Biblioteca: **Framer Motion**
- Sempre respeitar `prefers-reduced-motion` — todas as animações devem poder ser desativadas
- Durações: fast=100ms, normal=200ms, slow=350ms
- Animar apenas `transform` e `opacity` — nunca propriedades de layout (`width`, `height`)

## Accessibility Baseline

- Cor nunca deve ser o único diferenciador — sempre adicionar texto ou ícone
- `outline: none` é proibido — focus rings devem ser sempre visíveis
- Modals: capturar foco ao abrir, restaurar ao fechar
- Touch targets: mínimo 44×44px em mobile
- Ícones usados sozinhos: exigem `aria-label` ou `title`
