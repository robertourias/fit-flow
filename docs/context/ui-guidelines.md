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
/* Core brand */
--primary: #10B981                        /* verde esmeralda */
--primary-foreground: #0D2B1F
--ring: #10B981                           /* focus ring */

/* Backgrounds / surfaces */
--background:            light=#FFFFFF       dark=#091420
--foreground:            light=#0F172A       dark=#D9EAF7
--card:                  light=#FFFFFF       dark=#0D1D2E
--card-foreground:       light=#0F172A       dark=#D9EAF7
--muted:                 light=#F1F5F9       dark=#122338
--muted-foreground:      light=#4F6278       dark=#7BA4C0
--accent:                light=#F1F5F9       dark=#122338
--accent-foreground:     light=#0F172A       dark=#D9EAF7
--secondary:             light=#F1F5F9       dark=#122338
--secondary-foreground:  light=#0F172A       dark=#D9EAF7

/* Borders / inputs */
--border: light=#E2E8F0  dark=#1C3550
--input:  light=#E2E8F0  dark=#1C3550

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
--radius-s:    4px
--radius-m:    8px
--radius-l:    12px
--radius-xl:   16px
--radius-pill: 9999px
```

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

Quatro variantes: `primary` (máximo um por seção de tela), `secondary`, `destructive` (sempre pedir confirmação antes de executar), `ghost`.
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
