# Product Context

> **Purpose**: Help AI agents understand the product domain, user needs, and business rules. Update this as the product evolves.

## Product Overview

**Product name**: FitFlow
**Tagline**: Webapp para acompanhamento e orientação de rotinas e estratégia de treino
**Stage**: Ideia

FitFlow é um webapp voltado para praticantes de musculação que desejam organizar, acompanhar e evoluir seus treinos. A plataforma permite cadastrar estratégias e rotinas de treino, visualizar progresso e, futuramente, conectar alunos a preparadores físicos.

## Target Users

### Primary User
- **Who**: Praticante de musculação
- **Goal**: Organizar e acompanhar suas rotinas e estratégias de treino
- **Pain point**: Falta de uma ferramenta centralizada para planejar treinos, monitorar progresso e receber orientação
- **Technical level**: Não-técnico

### Secondary User
- **Who**: Preparador (treinador/treinadora ou professor/professora)
- **Goal**: Gerenciar e acompanhar os treinos dos alunos, oferecer orientação personalizada

## Core Features

| Feature | Description | Status |
|---------|-------------|--------|
| Rotina de treino | Cadastro da estratégia de treino e do treino com seleção de exercícios | Planejado |
| Progresso | Visualização de progresso: volume, duração, dias de treino no mês, músculos trabalhados na semana e heatmap | Planejado |
| Exercícios | Visualização dos exercícios por grupo muscular | Planejado |
| Compartilhamento | Gerador de informativo para compartilhamento em redes sociais | Planejado |
| Notificações | Informativos, lembretes e avisos durante o treino (intervalos e tempo) | Planejado |
| Explorar | Área para explorar estratégias de treinos pré-criadas | Planejado |
| Alunos | Área para preparador gerenciar e acompanhar treinos dos alunos | Planejado |
| Personal | Área de comunicação e visualização de orientação do preparador | Planejado |

## Business Rules

> Critical business logic that AI agents must never violate. These are non-negotiable constraints.

- **Isolamento de dados**: Preparador só acessa dados dos próprios alunos — nunca de alunos vinculados a outros preparadores
- **Limite do plano gratuito**: Máximo de 6 treinos criados na versão gratuita — não permitir criação além desse limite sem upgrade
- **Moderação de conteúdo**: Não permitir linguagem imprópria na comunicação entre preparador e aluno
- **Autenticação obrigatória**: Acesso a todas as telas somente em ambiente autenticado — nenhuma tela de conteúdo é acessível sem login

## Domain Glossary

> Use these terms consistently in code, documentation, and conversations.

| Term | Definition |
|------|-----------|
| Rotina | Conjunto de treinos semanais |
| Estratégia | Divisão muscular (ABC, Upper/Lower, etc.) |
| Preparador | Treinador/treinadora ou professor/professora |
| Split | Divisão de treino |
| Full Body | Treino de corpo inteiro |
| Upper/Lower | Divisão superior/inferior |
| Push/Pull/Legs (PPL) | Empurrar/puxar/pernas |
| Periodização | Planejamento progressivo do treino |
| Repetição (Rep) | Uma execução do movimento |
| Série (Set) | Conjunto de repetições |
| Carga | Peso utilizado |
| Falha muscular | Incapacidade de completar outra repetição |
| RM (Repetition Maximum) | Repetição máxima |
| Volume de treino | Quantidade total de trabalho realizado |
| Intensidade | Nível de esforço/carga |
| Cadência/Tempo | Velocidade de execução do movimento |
| Drop set | Reduzir carga sem descanso entre séries |
| Bi-set / Superset | Dois exercícios consecutivos sem descanso |
| Rest-pause | Pausa curta dentro da série para continuar |
| Pirâmide | Progressão ou regressão de carga ao longo das séries |
| Isometria | Contração estática (sem movimento) |
| Ativação muscular | Recrutamento do músculo alvo no início do exercício |

## User Journeys

### Journey 1: Primeiro treino
```
1. Usuário se cadastra e faz login
2. Escolhe ou cria uma estratégia de treino
3. Monta uma rotina semanal com seus treinos
4. Seleciona os exercícios de cada treino
5. Executa o treino e registra séries, cargas e repetições
6. Visualiza o progresso ao final
```

### Journey 2: Acompanhamento com preparador
```
1. Usuário se cadastra e vincula a um preparador
2. Preparador cria e atribui a rotina ao aluno
3. Aluno executa os treinos e registra o progresso
4. Preparador acompanha evolução e envia orientações
5. Aluno visualiza as orientações na área Personal
```

## Metrics & Success Criteria

<!-- a definir -->
- **Primary metric**: <!-- a definir -->
- **Secondary metrics**: <!-- a definir -->
- **Current targets**: <!-- a definir -->

## Out of Scope

- Planos de dieta ou nutrição
- Integração com wearables (por enquanto)
- Marketplace de preparadores

## Competitive Context

<!-- a definir -->
- **Similar products**: <!-- a definir -->
- **Our differentiation**: <!-- a definir -->

## Roadmap (High Level)

<!-- a definir -->
