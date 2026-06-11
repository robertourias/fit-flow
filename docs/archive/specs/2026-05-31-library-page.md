# Spec: Página Biblioteca + Refactor Route Group

**Status:** approved
**Data:** 2026-05-31
**Autor:** planner-agent
**Escopo:** `apps/web`

---

## Problema

Dois problemas a resolver nesta entrega:

1. **A página `/library` não existe.** O praticante precisa ver e gerenciar seus
   programas de treino (rotinas) de forma organizada. O design existe em
   `docs/UI/fit-flow.pen` como "Programa de Treino" (frames `VuT3Q` desktop, `qs78K`
   mobile), mas não há implementação correspondente.

2. **O Route Group `(app)` polui a estrutura de diretórios.** Os arquivos estão em
   `app/(app)/dashboard/`, `app/(app)/exercises/` — os parênteses são um detalhe de
   Next.js invisível nas URLs mas visíveis no código. O projeto cresce melhor com uma
   estrutura flat: `app/dashboard/`, `app/exercises/`, `app/library/`.

---

## Fonte de design

Frames de referência no `docs/UI/fit-flow.pen`:
- `VuT3Q` — Programa de Treino Desktop Dark
- `qs78K` — Programa de Treino Mobile Dark
- `Joaaw` — Treino Detalhe Desktop Dark (fora do escopo desta iteração)
- `O6Vqh` — Treino Detalhe Mobile Dark (fora do escopo desta iteração)

---

## Cenários de Usuário

- **P1 (crítico):** Como praticante, quero ver meus programas de treino em grade
  (modo padrão) para ter uma visão visual dos programas que possuo.

- **P1 (crítico):** Como praticante, quero alternar para modo lista quando preferir
  ver os treinos de forma mais compacta com mais informações por linha.

- **P2 (importante):** Como praticante, quero ver os treinos do meu programa
  ativos com thumbnail, nome e contagem de exercícios.

- **P2 (importante):** No desktop, quero ver um painel lateral "Biblioteca de Treinos"
  com templates de rotinas disponíveis para adicionar.

---

## Requisitos Funcionais

### Prerequisito: Refactor estrutura de diretórios (sem Route Group)

- **FR-001:** Mover todas as páginas de `app/(app)/` para `app/` diretamente:
  - `app/(app)/dashboard/page.tsx` → `app/dashboard/page.tsx`
  - `app/(app)/exercises/page.tsx` → `app/exercises/page.tsx`
  - `app/(app)/exercises/[id]/page.tsx` → `app/exercises/[id]/page.tsx`
- **FR-002:** Criar `src/components/layout/AppShell.tsx` — componente que encapsula
  a lógica do shell de navegação (sidebar, topbar, bottomnav, topheader) com
  `usePathname()`. Substituir o `app/(app)/layout.tsx` por layouts individuais
  em cada rota que importam `AppShell`.
- **FR-003:** Após a migração, deletar o diretório `app/(app)/` inteiro.

**Estrutura resultante:**
```
app/
  layout.tsx           ← root (ThemeProvider, fontes)
  page.tsx             ← placeholder "/"
  dashboard/
    layout.tsx         ← <AppShell>{children}</AppShell>
    page.tsx
  exercises/
    layout.tsx         ← <AppShell>{children}</AppShell>
    page.tsx
    [id]/
      page.tsx
  library/
    layout.tsx         ← <AppShell>{children}</AppShell>
    page.tsx
```

### Página de Biblioteca (`/library`)

#### Layout
- **FR-004:** Mesmo shell do dashboard: sidebar desktop, topbar mobile, topheader
  desktop, bottom nav mobile. Header mostra "Biblioteca" como título de seção.
- **FR-005:** `AppShell` deve mapear `/library` → activeItem `"biblioteca"` para
  marcar corretamente o item de nav ativo.

#### Program Header
- **FR-006:** Área de cabeçalho do programa (card no topo do conteúdo):
  - Imagem do programa: 80px × 80px, rounded-l (desktop) / 72px (mobile)
  - Nome do programa: "ABC DEF" → mock data configurável
  - Tags: badge com número de treinos (ex: "6 treinos"), badge com categoria
  - Botão de menu "..." (ícone `ellipsis`, bg-muted, rounded-m)

#### Toggle de visualização (lista ↔ grade)
- **FR-007:** Botão toggle posicionado no header da seção de treinos, à direita da
  contagem. Dois modos:
  - `grade` (padrão): ícone `layout-grid`, cards em grid 2-col (mobile) / 3-col (lg+)
  - `lista`: ícone `list`, linhas com thumbnail + info + more (modo Pencil)
- **FR-008:** Estado do toggle persiste via `useState`. Grade é o modo inicial.

#### Vista Grade (padrão)
- **FR-009:** Cards de treino em grid responsivo:
  - Mobile: 2 colunas
  - Desktop: 3 colunas (lg+)
  - Cada card: imagem (120px h, fill), rounded-l, bg-card, border. Info section
    com nome do treino (13px, font-semibold), badge "N exercícios" (muted pill)

#### Vista Lista (modo Pencil)
- **FR-010:** Linhas de treino em lista vertical, border-b entre itens:
  - Thumbnail: 52px × 52px, rounded-m
  - Info: nome (15px, 600) + contagem de exercícios (13px, muted)
  - Ícone `ellipsis` (18px, muted-foreground) à direita
  - Padding: 14px vertical, 20px horizontal (mobile) / 24px horizontal (desktop)

#### Seção e contagem
- **FR-011:** Header da seção acima do grid/lista: "Treinos" (13px, 600, muted) +
  contagem "6 / 6" à direita. Padding 14px/20px.

#### Painel direito — Biblioteca de Treinos (desktop only)
- **FR-012:** Painel lateral direito de 300px, visível apenas em `lg+`, com:
  - Header fixo: "Biblioteca de Treinos" (13px, 700, primary)
  - Lista de templates com rows: nome + ação
  - Templates mock: Costas e bíceps, Superior, Inferior, Mobilidade, Antebraços,
    Cervical, Alongamentos, Superior 2
  - Padding 12px vertical, 16px horizontal por row
  - Border-b entre rows

#### CTA fixo
- **FR-013:** Botão "Criar nova rotina" (bg-primary, rounded-pill, ícone `plus`
  branco, texto branco, 15px 600) no rodapé da página ou fixo na base:
  - Mobile: sticky bottom, padding 20px, border-t
  - Desktop: no rodapé do conteúdo central

### Mock Data
- **FR-014:** Criar `src/lib/mock/library.ts` com:
  ```ts
  interface TrainingProgram {
    id: string;           // "abc-def"
    name: string;         // "ABC DEF"
    image: string;        // Unsplash URL
    tags: string[];       // ["6 treinos", "Hipertrofia"]
    workouts: Workout[];
  }
  interface Workout {
    id: string;
    name: string;         // "A – LOWER 1"
    exercises: number;    // 8
    image: string;        // Unsplash URL
  }
  ```
  Pelo menos 1 programa com 6 treinos usando imagens dos frames do Pencil.

### Imagens
- **FR-015:** Baixar/referenciar as imagens dos programas e treinos (Unsplash URLs
  do Pencil) mantendo as URLs diretas no mock data. `next/image` com
  `remotePatterns` já configurado.
  - Imagens locais de backup em `public/library-images/` se necessário.

---

## Critérios de Sucesso

- [ ] `GET /library` retorna 200 com programa e treinos renderizados
- [ ] Modo grade (padrão): treinos em grid 2-col mobile / 3-col desktop
- [ ] Modo lista: treinos como linhas com thumbnail + info + more
- [ ] Toggle lista↔grade funciona visualmente
- [ ] Painel "Biblioteca de Treinos" visível em desktop (lg+)
- [ ] CTA "Criar nova rotina" visível em mobile e desktop
- [ ] Dashboard (`/dashboard`) continua funcionando sem regressão
- [ ] Exercícios (`/exercises`) continua funcionando sem regressão
- [ ] Estrutura de diretórios: `app/dashboard/`, `app/exercises/`, `app/library/`
      (sem `(app)` group)
- [ ] `pnpm typecheck` limpo em `apps/web`
- [ ] `pnpm lint` limpo em `apps/web`

---

## Estrutura de arquivos esperada

```
apps/web/src/
  app/
    layout.tsx                  ← root (inalterado)
    page.tsx                    ← inalterado
    dashboard/
      layout.tsx                ← novo: <AppShell>{children}</AppShell>
      page.tsx                  ← movido de (app)/dashboard/
    exercises/
      layout.tsx                ← novo: <AppShell>{children}</AppShell>
      page.tsx                  ← movido de (app)/exercises/
      [id]/
        page.tsx                ← movido de (app)/exercises/[id]/
    library/
      layout.tsx                ← novo: <AppShell>{children}</AppShell>
      page.tsx                  ← novo
  components/
    layout/
      AppShell.tsx              ← novo: shell extraído do (app)/layout.tsx
    library/
      ProgramHeader.tsx         ← cabeçalho do programa
      WorkoutGrid.tsx           ← grade de treinos
      WorkoutList.tsx           ← lista de treinos
      LibraryPanel.tsx          ← painel direito (desktop only)
      ViewToggle.tsx            ← toggle lista/grade (Client Component)
      LibraryClientPage.tsx     ← wrapper Client com useState(viewMode)
  lib/
    mock/
      library.ts                ← tipos + programa mock
  public/
    library-images/             ← imagens locais se necessário
```

---

## Fora do Escopo

- Página de detalhe do treino (`/library/[id]/workout/[wid]`) — frames `Joaaw`/`O6Vqh`
- Funcionalidade de criação real de rotina (CTA apenas visual)
- Breadcrumb de navegação (desktop Pencil mostra "Minha Biblioteca → ABC DEF")
- Autenticação / proteção de rota

---

## Riscos e Premissas

- **Premissa:** A refatoração do Route Group (FR-001 a FR-003) é um prerequisito
  que deve ser completada antes da página `/library` ser adicionada.
- **Risco:** Mover arquivos pode causar regressão visual no dashboard e exercises.
  → Mitigação: TypeScript check + screenshot das rotas existentes após migração.
- **Premissa:** `next/image` com `remotePatterns` Unsplash já está configurado
  (adicionado na feature de exercícios).
- **Risco:** O toggle lista↔grade requer `"use client"` — garantir que a boundary
  RSC/Client é respeitada (LibraryClientPage recebe os dados como prop).

---

<!-- 
GATE DE APROVAÇÃO
Para desbloquear a criação do plano técnico, altere o Status acima de "draft" para "approved".
O agente planner NÃO deve criar tasks de implementação enquanto Status for "draft".
-->
