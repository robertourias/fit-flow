# Plano Técnico: Dashboard Page — Estrutura inicial com mock

**Spec:** `docs/specs/2026-05-31-dashboard-page.md`
**Data:** 2026-05-31
**Escopo:** `apps/web`

---

## Contexto

`apps/web` é um Next.js 15 (App Router) recém-criado com Tailwind 3. Não há shadcn/ui,
tokens de cor, fontes, dark mode nem nenhuma rota além do placeholder `/`. Este plano
cobre tudo que é necessário para ter o dashboard funcional com dados mock.

## Contrato de API

Nenhum. Todos os dados são estáticos em `apps/web/src/lib/mock/dashboard.ts`.
O frontend não faz chamadas de rede nesta iteração.

## Nota sobre tipografia

O design (`.pen`) usa Inter para todos os textos. `docs/context/decisions.md` define
Poppins para headings (`--font-secondary`). Esta implementação carrega **ambas as fontes**
via `next/font/google` e aplica a convenção do decisions.md (Poppins para `h1–h3`,
Inter para o restante), pois é a decisão registrada do projeto.

---

## Ordem de execução

```
T1 (setup)  →  T2 (mock data)  →  T3 (theme provider)
→  T4 (layout components)  →  T5 (dashboard components)  →  T6 (route: layout + page)
```

Cada tarefa tem dependência explícita da anterior. Não iniciar T4 antes de T1 estar completa.

---

## Tarefa T1: Setup — shadcn/ui, design tokens, fontes

**Tipo:** chore
**Agente:** frontend

Instala e configura toda a infraestrutura visual antes de qualquer componente ser criado.
É o pré-requisito de todas as demais tarefas.

### Passos

**1. Instalar dependências**

```bash
# No contexto de apps/web (via pnpm --filter @fitflow/web)
pnpm add lucide-react next-themes date-fns
pnpm dlx shadcn@latest init
```

Durante o `shadcn init`, responder:
- Style: **Default**
- Base color: **Slate** (será sobrescrito pelos tokens)
- CSS variables: **Yes**
- Tailwind config path: `tailwind.config.ts`
- Components path: `@/components/ui`
- Utils path: `@/lib/utils`

**2. Adicionar componentes shadcn/ui necessários para o dashboard**

```bash
pnpm dlx shadcn@latest add badge button sheet separator avatar
```

**3. Configurar `apps/web/src/app/globals.css`**

Substituir o conteúdo pelo template shadcn/ui + tokens do design system:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;           /* #FFFFFF */
    --foreground: 222 47% 11%;         /* #0F172A */
    --card: 0 0% 100%;                 /* #FFFFFF */
    --card-foreground: 222 47% 11%;    /* #0F172A */
    --primary: 160 84% 39%;            /* #10B981 */
    --primary-foreground: 157 54% 11%; /* #0D2B1F */
    --secondary: 210 40% 95%;          /* #F1F5F9 */
    --secondary-foreground: 222 47% 11%;
    --muted: 210 40% 95%;              /* #F1F5F9 */
    --muted-foreground: 210 22% 39%;   /* #4F6278 */
    --accent: 210 40% 95%;             /* #F1F5F9 */
    --accent-foreground: 222 47% 11%;
    --border: 214 32% 91%;             /* #E2E8F0 */
    --input: 214 32% 91%;
    --ring: 160 84% 39%;               /* #10B981 */
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --radius: 0.5rem;                  /* base = radius-m (8px) */

    /* FitFlow semantic colors */
    --color-success: 160 84% 39%;
    --color-success-bg: 152 100% 96%; /* #ECFDF5 */
    --color-warning: 38 92% 50%;      /* #F59E0B */
    --color-warning-bg: 48 96% 96%;   /* #FFFBEB */
    --color-error: 0 84% 60%;
    --color-error-bg: 0 86% 97%;      /* #FEF2F2 */
    --color-info: 217 91% 60%;
    --color-info-bg: 214 100% 97%;    /* #EFF6FF */
  }

  .dark {
    --background: 215 62% 8%;          /* #091420 */
    --foreground: 210 60% 91%;         /* #D9EAF7 */
    --card: 213 53% 12%;               /* #0D1D2E */
    --card-foreground: 210 60% 91%;
    --primary: 160 84% 39%;            /* #10B981 — mesmo no dark */
    --primary-foreground: 157 54% 11%;
    --secondary: 212 50% 15%;          /* #122338 */
    --secondary-foreground: 210 60% 91%;
    --muted: 212 50% 15%;              /* #122338 */
    --muted-foreground: 205 36% 60%;   /* #7BA4C0 */
    --accent: 212 50% 15%;             /* #122338 */
    --accent-foreground: 210 60% 91%;
    --border: 211 50% 20%;             /* #1C3550 */
    --input: 211 50% 20%;
    --ring: 160 84% 39%;

    /* FitFlow semantic colors dark */
    --color-success-bg: 154 87% 10%;  /* #042E1A */
    --color-warning-bg: 29 93% 11%;   /* #3A1A02 */
    --color-error-bg: 0 90% 13%;      /* #3A0A0A */
    --color-info-bg: 213 86% 13%;     /* #0A1E3A */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans;
  }
}
```

**4. Atualizar `apps/web/src/app/layout.tsx`**

- Carregar `Inter` e `Poppins` via `next/font/google`
- Adicionar `suppressHydrationWarning` no `<html>` (necessário para next-themes)
- Injetar variáveis de fonte como CSS custom properties

```tsx
import { Inter, Poppins } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading",
});
```

**5. Atualizar `packages/config/tailwind/index.js`**

Adicionar CSS vars como tokens de tema:

```js
theme: {
  extend: {
    colors: {
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
      secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
      muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
      accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
      border: "hsl(var(--border))",
      input: "hsl(var(--input))",
      ring: "hsl(var(--ring))",
      destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
    },
    borderRadius: {
      none: "0px", s: "4px", DEFAULT: "8px", m: "8px", l: "12px", xl: "16px", pill: "9999px",
    },
    fontFamily: {
      sans: ["var(--font-sans)", "Inter", "sans-serif"],
      heading: ["var(--font-heading)", "Poppins", "sans-serif"],
    },
  },
},
```

### Critérios de aceite T1
- [ ] `pnpm --filter @fitflow/web dev` inicia sem erros
- [ ] Página `/` exibe fundo branco no light e `#091420` no dark
- [ ] shadcn `Button` renderiza com cor primária `#10B981`
- [ ] `pnpm --filter @fitflow/web lint` passa

---

## Tarefa T2: Mock data

**Tipo:** chore
**Agente:** frontend
**Depende de:** T1

Centraliza todos os dados estáticos em um único arquivo. Nenhum componente deve ter
dados hardcoded — toda informação visível na tela vem deste arquivo.

### Arquivo: `apps/web/src/lib/mock/dashboard.ts`

```ts
export interface DashboardUser {
  name: string;
  initials: string;
  email: string;
  plan: "free" | "pro";
}

export interface DashboardMetrics {
  diasEstaSemana: number;
  treinosNoMes: number;
  treinosNoMesDelta: number; // positivo = acima da média
  diasSequencia: number;
}

export interface TreinoHoje {
  estrategia: string;      // ex: "Push — Semana 2"
  nome: string;            // ex: "Treino B — Push"
  exercicios: string[];    // prévia: primeiros 3 exercícios
  diaDaSemana: string;     // ex: "Quinta-feira"
}

export interface VolumeData {
  dia: string;   // "Seg", "Ter", etc.
  volume: number; // kg
}

export interface CalendarDay {
  date: number;
  month: "current" | "prev" | "next";
  hasTreino: boolean;
  isToday: boolean;
}

export const mockUser: DashboardUser = {
  name: "Beto",
  initials: "B",
  email: "beto@exemplo.com",
  plan: "free",
};

export const mockMetrics: DashboardMetrics = {
  diasEstaSemana: 4,
  treinosNoMes: 12,
  treinosNoMesDelta: 2,
  diasSequencia: 3,
};

export const mockTreinoHoje: TreinoHoje = {
  estrategia: "Push — Semana 2",
  nome: "Treino B — Push",
  exercicios: ["Supino inclinado", "Desenvolvimento", "Tríceps corda"],
  diaDaSemana: "Quinta-feira",
};

export const mockVolumeData: VolumeData[] = [
  { dia: "Seg", volume: 3200 },
  { dia: "Ter", volume: 0 },
  { dia: "Qua", volume: 4100 },
  { dia: "Qui", volume: 2800 },
  { dia: "Sex", volume: 3600 },
  { dia: "Sáb", volume: 0 },
  { dia: "Dom", volume: 0 },
];

// Maio 2026: treinos nos dias 5, 7, 8, 12, 14, 15, 19, 21, 22, 26, 28, 29
export const mockCalendarDays: CalendarDay[] = [
  // Preenchido via date-fns no componente com base neste array de datas de treino
];

export const mockTreinoDates: number[] = [5, 7, 8, 12, 14, 15, 19, 21, 22, 26, 28, 29];
```

### Critérios de aceite T2
- [ ] `pnpm --filter @fitflow/web typecheck` passa após criar o arquivo
- [ ] Nenhum campo com valor `undefined` nos mocks

---

## Tarefa T3: Theme Provider

**Tipo:** feature
**Agente:** frontend
**Depende de:** T1

Configura `next-themes` para dark mode sem flash. A preferência do sistema é usada
por padrão; um toggle pode ser adicionado na UI futuramente.

### Arquivos

**`apps/web/src/components/providers/theme-provider.tsx`**

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
```

Envolver `children` do `RootLayout` com `<ThemeProvider>`.

### Critérios de aceite T3
- [ ] Mudar preferência do sistema para dark muda a aparência sem reload
- [ ] Sem flash de tema errado no carregamento (FOUC)

---

## Tarefa T4: Componentes de layout

**Tipo:** feature
**Agente:** frontend
**Depende de:** T1, T2, T3

Cria os 4 componentes de navegação/layout. Todos são `"use client"` (interatividade
de menu ativo e drawer). Cada um recebe `activeTab` como prop ou gerencia estado local.

### Nota sobre estado de navegação

Esta iteração não tem roteamento real. O estado de aba ativa é `useState` local,
inicializando com `"rotina"` (dashboard = página de rotina). Quando o roteamento for
implementado, substituir por `usePathname()`.

### 4a. `apps/web/src/components/layout/top-bar.tsx` (mobile)

Estrutura: `flex items-center gap-2 px-5 py-4 bg-card border-b border-border`

Elementos (esquerda → direita):
1. **Menu Button** — `Button variant="ghost" size="icon"` com `Menu` icon (lucide) → abre Sheet
2. **Greeting** — saudação dinâmica por hora + nome do usuário + data atual (date-fns `format`)
3. **Avatar** — `Avatar` shadcn com inicial do usuário e bg `primary`

Sheet de navegação mobile: reutiliza os itens de `bottom-nav` em formato lista vertical.
Aberto via `useState(false)`.

Props: `user: DashboardUser`

### 4b. `apps/web/src/components/layout/bottom-nav.tsx` (mobile)

Estrutura: `fixed bottom-0 left-0 right-0 flex bg-card border-t border-border pb-6`
(padding-bottom 24px = safe area iOS)

5 itens em `justify-around`:
| Item | Ícone lucide | Label |
|------|-------------|-------|
| rotina | `Dumbbell` | Rotina |
| progresso | `BarChart` | Progresso |
| treino | `Dumbbell` + círculo primário | Treino |
| explorar | `Compass` | Explorar |
| personal | `User` | Personal |

O item `treino` usa fundo circular `bg-primary` h-9 w-9 com ícone em `primary-foreground`.
Aba ativa: ícone + label em `text-primary`. Demais: `text-muted-foreground`.

Props: `activeTab: string; onTabChange: (tab: string) => void`

### 4c. `apps/web/src/components/layout/sidebar.tsx` (desktop)

Estrutura: `flex flex-col w-60 bg-card border-r border-border h-full`

Seções:
1. **Logo Area** — ícone `Zap` em círculo `bg-primary` + texto "FitFlow" (font-heading)
2. **Divisor**
3. **Nav Principal** — Rotina (Dumbbell), Progresso (BarChart), Explorar (Compass), Personal (User)
4. **Divisor**
5. **Nav Extra** — Exercícios (ListChecks), Biblioteca (BookOpen)
6. **Divisor**
7. **Nav Premium** — ícone Crown + "Premium" com `Badge` em warning
8. **Spacer** (`flex-1`)
9. **User Row** — Avatar + nome + email + ícone Settings

Item de nav ativo: `bg-[hsl(var(--color-success-bg))] text-primary rounded-m`
Item inativo: `hover:bg-accent rounded-m text-foreground`

Props: `activeItem: string; onItemChange: (item: string) => void; user: DashboardUser`

### 4d. `apps/web/src/components/layout/top-header.tsx` (desktop)

Estrutura: `flex items-center gap-4 px-7 py-5 border-b border-border bg-card`

Elementos:
1. **Header Left** — título da seção (h2, font-heading) + subtítulo data atual
2. **Spacer** (`flex-1`)
3. **Plan Badge** — `Badge` com texto "Plano Free" em `bg-[hsl(var(--color-warning-bg))] text-[hsl(var(--color-warning-text))]`
4. **Notification Button** — `Button variant="ghost" size="icon"` com ícone `Bell`

Props: `sectionTitle: string; user: DashboardUser`

### Critérios de aceite T4
- [ ] Mobile: Hamburger abre Sheet com nav items
- [ ] Mobile: Bottom nav muda aba ativa ao clicar
- [ ] Desktop: Sidebar marca item ativo com fundo verde claro
- [ ] Ambos: cores corretas em light e dark mode

---

## Tarefa T5: Componentes de conteúdo do dashboard

**Tipo:** feature
**Agente:** frontend
**Depende de:** T1, T2

Todos são Server Components (sem interatividade). Recebem dados via props vindos da page.

### 5a. `apps/web/src/components/dashboard/MetricsStrip.tsx`

3 cards em `grid grid-cols-3 gap-2 px-5 py-4`:

Cada card: `bg-card rounded-l border border-border p-3.5 flex flex-col gap-1`
- Valor em `text-2xl font-bold text-primary`
- Label em `text-[11px] text-muted-foreground` (2 linhas via `whitespace-pre-line`)
- Delta row (apenas "treinos no mês"): ícone `TrendingUp`/`TrendingDown` + valor em verde/vermelho

Props: `metrics: DashboardMetrics`

### 5b. `apps/web/src/components/dashboard/TreinoCard.tsx`

Container: `bg-card rounded-xl border border-border p-4 flex flex-col gap-3`

Elementos:
1. **Card Header** — `Badge` com `estrategia` (variant custom em `muted`) + ícone `Dumbbell`
2. **Nome** — `text-lg font-bold`
3. **Exercícios preview** — `text-[13px] text-muted-foreground` (join com " · ")
4. **CTA Button** — `Button` full-width, `bg-primary text-primary-foreground h-12 rounded-m`
   com ícone `Play` + "Iniciar Treino" (botão desabilitado funcionalmente — apenas visual)

Props: `treino: TreinoHoje`

### 5c. `apps/web/src/components/dashboard/ProgressChart.tsx`

Container: `flex flex-col gap-3`

Header: título "Volume semanal (kg)" + link "Ver tudo →" em `text-primary text-[13px]`

Gráfico de barras CSS puro (sem lib):
- Wrapper: `flex items-end gap-1.5 h-24`
- Cada barra: `flex flex-col items-center gap-1 flex-1`
  - Barra: `w-full rounded-s bg-primary opacity-80` com height calculada como % do max volume
  - Label dia: `text-[10px] text-muted-foreground`
- Eixo Y: 3 labels (max, metade, 0) alinhados à esquerda

Props: `data: VolumeData[]`

### 5d. `apps/web/src/components/dashboard/CalendarSection.tsx`

Usa `date-fns` para calcular os dias do mês atual.

Container: `bg-card rounded-xl border border-border p-4 flex flex-col gap-2`

Header: mês/ano + setas de navegação (apenas visual, sem funcionalidade de navegação)

Grid: 7 colunas (Dom–Sáb)
- Labels: `text-[11px] text-muted-foreground text-center`
- Dias: `text-[13px] text-center h-8 w-8 rounded-full flex items-center justify-center`
  - Dia com treino: `bg-primary text-primary-foreground font-semibold`
  - Hoje: ring `ring-2 ring-primary`
  - Dia de outro mês: `text-muted-foreground opacity-40`

Props: `trainDates: number[]; today?: Date`

### Critérios de aceite T5
- [ ] MetricsStrip exibe os 3 cards com valores do mock
- [ ] TreinoCard exibe nome, exercícios e botão CTA
- [ ] ProgressChart renderiza 7 barras com alturas proporcionais
- [ ] CalendarSection marca os dias de treino do mock em verde

---

## Tarefa T6: Rota do dashboard (layout + page)

**Tipo:** feature
**Agente:** frontend
**Depende de:** T4, T5

### 6a. `apps/web/src/app/dashboard/layout.tsx`

Layout responsivo: mobile = top bar + scroll + bottom nav; desktop = sidebar + main.

```tsx
"use client"; // necessário para useState (activeTab)

// Mobile: <TopBar> + {children com pb-24} + <BottomNav>
// Desktop (md:): flex h-screen overflow-hidden → <Sidebar> + <main flex-1 overflow-auto>
```

Estrutura:
```
<div className="flex h-dvh overflow-hidden">
  {/* Desktop sidebar */}
  <aside className="hidden md:flex">
    <Sidebar activeItem={activeItem} onItemChange={setActiveItem} user={mockUser} />
  </aside>

  {/* Main content */}
  <div className="flex flex-col flex-1 min-h-0">
    {/* Mobile top bar */}
    <header className="md:hidden">
      <TopBar user={mockUser} />
    </header>

    {/* Desktop top header */}
    <header className="hidden md:flex">
      <TopHeader sectionTitle={sectionLabels[activeItem]} user={mockUser} />
    </header>

    {/* Scrollable content */}
    <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
      {children}
    </main>

    {/* Mobile bottom nav */}
    <nav className="md:hidden">
      <BottomNav activeTab={activeItem} onTabChange={setActiveItem} />
    </nav>
  </div>
</div>
```

### 6b. `apps/web/src/app/dashboard/page.tsx`

Server Component. Importa mock data e passa para componentes.

```tsx
import { mockMetrics, mockTreinoHoje, mockVolumeData, mockTreinoDates } from "@/lib/mock/dashboard";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { TreinoCard } from "@/components/dashboard/TreinoCard";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { CalendarSection } from "@/components/dashboard/CalendarSection";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-0">
      <MetricsStrip metrics={mockMetrics} />

      <section className="px-5 pb-5 flex flex-col gap-3">
        <h2 className="text-base font-semibold">Treino de hoje</h2>
        <TreinoCard treino={mockTreinoHoje} />
      </section>

      <section className="px-5 pb-5 flex flex-col gap-3">
        <ProgressChart data={mockVolumeData} />
      </section>

      <section className="px-5 pb-5">
        <CalendarSection trainDates={mockTreinoDates} />
      </section>
    </div>
  );
}
```

No desktop, a page é renderizada dentro do `<main>` da sidebar layout — o mesmo markup
funciona em ambos os breakpoints graças ao layout responsivo de T6a.

### Critérios de aceite T6
- [ ] `GET /dashboard` retorna 200 sem erros de runtime
- [ ] Em 390px: top bar visível, bottom nav fixo, conteúdo scrollável
- [ ] Em 1440px: sidebar 240px visível, top header, sem bottom nav
- [ ] Todos os dados vêm do mock (sem valores hardcoded na page)

---

## Critérios de sucesso finais (do spec)

- [ ] Página renderiza em `/dashboard`
- [ ] Layout mobile (390px) corresponde ao frame "Dashboard Light/Dark" do .pen
- [ ] Layout desktop (1440px) corresponde aos frames "Dashboard Desktop / Dark" do .pen
- [ ] Alternância de tema light ↔ dark sem flash
- [ ] `pnpm --filter @fitflow/web typecheck` passa
- [ ] `pnpm --filter @fitflow/web lint` passa
- [ ] Fonte Inter carregada via `next/font/google`

---

## Riscos mitigados

| Risco | Mitigação aplicada |
|-------|-------------------|
| Gráfico de barras sem lib | CSS puro com flex + altura calculada em % — sem recharts/visx |
| Calendário mensal | date-fns `startOfMonth`, `endOfMonth`, `eachDayOfInterval` — sem lib de calendário |
| Dark mode FOUC | `next-themes` com `suppressHydrationWarning` + `disableTransitionOnChange` |
| shadcn não instalado | T1 instala antes de qualquer componente |

---

## Pacotes a instalar (resumo)

```bash
# apps/web
pnpm add lucide-react next-themes date-fns
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add badge button sheet separator avatar
```
