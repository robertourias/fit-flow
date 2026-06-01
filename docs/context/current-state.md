# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-05-31
**Resumo da última sessão:** Página Biblioteca (`/library`) + refactor de layout para estrutura flat (AppShell) + migração das rotas para fora do Route Group `(app)`.

---

## Features implementadas

### Dashboard (`/dashboard`) — concluído
- Shell de navegação: Sidebar, TopBar, TopHeader, BottomNav
- Métricas, TreinoCard, ProgressChart (Recharts), CalendarSection, UpcomingCard, MuscleCard
- Layouts responsivos: mobile / tablet / desktop

### Exercícios (`/exercises`, `/exercises/[id]`) — concluído
- Lista: FilterBar horizontal (busca + muscle chips circulares + equipamento + tipo)
- Grid 2-col mobile / 3-col desktop com ExerciseCard
- Detalhe: imagem 220px + action bar + silhueta + detalhes + CTA
- 12 exercícios mock cobrindo 7 grupos musculares
- Imagens de muscle chips em `public/exercises/muscles/` (9 arquivos)

### Biblioteca (`/library`) — concluído
- ProgramHeader: imagem + nome + tags (pill chips) + botão mais opções
- WorkoutCard: grade 2-col mobile / 3-col desktop com imagem, nome, contagem de exercícios
- WorkoutListRow: view lista com thumbnail, nome, contagem, ícone ellipsis
- ViewToggle: alterna grade ↔ lista (Client Component)
- LibraryPanel: painel direito desktop com lista de templates (hidden lg:flex)
- LibraryClientPage: gerencia estado de visualização
- Mock: 1 programa ABC DEF com 6 treinos e 8 templates

---

## Decisões desta sessão

- **Estrutura flat** — Route Group `(app)` substituído por layouts individuais que importam `AppShell.tsx`; elimina o agrupamento visível no editor sem perder o shell compartilhado
- **AppShell** em `src/components/layout/AppShell.tsx` — extrai shell (Sidebar + TopBar + BottomNav + TopHeader) para componente reutilizável; cada rota tem seu próprio `layout.tsx` que wrapa `AppShell`
- **NavContent e BottomNav usam `<Link>`** para rotas com páginas, `<button>` para itens sem rota ainda
- **Unsplash `remotePatterns`** adicionado ao `next.config.ts`
- **FilterBar horizontal** em todos os breakpoints

---

## Próximos passos

1. Conectar dashboard e exercícios a dados reais via API (`apps/api`)
2. Implementar autenticação (NextAuth) e rota guard nos layouts de rota
3. Substituir `useState` no `AppShell` / layouts por store Zustand quando necessário
4. Implementar páginas: Progresso, Explorar, Personal

---

## Bloqueadores / Perguntas abertas

- Supabase local não está no Docker Compose — variáveis `SUPABASE_*` apontam para instância cloud
- Recharts no headless Chrome screenshots mostra barras apenas com `--virtual-time-budget`; funciona normalmente em browser real
