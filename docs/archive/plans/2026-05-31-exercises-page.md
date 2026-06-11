# Plano Técnico: Página de Exercícios — Lista e Detalhe

**Spec:** `docs/specs/2026-05-31-exercises-page.md`
**Data:** 2026-05-31
**Escopo:** `apps/web`

---

## Contexto

O dashboard (`app/dashboard/layout.tsx`) já tem o shell de navegação completo
(Sidebar + TopHeader + BottomNav) com `useState("rotina")` hardcoded como item ativo.
Para que `/exercises` use o mesmo shell sem duplicar código, o T1 deste plano refatora
o layout para um Route Group `(app)` que usa `usePathname()` para detectar a rota
ativa. Essa mudança preserva o dashboard 100% e habilita todos os caminhos futuros.

---

## Contrato de API

Nenhum. Todos os dados vêm de `src/lib/mock/exercises.ts` (mock data estático).

## Contrato de roteamento

| Rota | Componente principal | Observação |
|------|---------------------|------------|
| `/dashboard` | `(app)/dashboard/page.tsx` | ativo: "rotina" |
| `/exercises` | `(app)/exercises/page.tsx` | ativo: "exercicios" |
| `/exercises/[id]` | `(app)/exercises/[id]/page.tsx` | ativo: "exercicios" |

---

## Ordem de execução

```
T1 (refactor layout)
T2 (next.config + Unsplash)   paralelo com T1
T3 (imagens muscle chips)      paralelo com T1
T4 (mock data)
T5 (ExerciseCard)       ─┐
T6 (MuscleChip)          ├─ dependem de T4
T7 (FilterBar + Client)  ┘
T8 (página lista /exercises)    ← depende T5+T6+T7
T9 (ExerciseDetail)             ← depende T4
T10 (página detalhe /exercises/[id])  ← depende T9
```

---

## Tarefa T1: Refactor — Route Group `(app)` com `usePathname`

**Tipo:** refactor
**Agente:** frontend

Extrai o shell de navegação para um layout compartilhado, eliminando duplicação
futura. O dashboard continua funcionando sem alterações visíveis.

### Passos

**1. Criar `app/(app)/layout.tsx`**

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
  if (pathname.startsWith("/progress")) return "progresso";
  if (pathname.startsWith("/explore")) return "explorar";
  if (pathname.startsWith("/personal")) return "personal";
  return "rotina";
}

const sectionTitles: Record<string, string> = {
  rotina: "Dashboard",
  exercicios: "Exercícios",
  progresso: "Progresso",
  explorar: "Explorar",
  personal: "Personal",
  biblioteca: "Biblioteca",
  premium: "Premium",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
          <TopHeader sectionTitle={sectionTitles[activeItem] ?? activeItem} user={mockUser} />
        </div>
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">{children}</main>
        <div className="md:hidden">
          <BottomNav activeTab={activeItem} onTabChange={() => {}} />
        </div>
      </div>
    </div>
  );
}
```

**Nota sobre `onItemChange`:** Com `usePathname()`, a navegação é feita via `<Link>`
nos itens do menu, não via `setState`. Os props `onItemChange` e `onTabChange` passam
função vazia `() => {}` — o NavContent e BottomNav precisarão usar `<Link>` em vez de
`<button onClick>`. Ver nota de migração no T1.3 abaixo.

**2. Mover `app/dashboard/` para `app/(app)/dashboard/`**

```
Antes:  app/dashboard/layout.tsx (delete)
        app/dashboard/page.tsx
Depois: app/(app)/dashboard/page.tsx  (remove import de layout próprio)
        app/(app)/layout.tsx           (novo, acima)
```

O `app/dashboard/layout.tsx` atual é deletado. O `page.tsx` permanece igual.

**3. Atualizar NavContent e BottomNav para navegação via Link**

`NavContent.tsx`: Os botões de nav mudam de `<button onClick>` para `<Link href>`:
```tsx
import Link from "next/link";
// ...
const navPaths: Record<string, string> = {
  rotina: "/dashboard",
  exercicios: "/exercises",
  progresso: "/progress",
  explorar: "/explore",
  personal: "/personal",
  exercicios_lib: "/exercises",
  biblioteca: "/exercises",
};

// Botão de nav:
<Link href={navPaths[id] ?? "/"} className={navButtonClass(id)} onClick={onClose}>
  <Icon className="h-[18px] w-[18px] shrink-0" />
  {label}
</Link>
```

`BottomNav.tsx`: Mesmo padrão, usa `<Link>` em vez de `<button onClick>`.

### Critérios de aceite T1
- [ ] `GET /dashboard` continua funcionando sem regressão visual
- [ ] `GET /exercises` usa o mesmo shell (sidebar, header, bottom nav)
- [ ] Aba "Exercícios" aparece ativa na sidebar e bottom nav ao acessar `/exercises`
- [ ] Nenhum erro de TypeScript

---

## Tarefa T2: next.config.ts — `images.remotePatterns` para Unsplash

**Tipo:** chore
**Agente:** frontend
**Paralelo com:** T1

Adicionar ao `next.config.ts` para que `next/image` aceite URLs do Unsplash:

```ts
images: {
  remotePatterns: [
    {
      protocol: "https",
      hostname: "images.unsplash.com",
    },
  ],
},
```

### Critérios de aceite T2
- [ ] `next/image` com `src="https://images.unsplash.com/..."` não gera erro de hostname

---

## Tarefa T3: Imagens — copiar muscle chips + baixar thumbnails

**Tipo:** chore
**Agente:** frontend
**Paralelo com:** T1

**3.1 Copiar muscle chips** (já existem em `docs/UI/images/`):

```bash
mkdir -p apps/web/public/exercises/muscles
cp docs/UI/images/generated-1780181078355.png apps/web/public/exercises/muscles/todos.png
cp docs/UI/images/generated-1780181077535.png apps/web/public/exercises/muscles/peito.png
cp docs/UI/images/generated-1780181076176.png apps/web/public/exercises/muscles/costas.png
cp docs/UI/images/generated-1780181082579.png apps/web/public/exercises/muscles/ombros.png
cp docs/UI/images/generated-1780181073008.png apps/web/public/exercises/muscles/biceps.png
cp docs/UI/images/generated-1780181069739.png apps/web/public/exercises/muscles/triceps.png
cp docs/UI/images/generated-1780181077083.png apps/web/public/exercises/muscles/pernas.png
cp docs/UI/images/generated-1780181076029.png apps/web/public/exercises/muscles/abdomen.png
cp docs/UI/images/generated-1780181088174.png apps/web/public/exercises/muscles/gluteos.png
```

**3.2 Thumbnails de exercícios** — usar URLs Unsplash diretas no mock data (após T2
habilitar `remotePatterns`). Não é necessário baixar localmente nesta iteração; o
`next/image` fará o cache automaticamente. Os `src` no mock data apontam para as
URLs do Pencil.

### Critérios de aceite T3
- [ ] 9 imagens em `public/exercises/muscles/` com nomes corretos

---

## Tarefa T4: Mock data — `src/lib/mock/exercises.ts`

**Tipo:** chore
**Agente:** frontend
**Depende de:** T2 (para validar tipos)

```ts
export type ExerciseType = "Força" | "Cardio";

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  type: ExerciseType;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  image: string;           // URL Unsplash ou /exercises/thumbs/...
  bookmarkCount: string;   // "140k"
}

export const mockExercises: Exercise[] = [
  // Peito
  { id: "supino-reto", name: "Supino Reto", muscleGroup: "Peito",
    equipment: "Barra", type: "Força",
    primaryMuscles: ["Peitoral maior"], secondaryMuscles: ["Deltóide anterior", "Tríceps"],
    image: "https://images.unsplash.com/photo-1652363722856-214ce6a06a44?...",
    bookmarkCount: "140k" },

  { id: "supino-inclinado", name: "Supino Inclinado", muscleGroup: "Peito",
    equipment: "Halteres", type: "Força",
    primaryMuscles: ["Peitoral superior"], secondaryMuscles: ["Deltóide", "Tríceps"],
    image: "https://images.unsplash.com/photo-1734668470900-28982e41ce23?...",
    bookmarkCount: "98k" },

  // Costas
  { id: "puxada-frontal", name: "Puxada Frontal", muscleGroup: "Costas",
    equipment: "Cabo", type: "Força",
    primaryMuscles: ["Grande dorsal"], secondaryMuscles: ["Bíceps", "Rombóide"],
    image: "https://images.unsplash.com/photo-1596357395328-bb8ef99affbb?...",
    bookmarkCount: "112k" },

  // Ombros
  { id: "desenvolvimento", name: "Desenvolvimento", muscleGroup: "Ombros",
    equipment: "Halteres", type: "Força",
    primaryMuscles: ["Deltóide médio"], secondaryMuscles: ["Trapézio", "Tríceps"],
    image: "https://images.unsplash.com/photo-1733517300919-ec69c1447345?...",
    bookmarkCount: "87k" },

  { id: "elevacao-lateral", name: "Elevação Lateral", muscleGroup: "Ombros",
    equipment: "Halteres", type: "Força",
    primaryMuscles: ["Deltóide lateral"], secondaryMuscles: ["Trapézio"],
    image: "https://images.unsplash.com/photo-1554344728-77cf90d9ed26?...",
    bookmarkCount: "76k" },

  // Bíceps
  { id: "rosca-direta", name: "Rosca Direta", muscleGroup: "Bíceps",
    equipment: "Barra", type: "Força",
    primaryMuscles: ["Bíceps braquial"], secondaryMuscles: ["Braquiorradial"],
    image: "https://images.unsplash.com/photo-1772450014674-5b2035852e39?...",
    bookmarkCount: "134k" },

  // Tríceps
  { id: "triceps-pulley", name: "Tríceps Pulley", muscleGroup: "Tríceps",
    equipment: "Cabo", type: "Força",
    primaryMuscles: ["Tríceps braquial"], secondaryMuscles: [],
    image: "https://images.unsplash.com/photo-1599577456698-e1e9ae4f4e5b?...",
    bookmarkCount: "92k" },

  // Pernas
  { id: "agachamento", name: "Agachamento", muscleGroup: "Pernas",
    equipment: "Barra", type: "Força",
    primaryMuscles: ["Quadríceps", "Glúteo máximo"], secondaryMuscles: ["Isquiotibiais", "Panturrilhas"],
    image: "https://images.unsplash.com/photo-1734668470900-28982e41ce23?...",
    bookmarkCount: "201k" },

  { id: "leg-press", name: "Leg Press", muscleGroup: "Pernas",
    equipment: "Máquina", type: "Força",
    primaryMuscles: ["Quadríceps"], secondaryMuscles: ["Glúteos", "Isquiotibiais"],
    image: "https://images.unsplash.com/photo-1738524107743-a62f57059b96?...",
    bookmarkCount: "88k" },

  // Abdômen
  { id: "abdominal-crunch", name: "Abdominal Crunch", muscleGroup: "Abdômen",
    equipment: "Peso corporal", type: "Força",
    primaryMuscles: ["Reto abdominal"], secondaryMuscles: ["Oblíquos"],
    image: "https://images.unsplash.com/photo-1544033527-b192daee1f5b?...",
    bookmarkCount: "67k" },

  // Glúteos
  { id: "hip-thrust", name: "Hip Thrust", muscleGroup: "Glúteos",
    equipment: "Barra", type: "Força",
    primaryMuscles: ["Glúteo máximo"], secondaryMuscles: ["Isquiotibiais"],
    image: "https://images.unsplash.com/photo-1596357395328-bb8ef99affbb?...",
    bookmarkCount: "145k" },

  // Cardio
  { id: "corrida-esteira", name: "Corrida na Esteira", muscleGroup: "Pernas",
    equipment: "Máquina", type: "Cardio",
    primaryMuscles: ["Quadríceps", "Panturrilhas"], secondaryMuscles: ["Glúteos"],
    image: "https://images.unsplash.com/photo-1544033527-b192daee1f5b?...",
    bookmarkCount: "43k" },
];

export const muscleGroups = [
  { id: "todos", label: "Todos", image: "/exercises/muscles/todos.png" },
  { id: "Peito", label: "Peito", image: "/exercises/muscles/peito.png" },
  { id: "Costas", label: "Costas", image: "/exercises/muscles/costas.png" },
  { id: "Ombros", label: "Ombros", image: "/exercises/muscles/ombros.png" },
  { id: "Bíceps", label: "Bíceps", image: "/exercises/muscles/biceps.png" },
  { id: "Tríceps", label: "Tríceps", image: "/exercises/muscles/triceps.png" },
  { id: "Pernas", label: "Pernas", image: "/exercises/muscles/pernas.png" },
  { id: "Abdômen", label: "Abdômen", image: "/exercises/muscles/abdomen.png" },
  { id: "Glúteos", label: "Glúteos", image: "/exercises/muscles/gluteos.png" },
];

export const equipmentOptions = ["Todos", "Barra", "Halteres", "Cabo", "Máquina", "Peso corporal"];
export const typeOptions: Array<"Todos" | ExerciseType> = ["Todos", "Força", "Cardio"];
```

### Critérios de aceite T4
- [ ] `pnpm typecheck` passa com o arquivo criado
- [ ] 12 exercícios cobrindo ao menos 6 grupos musculares distintos

---

## Tarefa T5: Componente `ExerciseCard`

**Tipo:** feature
**Agente:** frontend
**Depende de:** T4

Server Component (sem interatividade — apenas renderiza dados + Link de navegação).

```
src/components/exercises/ExerciseCard.tsx
```

Estrutura:
```tsx
import Link from "next/link";
import Image from "next/image";
import { Bookmark } from "lucide-react";

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link href={`/exercises/${exercise.id}`}>
      <div className="relative bg-card rounded-l border border-border overflow-hidden flex flex-col">
        {/* Thumb */}
        <div className="relative h-[120px] w-full">
          <Image src={exercise.image} alt={exercise.name} fill className="object-cover" />
          {/* Bookmark */}
          <button className="absolute top-2 left-2 h-7 w-7 bg-card rounded-s flex items-center justify-center">
            <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        {/* Info */}
        <div className="p-2.5 flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-foreground leading-tight">{exercise.name}</span>
          <div className="flex gap-1.5 flex-wrap">
            <span className="inline-flex items-center rounded-pill px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground">
              {exercise.muscleGroup}
            </span>
            <span className="inline-flex items-center rounded-pill px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground">
              {exercise.equipment}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
```

### Critérios de aceite T5
- [ ] Card renderiza corretamente com imagem, nome, tags
- [ ] Link navega para `/exercises/[id]`
- [ ] Não usa `"use client"`

---

## Tarefa T6: Componente `MuscleChip`

**Tipo:** feature
**Agente:** frontend
**Depende de:** T4

Client Component (estado ativo controlado pelo pai via prop).

```
src/components/exercises/MuscleChip.tsx
```

```tsx
import Image from "next/image";
import { cn } from "@/lib/utils";

interface MuscleChipProps {
  label: string;
  image: string;
  active: boolean;
  onClick: () => void;
}

export function MuscleChip({ label, image, active, onClick }: MuscleChipProps) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 w-[58px] shrink-0">
      <div className={cn(
        "h-11 w-11 rounded-full overflow-hidden ring-2 transition-all",
        active ? "ring-primary" : "ring-transparent"
      )}>
        <Image src={image} alt={label} width={44} height={44} className="object-cover" />
      </div>
      <span className={cn("text-[9px] text-center leading-none", active ? "text-primary font-semibold" : "text-muted-foreground")}>
        {label}
      </span>
    </button>
  );
}
```

### Critérios de aceite T6
- [ ] Chip ativo com ring primário e label verde
- [ ] Chip inativo com label muted-foreground

---

## Tarefa T7: Componente `FilterBar` + `ExercisesClientPage`

**Tipo:** feature
**Agente:** frontend
**Depende de:** T4, T5, T6

Dois Client Components no mesmo arquivo ou separados:

**`FilterBar.tsx`** — barra de filtros horizontal completa:
- Linha de busca: `<input>` + botão filtro (mobile)
- Linha de muscle chips: scroll horizontal com `MuscleChip`s
- Linha Equip.: label + pill chips
- Linha Tipo: label + pill chips
- Linha count + toggle

**`ExercisesClientPage.tsx`** — wrapper Client que gerencia estado e renderiza grid:
```tsx
"use client";
export function ExercisesClientPage({ exercises }: { exercises: Exercise[] }) {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("todos");
  const [equipment, setEquipment] = useState("Todos");
  const [type, setType] = useState<"Todos" | ExerciseType>("Todos");

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => exercises.filter(e => {
    const matchSearch = !debouncedSearch || e.name.toLowerCase().includes(debouncedSearch.toLowerCase());
    const matchMuscle = muscle === "todos" || e.muscleGroup === muscle;
    const matchEquip = equipment === "Todos" || e.equipment === equipment;
    const matchType = type === "Todos" || e.type === type;
    return matchSearch && matchMuscle && matchEquip && matchType;
  }), [exercises, debouncedSearch, muscle, equipment, type]);

  return (
    <>
      <FilterBar
        search={search} onSearch={setSearch}
        muscle={muscle} onMuscle={setMuscle}
        equipment={equipment} onEquipment={setEquipment}
        type={type} onType={setType}
        totalCount={filtered.length}
      />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-5 pt-2">
        {filtered.map(ex => <ExerciseCard key={ex.id} exercise={ex} />)}
      </div>
    </>
  );
}
```

**`useDebounce` hook** — criar em `src/lib/hooks/useDebounce.ts`:
```ts
import { useEffect, useState } from "react";
export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
```

### Critérios de aceite T7
- [ ] Filtro de músculo filtra os cards corretamente
- [ ] Busca com debounce 300ms funciona
- [ ] Filtros de equipamento e tipo funcionam
- [ ] "0 exercícios" aparece quando nenhum resultado

---

## Tarefa T8: Página de lista `/exercises`

**Tipo:** feature
**Agente:** frontend
**Depende de:** T1, T7

```tsx
// app/(app)/exercises/page.tsx
import { mockExercises } from "@/lib/mock/exercises";
import { ExercisesClientPage } from "@/components/exercises/ExercisesClientPage";

export const metadata = { title: "Exercícios — FitFlow" };

export default function ExercisesPage() {
  return <ExercisesClientPage exercises={mockExercises} />;
}
```

O layout compartilhado de T1 envolve automaticamente essa página com o shell de
navegação correto, com "Exercícios" como item ativo.

### Critérios de aceite T8
- [ ] `GET /exercises` retorna 200 com 12 cards renderizados
- [ ] Sidebar mostra "Exercícios" ativo
- [ ] Bottom nav mostra "Exercícios" ativo
- [ ] Layout idêntico ao dashboard (mesmos espaçamentos, header h-20)

---

## Tarefa T9: Componente `ExerciseDetail`

**Tipo:** feature
**Agente:** frontend
**Depende de:** T4

Server Component que recebe um `Exercise` e renderiza o layout de detalhe mobile.

```
src/components/exercises/ExerciseDetail.tsx
```

Seções:
1. **Área de imagem** — `relative h-[220px]`, `next/image` com `fill`, `object-cover`,
   overlay `bg-gradient-to-t from-black/70 to-transparent` no rodapé
2. **Action Bar** — "Exercícios de {muscleGroup}" + bookmark (ícone + count) + share
3. **Body Section** — flex row, 180px + fill:
   - Silhueta placeholder (bg-muted, rounded-l, flex items-center justify-center,
     texto "Frente / Costas" + lista de músculos abaixo)
   - Detalhes: 4 linhas com label (11px, caps, muted) + valor (13px, foreground)
4. **CTA** — fixed bottom, "Adicionar ao Treino", bg-primary, disabled

### Critérios de aceite T9
- [ ] Renderiza todos os dados do exercício passado como prop
- [ ] Imagem carrega via `next/image`

---

## Tarefa T10: Página de detalhe `/exercises/[id]`

**Tipo:** feature
**Agente:** frontend
**Depende de:** T1, T9

```tsx
// app/(app)/exercises/[id]/page.tsx
import { notFound } from "next/navigation";
import { mockExercises } from "@/lib/mock/exercises";
import { ExerciseDetail } from "@/components/exercises/ExerciseDetail";

export default function ExerciseDetailPage({ params }: { params: { id: string } }) {
  const exercise = mockExercises.find(e => e.id === params.id);
  if (!exercise) notFound();
  return <ExerciseDetail exercise={exercise} />;
}

export function generateStaticParams() {
  return mockExercises.map(e => ({ id: e.id }));
}
```

### Critérios de aceite T10
- [ ] `GET /exercises/supino-reto` retorna 200 com detalhe correto
- [ ] `GET /exercises/inexistente` retorna 404
- [ ] Header tem botão de voltar funcional (`<Link href="/exercises">`)
- [ ] CTA "Adicionar ao Treino" está presente mas desabilitado

---

## Critérios de sucesso finais

- [ ] `/exercises` renderiza lista de 12 cards com filtros horizontais
- [ ] `/exercises/[id]` renderiza detalhe do exercício
- [ ] Dashboard não regrediu visualmente após T1
- [ ] Imagens de músculo em `public/exercises/muscles/` (9 arquivos)
- [ ] `pnpm typecheck` limpo em `apps/web`
- [ ] `pnpm lint` limpo em `apps/web`

---

## Nota sobre migração do TopBar/BottomNav (T1)

O `TopBar` e `BottomNav` atuais usam `onTabChange` callback para mudar o activeItem
via `useState`. Com o Route Group, a troca de seção acontece por navegação de URL,
então `onTabChange` é substituído por Links. Os componentes precisam de pequenas
adaptações — `NavContent.tsx` substitui `<button onClick>` por `<Link href>`,
e os itens extras (Exercícios, Biblioteca) passam a ter rotas reais.

```
/dashboard   → activeItem "rotina"
/exercises   → activeItem "exercicios"
```

Os demais itens (Progresso, Explorar, Personal) permanecem como botões sem rota
até que suas páginas sejam implementadas.

---

## Pacotes existentes (nenhum novo necessário)

Todos os pacotes já estão instalados:
- `next/image` — já disponível
- `lucide-react` — já instalado
- `date-fns` — já instalado
- Sem novo `pnpm add` necessário para esta feature
