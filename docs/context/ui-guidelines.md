# UI Guidelines

> Decisões de design system e padrões de componentes para o frontend.

## Design System

**Component library**: shadcn/ui sobre Radix UI — sem MUI, sem Chakra
**Styling solution**: Tailwind CSS — sem CSS Modules, sem styled-components
**Animation library**: Framer Motion — respeitar sempre `prefers-reduced-motion`
**Icon library**: Lucide React — sem Heroicons
**Design tokens source**: a definir — referências visuais: Lytfa e Smartfit

## Color Tokens

Use variáveis semânticas — nunca valores hex diretos em componentes.

<!-- a definir: tokens baseados nas referências Lytfa e Smartfit -->
```css
--color-primary        /* cor principal da marca, com variantes hover e active */
--color-success / --color-warning / --color-error / --color-info
--color-text-primary / --color-text-secondary / --color-text-disabled
--color-border / --color-background / --color-surface
```

Dark mode: todas as cores devem suportar dark mode via CSS variables ou classes `dark:` do Tailwind. Contraste mínimo: 4.5:1 para texto normal, 3:1 para texto grande.

## Espaçamento & Layout

- Grid de 4px — todos os valores de espaçamento são múltiplos de 4 (usar escala Tailwind)
- Breakpoints: padrão Tailwind (`sm` / `md` / `lg` / `xl` / `2xl`)
- Max-width: conteúdo `max-w-7xl` centralizado; prose `max-w-prose`; formulários `max-w-md` ou `max-w-lg`
- Layouts de página: CSS Grid; layouts de componente: Flexbox

## Tipografia

<!-- a definir: fontes a escolher com base nas referências Lytfa e Smartfit -->
```
Headings: [a definir], pesos 600/700
Body:     [a definir], pesos 400/500
Mono:     [a definir] (blocos de código, conteúdo técnico)
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
