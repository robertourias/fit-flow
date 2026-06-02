# Spec: Página de Detalhe e Execução de Treino

**Status:** approved
**Data:** 2026-06-01
**Autor:** planner-agent

---

## Problema

Não existe página de detalhe de treino no FitFlow. Ao selecionar um treino na lista do programa, o usuário não tem destino. A feature central do produto — acompanhar o treino série a série, registrar cargas e evoluir — ainda não existe. Sem ela, o produto não cumpre seu propósito principal.

---

## Fluxo Principal

```
Programa de Treino → [card de treino] → Treino Detalhe (edição/visualização)
                                               ↓ [Iniciar]
                                        Iniciar Treino (preview)
                                               ↓ [Iniciar Treino]
                                        Treino em Progresso
                                               ↓ [Finalizar]
                                        Finalizar Treino → Salvar → Dashboard
```

---

## Cenários de Usuário

- **P1 (crítico):** Como praticante, quero ver os exercícios de um treino com séries e repetições planejadas, para entender o que farei antes de começar.
- **P1 (crítico):** Como praticante, quero iniciar um treino e registrar carga e repetições a cada série concluída, para acompanhar minha evolução.
- **P1 (crítico):** Como praticante, quero ver um contador de descanso após cada série concluída, para respeitar o intervalo planejado.
- **P2 (importante):** Como praticante, quero ver a data e cargas da última execução antes de iniciar, para dar continuidade à progressão.
- **P2 (importante):** Como praticante, quero editar o treino — adicionar/remover séries e exercícios, reordenar — para personalizar o plano.
- **P2 (importante):** Como praticante, quero salvar o treino finalizado com notas e dificuldade, para deixar contexto para sessões futuras.
- **P3 (nice-to-have):** Como praticante, quero integrar o treino finalizado com Strava e Health Connect, para consolidar meus dados de saúde.

---

## Requisitos Funcionais

### Tela 1 — Treino Detalhe (`/workout/[id]`)

- **FR-001:** Ao selecionar um card de treino no programa, o usuário navega para `/workout/[id]`.
- **FR-002:** O cabeçalho exibe nome do treino, botão "Salvar" e menu de opções (`...`).
- **FR-003:** Cada exercício exibe: thumbnail, nome, grupo muscular, total de séries e repetições planejadas.
- **FR-004:** Ao expandir um exercício, o usuário vê:
  - Campo de nota livre ("Adicionar nota...")
  - Tempo de descanso configurável ("Descanso: Xmin Xs")
  - Tabela de séries: **Set | Carga | Repetições | RM** — campos editáveis
  - Botão "+ Adicionar série"
- **FR-005:** O usuário pode remover uma série individualmente.
- **FR-006:** O usuário pode reordenar exercícios via drag-and-drop (handle lateral).
- **FR-007:** Botão "+ Adicionar exercício" no rodapé abre seleção da biblioteca de exercícios.
- **FR-008:** Botão "Salvar" persiste as alterações no treino.
- **FR-009 (desktop only):** Painel direito (320px) exibe sugestões de exercícios pelo grupo muscular principal do treino, com thumbnail, nome e músculos envolvidos.
- **FR-010:** Desktop usa layout 3 colunas: Sidebar | Conteúdo Central | Painel de Sugestões.
- **FR-011:** Botão "Iniciar" (ou acesso via header) navega para a tela Iniciar Treino.

### Tela 2 — Iniciar Treino (preview pré-execução)

- **FR-012:** Exibe: data da última execução + horário, total de séries e duração estimada do treino.
- **FR-013:** Lista todos os exercícios do treino com: thumbnail, nome, número de séries, repetições e carga anterior (ex: "3 Séries · 12 reps · 50kg").
- **FR-014:** Botão fixo no rodapé: "Iniciar Treino" — inicia sessão ativa e navega para Treino em Progresso.

### Tela 3 — Treino em Progresso

- **FR-015:** Barra superior exibe: botão recolher, timer total do treino em andamento (`⏱ MM:SS`) e botão "Finalizar".
- **FR-016:** Barra de progresso horizontal indica % de séries concluídas no total do treino.
- **FR-017:** Bloco do exercício atual exibe:
  - Nome do exercício e grupo muscular
  - Campo de nota livre
  - Tempo de descanso configurado ("⏱ Descanso: Xmin Xs")
  - Tabela de séries: **Série | Anterior | Kg | Reps | ✓**
    - Coluna "Anterior": carga × reps da última sessão (referência, somente leitura)
    - Coluna "Kg" e "Reps": editáveis pelo usuário
    - Coluna "✓": checkbox — ao marcar, série é concluída e contador de descanso inicia
  - Botão "+ Adicionar série"
- **FR-018:** Séries concluídas exibem checkmark verde; série pendente exibe checkbox.
- **FR-019:** Ao concluir uma série, contador de descanso inicia automaticamente com o tempo configurado no exercício.
- **FR-020:** Preview do próximo exercício aparece no rodapé ("A seguir: [nome] · X séries × Y reps").
- **FR-021:** Botão "Finalizar" acessa a tela Finalizar Treino.

### Tela 4 — Finalizar Treino

- **FR-022:** Campo de texto livre para comentário sobre o treino ("Como foi?").
- **FR-023:** Opção de adicionar fotos/vídeos à sessão.
- **FR-024:** Campos colapsáveis/editáveis: data e hora de encerramento, duração total, tipo de treino (ex: "Musculação"), dificuldade percebida.
- **FR-025:** Toggle "Atualizar valores da rotina" — quando ativo, os valores de carga/reps registrados na sessão substituem os valores planejados do treino como nova referência.
- **FR-026:** Seção "Integrações" com toggles: "Postar no Strava", "Postar no Health Connect" (UI presente; ação não funcional nesta iteração).
- **FR-027:** Botão "Salvar" persiste o registro da sessão e redireciona para o programa.

---

## Critérios de Sucesso

- [ ] Clicar em um card de treino navega para `/workout/[id]` com lista de exercícios e séries
- [ ] Usuário consegue adicionar/remover série em um exercício e salvar
- [ ] Usuário consegue reordenar exercícios via drag-and-drop
- [ ] Clicar "Iniciar" exibe tela de preview com última execução e stats
- [ ] Clicar "Iniciar Treino" inicia timer e exibe exercício ativo com tabela de séries
- [ ] Marcar série como concluída inicia contador de descanso
- [ ] Coluna "Anterior" exibe a última carga/reps usada no exercício
- [ ] Ao finalizar e salvar, o registro da sessão é persistido
- [ ] Desktop exibe layout 3 colunas; mobile exibe layout coluna única com bottom nav

---

## Fora do Escopo

- Integração funcional com Strava ou Health Connect (UI presente, sem implementação real)
- Notificações push para intervalos de descanso
- Compartilhamento em redes sociais
- Vídeo de demonstração dos exercícios inline na tela de execução
- Histórico completo de sessões anteriores (apenas a última execução como referência)
- Backend endpoint para persistência (esta iteração usa mock data; API a ser definida em spec separada)

---

## Riscos e Premissas

- **Premissa:** Rota `/workout/[id]` e estrutura de sessão não existem — serão criadas do zero.
- **Premissa:** Dados de exercícios já disponíveis via mock (reutilizados da tela de Exercícios).
- **Premissa:** Esta spec cobre apenas o frontend com dados mock; backend é escopo de spec separada.
- **Risco:** Timer de descanso pode ser perdido se o usuário sair do app (mobile background) → Mitigação: persistir timestamp de início no `localStorage` e reconstituir ao retornar.
- **Risco:** Conflito entre dados planejados e executados ao editar séries durante treino ativo → Mitigação: separar `PlannedSet` e `ExecutedSet` como tipos distintos no domínio desde o início.
- **Risco:** Drag-and-drop em mobile pode conflitar com scroll → Mitigação: usar biblioteca com suporte touch nativo (ex: `@dnd-kit`).

---

<!-- 
GATE DE APROVAÇÃO
Para desbloquear a criação do plano técnico, altere o Status acima de "draft" para "approved".
O agente planner NÃO deve criar tasks de implementação enquanto Status for "draft".
-->
