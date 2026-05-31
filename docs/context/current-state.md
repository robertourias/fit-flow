# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-05-31
**Resumo da última sessão:** Implementação das páginas de Exercícios (`/exercises` lista e `/exercises/[id]` detalhe) + refactor de layout para Route Group `(app)` com `usePathname`.

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

---

## Decisões desta sessão

- **Route Group `(app)`** — layout compartilhado com `usePathname()` para detecção de rota ativa; elimina duplicação para futuras páginas
- **NavContent e BottomNav usam `<Link>`** para rotas com páginas, `<button>` para itens sem rota ainda
- **Unsplash `remotePatterns`** adicionado ao `next.config.ts`
- **FilterBar horizontal** em todos os breakpoints (diferente do painel vertical do Pencil desktop)

---

## Próximos passos

1. Conectar dashboard e exercícios a dados reais via API (`apps/api`)
2. Implementar autenticação (NextAuth) e rota guard na `(app)/layout.tsx`
3. Substituir `useState` no `(app)/layout.tsx` por store Zustand quando necessário
4. Implementar páginas: Progresso, Explorar, Personal

---

## Bloqueadores / Perguntas abertas

- Supabase local não está no Docker Compose — variáveis `SUPABASE_*` apontam para instância cloud
- Recharts no headless Chrome screenshots mostra barras apenas com `--virtual-time-budget`; funciona normalmente em browser real
