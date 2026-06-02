# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-06-01
**Resumo da última sessão:** Implementação completa do fluxo de detalhe e execução de treino (T-1 a T-9): mock data, Zustand store, 4 rotas, 4 componentes de página e conversão dos cards de biblioteca para `Link`.

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

### Biblioteca (`/library`) — concluído
- ProgramHeader, WorkoutCard (grid 2/3-col), WorkoutListRow, ViewToggle, LibraryPanel
- 1 programa ABC DEF com 6 treinos e 8 templates mock
- Cards de treino agora são `Link` → `/workout/[id]`

### Detalhe e Execução de Treino — concluído
**Spec:** `docs/specs/2026-06-01-workout-detail.md`
**Plano:** `docs/plans/2026-06-01-workout-detail.md`

- `/workout/[id]` — WorkoutDetailPage: lista colapsável de exercícios, drag-and-drop (@dnd-kit), tabela de séries editável, SuggestionsPanel desktop
- `/workout/[id]/start` — WorkoutStartPreview: última execução, stats, lista de exercícios, CTA para iniciar
- `/workout/[id]/session` — WorkoutActiveSession: timer (sobrevive refresh), progress bar, tabela Série/Anterior/Kg/Reps/✓, rest countdown, next exercise preview
- `/workout/[id]/finish` — WorkoutFinishForm: textarea "Como foi?", dificuldade por estrelas, accordion de detalhes, toggle "Atualizar rotina", integrações UI-only, CTA Salvar
- Store: `workout-session.store.ts` (Zustand + localStorage persist) com `startSession`, `completeSet`, `setRestTimer`, `clearRest`, `beginFinishing`, `resetSession`
- Mock: `lib/mock/workout.ts` — 6 treinos completos + `mockLastSessions`

---

## Tasks

### ✅ Concluídas (sessão 2026-06-01)
- [web] T-1: Instalar zustand + @dnd-kit/core/sortable/utilities em apps/web
- [web] T-2: Mock data de treino (`lib/mock/workout.ts`) — 6 treinos, tipos, mockLastSessions
- [web] T-3: Workout session store Zustand com persist no localStorage
- [web] T-4: Rotas `/workout/[id]`, `/start`, `/session`, `/finish` + layout AppShell
- [web] T-5: WorkoutCard e WorkoutListRow convertidos para next/link
- [web] T-6: WorkoutDetailPage com drag-and-drop e SuggestionsPanel
- [web] T-7: WorkoutStartPreview com stats e CTA
- [web] T-8: WorkoutActiveSession com timer, rest countdown, tabela de séries
- [web] T-9: WorkoutFinishForm com accordion, toggles, dificuldade e CTA Salvar

### 🔄 Em progresso
- (nenhuma — todas as tasks do plano ativo foram concluídas)

### ⏭ Próximos passos
1. Fazer commit das mudanças pendentes (mensagem gerada na sessão)
2. Conectar fluxo de treino a dados reais via API (`apps/api`) — requer spec de backend
3. Implementar autenticação (NextAuth) e route guard nos layouts protegidos
4. Implementar páginas: Progresso (`/progress`), Explorar (`/explore`), Personal (`/personal`)
5. Criar spec de backend para persistência de sessões de treino

---

## Decisões desta sessão

- **Hooks inline no componente** — `useElapsedSeconds` e `useRestCountdown` ficaram no mesmo arquivo de `WorkoutActiveSession` (não em arquivos separados) por serem específicos e pequenos; extrair apenas se reutilizados
- **`endedAt` via `useRef`** no `WorkoutFinishForm` — captura o timestamp de encerramento uma única vez no mount, evitando drift enquanto usuário preenche o formulário
- **Rota `(detail)` como route group** — apenas a página de detalhe recebe `AppShell`; as telas de sessão (`/start`, `/session`, `/finish`) são fullscreen sem navegação
- **Toggle nativo** (sem shadcn) — componente `Toggle` simples com `role="switch"` e `aria-checked`, consistente com o padrão do projeto de não instalar shadcn/ui ainda

---

## Bloqueadores / Perguntas abertas

- Supabase local não está no Docker Compose — variáveis `SUPABASE_*` apontam para instância cloud
- Backend (`apps/api`) ainda não tem endpoints para treinos — persistência de sessão depende de spec dedicada
- Não existe rota `/program/[programId]` ainda — `WorkoutFinishForm` redireciona para ela mas a página não existe
