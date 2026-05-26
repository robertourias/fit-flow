# Conventions

> Decisões específicas de padrão deste projeto. Naming básico (PascalCase para tipos, camelCase para variáveis, snake_case para DB) segue os defaults da comunidade TypeScript/React/SQL — aqui ficam apenas desvios e decisões explícitas.

## Arquivos & Diretórios

```
kebab-case/          diretórios e a maioria dos arquivos
PascalCase.tsx       componentes React
kebab-case.spec.ts   testes backend
PascalCase.test.tsx  testes frontend
```

## TypeScript — decisões do projeto

- `IPrefix` para interfaces — **somente na camada de domínio** (ex: `IUsersRepository`). Nunca em application layer ou frontend.
- `_prefixPrivate` para campos privados de classe no backend (onde `#private` quebra injeção de dependência).
- Named exports preferred — default exports apenas para pages e layouts do Next.js.
- Evite `as` para type casting — use type predicates para narrowing em runtime.

## Ordem de imports

```ts
// 1. Node built-ins
// 2. Pacotes externos
// 3. Pacotes internos do monorepo (@packages/*)
// 4. Imports absolutos da aplicação (@/)
// 5. Imports relativos
```

## API Endpoints

```
/resources           plural nouns para coleções
/resources/:id       recurso único
/resources/:id/sub   recursos aninhados
kebab-case           paths com múltiplas palavras (/user-profiles)
```

## Git & PRs

- Branches: `feat/` `fix/` `chore/` `refactor/` `docs/`
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`)
- PRs: manter abaixo de 400 linhas — features grandes viram PRs sequenciais

### Protocolo pré-commit (obrigatório)

Antes de qualquer commit, sempre nesta ordem:

1. **Atualizar `docs/context/current-state.md`** — refletir o que foi feito, o que está em progresso, próximos passos
2. **Atualizar `docs/changelog/YYYY-MM-DD.md`** — adicionar entrada com o que está sendo commitado
3. **Incluir ambos no commit** junto com os demais arquivos

Não pule este protocolo mesmo para commits pequenos ou de chore.
Use `/commit` para executar o protocolo completo com auxílio do agente.

## Comentários

- Comente o **POR QUÊ**, não o QUÊ — o código mostra o quê; comentários explicam restrições ocultas e regras de negócio não-óbvias.
- TSDoc apenas para APIs públicas de pacotes compartilhados.

## Linting

- ESLint: configurado em `packages/config/eslint`
- Prettier + Husky + lint-staged rodam no commit
- CI bloqueia merge se lint ou type-check falhar
- Nunca desabilite regras de ESLint sem comentário explicando o motivo

## Glossário de Domínio

> Termos específicos do FitFlow. Use exatamente estes nomes em código, variáveis, tabelas e comunicação.

| Term | Definition |
|------|-----------|
| Rotina | Conjunto de treinos semanais |
| Estratégia | Divisão muscular (ABC, Upper/Lower, etc.) |
| Preparador | Treinador/treinadora ou professor/professora — nunca "personal" no código |
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
