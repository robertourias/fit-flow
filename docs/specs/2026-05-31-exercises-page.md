# Spec: Página de Exercícios — Lista e Detalhe

**Status:** approved
**Data:** 2026-05-31
**Autor:** planner-agent
**Escopo:** `apps/web`

---

## Problema

A biblioteca de exercícios é um componente central do FitFlow — praticantes precisam
explorar, filtrar e entender exercícios antes de montarem suas rotinas. Atualmente
nenhuma tela de exercícios existe em `apps/web`. Este spec cobre a implementação da
lista de exercícios e da tela de detalhe com dados mock.

---

## Fonte de design

Frames de referência no `docs/UI/fit-flow.pen`:
- `Kh4G5` — Exercícios Mobile (light)
- `Fp0VF` — Exercícios Mobile Dark
- `gT93e` — Exercícios Desktop Dark
- `cd4iE` — Exercício Detalhe Mobile (light)
- `A15Xp` — Exercício Detalhe Mobile Dark

---

## Cenários de Usuário

- **P1 (crítico):** Como praticante, quero ver a lista de exercícios filtrada por
  grupo muscular para encontrar rapidamente opções para o treino que estou montando.

- **P1 (crítico):** Como praticante, quero buscar um exercício pelo nome para acessar
  suas informações diretamente.

- **P2 (importante):** Como praticante, quero filtrar por equipamento e tipo de
  exercício para encontrar exercícios compatíveis com o que tenho disponível.

- **P2 (importante):** Como praticante, quero ver o detalhe de um exercício (imagem,
  grupo muscular, músculos primários e secundários, equipamento) para executar
  corretamente.

- **P3 (nice-to-have):** Como praticante, quero salvar um exercício em favoritos para
  acessá-lo rapidamente depois.

---

## Requisitos Funcionais

### Rotas
- **FR-001:** `app/exercises/page.tsx` — lista de exercícios (Server Component).
- **FR-002:** `app/exercises/[id]/page.tsx` — detalhe do exercício (Server Component).
  Cada `id` é o slug do exercício (ex: `supino-reto`).

### Layout
- **FR-003:** Ambas as rotas reutilizam o layout de dashboard (`app/dashboard/layout.tsx`
  ou um layout compartilhado equivalente). Sidebar, TopHeader e BottomNav seguem o
  mesmo padrão de espaçamento da página de Dashboard.
- **FR-004:** A aba "Exercícios" no menu lateral e no BottomNav deve aparecer ativa
  ao navegar para `/exercises`.

### Página de Lista (`/exercises`)

#### Header
- **FR-005:** Top header desktop: título "Exercícios" + badge com contagem total de
  exercícios (ex: "284") + campo de busca (280px, bg muted, border, rounded-m,
  ícone search, placeholder "Buscar exercício...") + toggle Grid/List (visual apenas).
- **FR-006:** Top bar mobile: título "Exercícios" (estilo igual ao dashboard).

#### Barra de busca + filtros (horizontal, acima dos cards)
O componente de filtros é **horizontal** em todos os breakpoints — diferente do painel
vertical lateral que aparece no Pencil Desktop (`gT93e`). Estrutura:

- **FR-007:** Linha de busca mobile: campo de busca (fill container) + botão filtro
  (bg-primary, ícone `sliders-horizontal`, 38×38).
- **FR-008:** Filtro de músculo — linha horizontal scrollável com chips circulares
  (image 44px + label 9px abaixo). Opções: Todos (ativo por padrão, primary),
  Peito, Costas, Ombros, Bíceps, Tríceps, Pernas, Abdômen, Glúteos.
  Chip ativo: label em `text-primary`, chip inativo: label em `text-muted-foreground`.
- **FR-009:** Filtro de equipamento — linha horizontal com label "Equip." (60px, 11px,
  font-semibold, muted-foreground) + pill chips (rounded-pill): Todos, Barra,
  Halteres, Cabo. Chip ativo: bg-primary, text white. Inativo: bg-muted, border.
- **FR-010:** Filtro de tipo — linha horizontal com label "Tipo" (60px) + pill chips:
  Todos, Força, Cardio. Mesma estilização dos chips de equipamento.
- **FR-011:** Linha de contagem + toggle: texto "N exercícios" (muted, 13px) + botão
  grid toggle (bg-primary, ícone grid-2x2, 28×28, rounded-s).

#### Grid de exercícios
- **FR-012:** Grid de cards responsivo: 2 colunas em mobile/tablet, 3 colunas em
  desktop (lg+).
- **FR-013:** Cada card (`ExerciseCard`) contém:
  - Thumbnail (imagem, 120px de altura, fill width, topo do card, clipped)
  - Botão bookmark (absoluto, topo-esquerdo, 8px offset, 28×28, bg-card, rounded-s,
    ícone `bookmark`, muted-foreground)
  - Info section (padding 8×10, gap 4, vertical):
    - Nome do exercício (13px, font-semibold, foreground)
    - Tag de grupo muscular (pill chip mínimo, 10px, bg-muted, muted-foreground)
    - Tag de equipamento (pill chip mínimo, 10px, bg-muted, muted-foreground)
  - Card: rounded-l, bg-card, border, clip overflow
- **FR-014:** Clicar num card navega para `/exercises/[id]`.

#### Filtros (lógica client-side)
- **FR-015:** Estado de filtro ativo é mantido em `useState` no Client Component
  que envolve a barra de filtros e o grid. Músculos, equipamento e tipo filtram
  a lista mock localmente (sem chamadas de rede).
- **FR-016:** Busca por nome filtra em tempo real (debounce 300ms) sobre a lista mock.

### Página de Detalhe (`/exercises/[id]`)

- **FR-017:** Header: botão voltar (← back, bg-muted, rounded-m, 36×36) + nome do
  exercício (18px, 700) + botão de menu (⋮, bg-muted, 36×36).
- **FR-018:** Área de imagem (220px altura, fill container): imagem estática do
  exercício via `next/image`, clipped. Overlay com gradiente escuro na base (para
  controles futuros).
- **FR-019:** Action Bar: subtítulo "Exercícios de {muscleGroup}" + ação bookmark
  (ícone + contagem "140k") + ação compartilhar (visual apenas).
- **FR-020:** Body Section — duas colunas:
  - Silhueta muscular (180px, esquerda): dois retângulos com placeholder "Frente" e
    "Costas" com texto descritivo dos músculos ativados (simplificado, sem SVG).
  - Detalhes (direita): seções com dados do exercício:
    - Grupo Muscular
    - Equipamento
    - Músculos Primários (lista)
    - Músculos Secundários (lista)
- **FR-021:** CTA absoluto no rodapé: "Adicionar ao Treino" (bg-primary, full-width,
  rounded-m) — desabilitado nesta iteração.

### Mock Data
- **FR-022:** Criar `src/lib/mock/exercises.ts` com array de 12 exercícios cobrindo
  os principais grupos musculares. Cada exercício:
  ```ts
  interface Exercise {
    id: string;          // slug: "supino-reto"
    name: string;        // "Supino Reto"
    muscleGroup: string; // "Peito"
    equipment: string;  // "Barra"
    type: "Força" | "Cardio";
    primaryMuscles: string[];
    secondaryMuscles: string[];
    image: string;       // "/exercises/thumb-supino-reto.jpg"
    bookmarkCount: string; // "140k"
  }
  ```

### Imagens
- **FR-023:** Copiar as imagens de chips de músculo de `docs/UI/images/` para
  `public/exercises/muscles/` com nomes descritivos:

  | Destino | Origem (light) |
  |---------|---------------|
  | `public/exercises/muscles/todos.png` | `docs/UI/images/generated-1780181078355.png` |
  | `public/exercises/muscles/peito.png` | `docs/UI/images/generated-1780181077535.png` |
  | `public/exercises/muscles/costas.png` | `docs/UI/images/generated-1780181076176.png` |
  | `public/exercises/muscles/ombros.png` | `docs/UI/images/generated-1780181082579.png` |
  | `public/exercises/muscles/biceps.png` | `docs/UI/images/generated-1780181073008.png` |
  | `public/exercises/muscles/triceps.png` | `docs/UI/images/generated-1780181069739.png` |
  | `public/exercises/muscles/pernas.png` | `docs/UI/images/generated-1780181077083.png` |
  | `public/exercises/muscles/abdomen.png` | `docs/UI/images/generated-1780181076029.png` |
  | `public/exercises/muscles/gluteos.png` | `docs/UI/images/generated-1780181088174.png` |

- **FR-024:** Thumbnails de exercícios: baixar 12 imagens de exercícios de fitness via
  Unsplash (os mesmos URLs do Pencil são válidos para uso em dev) e salvá-las em
  `public/exercises/thumbs/`.

---

## Critérios de Sucesso

- [ ] `GET /exercises` retorna 200 e renderiza a lista com 12+ cards
- [ ] Filtro de músculo filtra os cards corretamente (client-side)
- [ ] Filtro de equipamento e tipo filtram corretamente
- [ ] Busca por nome funciona com debounce
- [ ] `GET /exercises/supino-reto` retorna 200 e renderiza o detalhe
- [ ] Layout idêntico ao dashboard (sidebar desktop, bottom nav mobile, header h-20)
- [ ] Aba "Exercícios" aparece ativa na sidebar e bottom nav
- [ ] Imagens de chips de músculo carregam de `public/exercises/muscles/`
- [ ] Thumbnails carregam com `next/image` (width/height definidos)
- [ ] `pnpm typecheck` passa em `apps/web`
- [ ] `pnpm lint` passa em `apps/web`

---

## Estrutura de arquivos esperada

```
apps/web/
  src/
    app/
      exercises/
        page.tsx              ← lista (Server Component)
        layout.tsx            ← opcional, ou reutiliza o shared layout
        [id]/
          page.tsx            ← detalhe (Server Component)
    components/
      exercises/
        ExerciseCard.tsx      ← card da lista
        FilterBar.tsx         ← barra de filtros horizontais (Client Component)
        MuscleChip.tsx        ← chip circular de grupo muscular
        ExerciseDetail.tsx    ← conteúdo da página de detalhe
    lib/
      mock/
        exercises.ts          ← tipos + dados mock (12 exercícios)
  public/
    exercises/
      muscles/                ← imagens circulares dos chips (9 imagens)
      thumbs/                 ← thumbnails dos exercícios (12 imagens)
```

---

## Fora do Escopo

- Integração com API ou banco de dados
- Paginação real ou scroll infinito (12 cards mock são suficientes)
- Silhueta SVG interativa com músculos destacados
- Função real de bookmark ou compartilhamento
- Botão "Adicionar ao Treino" funcional
- Página de detalhe desktop (apenas mobile no Pencil)

---

## Riscos e Premissas

- **Premissa:** O layout de dashboard existente em `app/dashboard/layout.tsx` pode ser
  extraído para um layout compartilhado (`app/(authenticated)/layout.tsx`) ou a rota
  `/exercises` pode usar o mesmo layout via Group Route.
- **Risco:** As imagens de Unsplash nos cards podem exigir configuração de `domains`
  no `next.config.ts` para `next/image`.
  → Mitigação: adicionar `images.remotePatterns` para `images.unsplash.com`.
- **Premissa:** Os filtros são puramente client-side com dados mock — sem chamadas de
  rede nesta iteração.
- **Risco:** O componente `FilterBar` é `"use client"` mas os cards são Server
  Components — garantir que a separação de boundary RSC/Client seja respeitada.
  → Mitigação: `FilterBar` recebe a lista completa de exercícios como prop e filtra
  internamente, retornando os cards filtrados.

---

<!-- 
GATE DE APROVAÇÃO
Para desbloquear a criação do plano técnico, altere o Status acima de "draft" para "approved".
O agente planner NÃO deve criar tasks de implementação enquanto Status for "draft".
-->
