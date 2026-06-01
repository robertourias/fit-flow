# Plano Técnico: Página Biblioteca + Refactor Route Group

**Spec:** `docs/specs/2026-05-31-library-page.md`
**Data:** 2026-05-31
**Escopo:** `apps/web`

---

## Contexto

O Route Group `(app)` atual (`app/(app)/layout.tsx`) funciona mas polui os caminhos
visíveis no editor. A refatoração extrai o shell para `AppShell.tsx` e move as páginas
para a raiz de `app/`. A biblioteca é adicionada já na nova estrutura.

---

## Contrato de API

Nenhum. Dados vêm de `src/lib/mock/library.ts`.

## Ordem de execução

```
T1 (AppShell)
T2 (refactor structure)   ← depende T1
T3 (mock data)            ← paralelo com T1/T2
T4 (library components)   ← depende T3
T5 (library page)         ← depende T2 + T4
```

---

## Tarefa T1: `AppShell` — componente de shell compartilhado

**Tipo:** refactor
**Agente:** frontend

Extrai o conteúdo de `app/(app)/layout.tsx` para
`src/components/layout/AppShell.tsx`, adicionando o mapeamento para `/library`.

### Arquivo: `src/components/layout/AppShell.tsx`

```tsx
"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopHeader } from "@/components/layout/top-header";
import { mockUser } from "@/lib/mock/dashboard";

function getActiveItem(pathname: string): string {
  if (pathname.startsWith("/exercises")) return "exercicios";
  if (pathname.startsWith("/library")) return "biblioteca";
  if (pathname.startsWith("/progress")) return "progresso";
  if (pathname.startsWith("/explore")) return "explorar";
  if (pathname.startsWith("/personal")) return "personal";
  return "rotina";
}

const sectionTitles: Record<string, string> = {
  rotina: "Dashboard",
  exercicios: "Exercícios",
  biblioteca: "Biblioteca",
  progresso: "Progresso",
  explorar: "Explorar",
  personal: "Personal",
  premium: "Premium",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeItem = getActiveItem(pathname);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden md:flex">
        <Sidebar activeItem={activeItem} onItemChange={() => {}} user={mockUser} />
      </div>
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        <div className="md:hidden">
          <TopBar user={mockUser} activeTab={activeItem} onTabChange={() => {}} />
        </div>
        <div className="hidden md:block">
          <TopHeader
            sectionTitle={sectionTitles[activeItem] ?? activeItem}
            user={mockUser}
          />
        </div>
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          {children}
        </main>
        <div className="md:hidden">
          <BottomNav activeTab={activeItem} onTabChange={() => {}} />
        </div>
      </div>
    </div>
  );
}
```

Também atualizar `NavContent.tsx` para adicionar href de `/library`:
```ts
{ id: "biblioteca", label: "Biblioteca", icon: BookOpen, href: "/library" },
```

### Critérios de aceite T1
- [ ] `AppShell` exportado de `@/components/layout/AppShell`
- [ ] `/library` → activeItem `"biblioteca"` no `getActiveItem`
- [ ] NavContent com link para `/library`

---

## Tarefa T2: Refactor — remover `(app)` e criar layouts flat

**Tipo:** refactor
**Agente:** frontend
**Depende de:** T1

### 2.1 Criar layouts individuais que usam `AppShell`

Template para cada rota (idêntico, apenas o diretório muda):
```tsx
// app/dashboard/layout.tsx  (e  app/exercises/layout.tsx, app/library/layout.tsx)
import { AppShell } from "@/components/layout/AppShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

### 2.2 Mover páginas existentes

| Origem | Destino |
|--------|---------|
| `app/(app)/dashboard/page.tsx` | `app/dashboard/page.tsx` |
| `app/(app)/exercises/page.tsx` | `app/exercises/page.tsx` |
| `app/(app)/exercises/[id]/page.tsx` | `app/exercises/[id]/page.tsx` |

> `exercises/[id]/page.tsx` NÃO precisa de layout próprio — herda de `exercises/layout.tsx`.

### 2.3 Deletar `app/(app)/`

```bash
rm -rf apps/web/src/app/(app)
```

### Estrutura resultante
```
app/
  layout.tsx            ← root (inalterado)
  page.tsx              ← inalterado
  dashboard/
    layout.tsx          ← AppShell wrapper
    page.tsx
  exercises/
    layout.tsx          ← AppShell wrapper
    page.tsx
    [id]/
      page.tsx
  library/
    layout.tsx          ← AppShell wrapper (criado em T5)
    page.tsx            ← criado em T5
```

### Critérios de aceite T2
- [ ] `GET /dashboard` → 200, sem regressão visual
- [ ] `GET /exercises` → 200, sem regressão visual
- [ ] `GET /exercises/supino-reto` → 200
- [ ] Diretório `app/(app)/` não existe mais
- [ ] `pnpm typecheck` limpo

---

## Tarefa T3: Mock data — `library.ts`

**Tipo:** chore
**Agente:** frontend
**Paralelo com:** T1/T2

### Arquivo: `src/lib/mock/library.ts`

```ts
export interface Workout {
  id: string;
  name: string;
  exercises: number;
  image: string;
}

export interface TrainingProgram {
  id: string;
  name: string;
  image: string;
  tags: string[];
  workouts: Workout[];
}

export const libraryTemplates = [
  "Costas e bíceps", "Superior", "Inferior", "Mobilidade",
  "Antebraços", "Cervical", "Alongamentos", "Superior 2",
];

export const mockProgram: TrainingProgram = {
  id: "abc-def",
  name: "ABC DEF",
  image: "https://images.unsplash.com/photo-1570805234093-c456b5c5a193?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  tags: ["6 treinos", "Hipertrofia"],
  workouts: [
    {
      id: "a-lower-1",
      name: "A – LOWER 1",
      exercises: 8,
      image: "https://images.unsplash.com/photo-1641785041080-54b0413a2aa9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      id: "b-push",
      name: "B – PUSH",
      exercises: 9,
      image: "https://images.unsplash.com/photo-1775313091497-40c958123586?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      id: "c-pull",
      name: "C – PULL",
      exercises: 10,
      image: "https://images.unsplash.com/photo-1585152969027-6e1d63f51630?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      id: "d-lower-2",
      name: "D – LOWER 2",
      exercises: 9,
      image: "https://images.unsplash.com/photo-1766287451324-9f679a2266a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      id: "e-peito-costas",
      name: "E – PEITO + COSTAS",
      exercises: 7,
      image: "https://images.unsplash.com/photo-1597452485669-2c7bb5fef90d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
    {
      id: "f-ombro-bracos",
      name: "F – OMBRO e BRAÇOS",
      exercises: 9,
      image: "https://images.unsplash.com/photo-1659350774802-a7abd7b75dc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    },
  ],
};
```

### Critérios de aceite T3
- [ ] `pnpm typecheck` passa
- [ ] 1 programa com 6 treinos mock

---

## Tarefa T4: Componentes da Biblioteca

**Tipo:** feature
**Agente:** frontend
**Depende de:** T3

Criar em `src/components/library/`:

### 4a. `ProgramHeader.tsx` — Server Component

```
bg-card border-b border-border px-5 md:px-6 py-4 md:py-5 flex items-center gap-4/5
├── Image (72px mobile / 80px desktop, rounded-l, object-cover)
├── Info (flex-col gap-1.5)
│   ├── name (20px, 700)
│   └── tags row: pill chips (bg-accent, text-xs, rounded-pill, px-2.5 py-1)
└── button (ellipsis icon, h-9 w-9, bg-muted, rounded-m)
```

Props: `program: TrainingProgram`

### 4b. `WorkoutCard.tsx` — Server Component (grade)

Estrutura idêntica ao `ExerciseCard` existente mas sem link de navegação:
```
rounded-l bg-card border border-border overflow-hidden flex flex-col
├── Image (h-[120px] fill, object-cover)
└── Info (p-2.5 flex flex-col gap-1)
    ├── name (13px, font-semibold)
    └── "N exercícios" (pill, bg-muted, 10px)
```

Props: `workout: Workout`

### 4c. `WorkoutListRow.tsx` — Server Component (lista)

```
flex items-center gap-3.5 md:gap-4 px-5 md:px-6 py-3.5 border-b border-border bg-card
├── Image (52×52, rounded-m, object-cover)
├── Info (flex-col gap-0.5 flex-1)
│   ├── name (15px, 600, foreground)
│   └── "N exercícios" (13px, muted-foreground)
└── ellipsis icon (18px, muted-foreground)
```

Props: `workout: Workout`

### 4d. `ViewToggle.tsx` — Client Component

```tsx
"use client";
interface ViewToggleProps {
  mode: "grade" | "lista";
  onChange: (mode: "grade" | "lista") => void;
}
// Dois botões: LayoutGrid (grade) e List (lista)
// Ativo: bg-primary text-white. Inativo: bg-muted text-muted-foreground
// Rounded-m, h-8 w-8, icon 16px
```

### 4e. `LibraryPanel.tsx` — Server Component (desktop only)

```
flex flex-col w-[300px] shrink-0 bg-card border-l border-border h-full
├── Header (px-4 py-4 border-b): "Biblioteca de Treinos" (13px, 700, primary)
└── list (overflow-y-auto flex-1)
    └── rows: template name (13px) + chevron, px-4 py-3, border-b
```

Props: `templates: string[]`

### 4f. `LibraryClientPage.tsx` — Client Component

```tsx
"use client";
export function LibraryClientPage({ program, templates }: Props) {
  const [mode, setMode] = useState<"grade" | "lista">("grade");

  return (
    <div className="flex h-full">
      {/* Center content */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
        <ProgramHeader program={program} />

        {/* Section header */}
        <div className="flex items-center justify-between px-5 md:px-6 py-3.5">
          <span className="text-[13px] font-semibold text-muted-foreground">Treinos</span>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-muted-foreground">
              {program.workouts.length} / {program.workouts.length}
            </span>
            <ViewToggle mode={mode} onChange={setMode} />
          </div>
        </div>

        {/* Grid or list */}
        {mode === "grade" ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 px-5 md:px-6 pb-24 md:pb-6">
            {program.workouts.map(w => <WorkoutCard key={w.id} workout={w} />)}
          </div>
        ) : (
          <div className="flex flex-col pb-24 md:pb-6">
            {program.workouts.map(w => <WorkoutListRow key={w.id} workout={w} />)}
          </div>
        )}

        {/* Desktop CTA */}
        <div className="hidden md:flex justify-center px-6 py-5 border-t border-border">
          <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-pill px-8 py-3 text-[15px] font-semibold">
            <Plus className="h-[18px] w-[18px]" />
            Criar nova rotina
          </button>
        </div>
      </div>

      {/* Desktop right panel */}
      <div className="hidden lg:flex">
        <LibraryPanel templates={templates} />
      </div>

      {/* Mobile CTA */}
      <div className="md:hidden fixed bottom-24 left-0 right-0 px-5 pb-2">
        <button className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-pill h-12 text-[15px] font-semibold">
          <Plus className="h-[18px] w-[18px]" />
          Criar nova rotina
        </button>
      </div>
    </div>
  );
}
```

### Critérios de aceite T4
- [ ] `WorkoutCard` renderiza imagem, nome, contagem
- [ ] `WorkoutListRow` renderiza thumbnail, nome, contagem, more icon
- [ ] `ViewToggle` alterna estado corretamente
- [ ] `LibraryPanel` lista os 8 templates
- [ ] `LibraryClientPage` gerencia `mode` e renderiza grade ou lista

---

## Tarefa T5: Rota `/library`

**Tipo:** feature
**Agente:** frontend
**Depende de:** T2, T4

### `app/library/layout.tsx`
```tsx
import { AppShell } from "@/components/layout/AppShell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
```

### `app/library/page.tsx`
```tsx
import type { Metadata } from "next";
import { mockProgram, libraryTemplates } from "@/lib/mock/library";
import { LibraryClientPage } from "@/components/library/LibraryClientPage";

export const metadata: Metadata = { title: "Biblioteca — FitFlow" };

export default function LibraryPage() {
  return (
    <LibraryClientPage
      program={mockProgram}
      templates={libraryTemplates}
    />
  );
}
```

### Critérios de aceite T5
- [ ] `GET /library` → 200
- [ ] Sidebar mostra "Biblioteca" ativo
- [ ] Grade como padrão, toggle visível
- [ ] Painel "Biblioteca de Treinos" visível em desktop

---

## Critérios de sucesso finais

- [ ] Estrutura flat: `app/dashboard/`, `app/exercises/`, `app/library/`
- [ ] `/dashboard`, `/exercises`, `/exercises/[id]` sem regressão
- [ ] `/library` com grade (default) + lista + painel desktop
- [ ] `pnpm typecheck` limpo
- [ ] `pnpm lint` limpo

---

## Nota sobre o Mobile CTA

O CTA "Criar nova rotina" no mobile tem `fixed bottom-24` (acima do bottom nav de
~88px). Se o bottom nav tiver altura diferente, ajustar o valor de bottom.
