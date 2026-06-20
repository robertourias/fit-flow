# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.
> Não edite manualmente durante uma sessão ativa — use `/checkpoint` antes de fechar.

**Última atualização:** 2026-06-20
**Resumo de progresso global:** Fases 0-3 e TASK09-TASK19 concluídas. App cobre dashboard, biblioteca de exercícios, CRUD de programas/estratégias/rotinas/treinos, limites do plano gratuito, execução real de treino, histórico de sessões, dashboards de progresso, medidas corporais, explorar/importar templates, compartilhamento de treino/progresso, o bounded context Coaching (TASK17), e agora hardening de release (TASK19): CI/CD completo (`ci.yml`/`deploy.yml`), gate de cobertura anti-regressão, observabilidade (Pino/Sentry/Prometheus) e entrypoint Docker que falha alto em migration quebrada — produto pronto para o primeiro deploy manual (Vercel + Railway), ainda não executado (decisão do usuário: manual, fora desta spec).
**Resumo da última sessão:** TASK19 (Hardening & Release) implementada em 4 ondas (T1,T2,T5 → T3,T4 → T6 → T7): baselines de cobertura travados como ratchet anti-regressão em `apps/api`/`apps/web` (T1/T2), Dockerfile da API corrigido para propagar falha de `prisma migrate deploy` via `|| exit 1` antes do `exec node dist/main.js` (T5), Pino + Sentry condicional + `GET /metrics` no backend e Sentry condicional no frontend (T3/T4), `.github/workflows/ci.yml` (lint/typecheck/test+coverage/build em todo PR/push) e `.github/workflows/deploy.yml` (Vercel + Railway, skip limpo sem secrets) (T6), e documentação do runbook de deploy em `docs/architecture/infra.md` + este checkpoint (T7). Spec 100% concluída (T1-T7), backlog TASK19 → `done`.

---

## Feature em andamento

**Spec ativo:** (nenhum) — `docs/specs/2026-06-19-task19-hardening-release.md` concluído (T1-T7, todos os critérios `[x]`), backlog atualizado para `done`.

---

## Tasks (Foco no Presente)

### 🔄 Em progresso

(nenhum) — TASK17 concluída e commitada.

### ⏭ Próximos passos imediatos

1. Executar o primeiro deploy manual real (Vercel + Railway) seguindo o passo a passo em `docs/architecture/infra.md` § CI/CD — fora do escopo da TASK19 (decisão do usuário), mas é o próximo bloqueador para produção real.
2. Seed script para `exercises`/`muscle_groups`/`equipment` (catálogo vazio em dev — carry-over de sessões anteriores).
3. Abrir PR para branch `feat/task11-execucao-treino` (acumula TASK11-TASK19, ainda não mergeada).
4. Trabalho futuro incremental fora desta spec: subir os baselines de cobertura (T1/T2) em direção às metas de `docs/context/decisions.md` (90/80/60 backend, 70/90/100 frontend); upgrade do `next-auth` de `5.0.0-beta.29` para versão estável, quando existir (débito técnico registrado, não tratado na TASK19 por risco de quebra de auth).

---

## Decisões desta sessão

- Isolamento de dados Coaching: preparador sem vínculo `ACTIVE` recebe `404` (não `403`) nos 3 endpoints de aluno — evita confirmar a existência do recurso a quem não tem acesso (consistente com `docs/context/domains/auth.md`).
- `CreateStudentStrategyUseCase`/`CreateStudentWorkoutUseCase`/`GetStudentDashboardUseCase` reaproveitam 100% a lógica de Training via injeção do use-case original (não duplicam regra de limite FREE nem validações), passando `tenantId = studentId`.
- Toggle `isTrainer` no `ProfilePageClient` persiste via Server Action + Prisma local de `apps/web` (mesmo padrão dos demais campos do form), não via `PATCH /users/me` do NestJS diretamente — segue arquitetura já estabelecida na tela.
- Tabs em `/students` e `StudentDetailSheet` usam `role="tablist"/"tab"` simples (sem componente shadcn Tabs, que não existe no repo) e `<select>` nativo no formulário simplificado de rotina (evita Radix `Select` em testes).
- Baseline de cobertura backend (TASK19/T1): 89.89% statements / 65.39% branches / 80.07% functions / 90.74% lines. `coverageThreshold` em `apps/api/jest.config.js` travado em 88/63/78/89 (ratchet anti-regressão, margem de ~2pp). `UpdateBodyMeasurementUseCase` estava sem teste algum — adicionado em `body-measurement.use-cases.spec.ts`.
- Baseline de cobertura frontend (TASK19/T2): 88.1% statements / 74.44% branches / 84.05% functions / 90.25% lines (após teste novo; nenhum arquivo a 0%). `coverageThreshold` em `apps/web/jest.config.js` travado em 86/72/82/88. `useExercises` (`src/lib/api/hooks/use-exercises.ts`) estava a 16.7% statements — adicionado `use-exercises.test.tsx` (agora 100%).
- **Débito "migrations automáticas no Docker" resolvido (TASK19/T5):** `apps/api/Dockerfile` trocou `[ "$SKIP_MIGRATIONS" != "1" ] && prisma migrate deploy; node dist/main.js` (erro de migration ignorado via `;`) por `CMD ["sh", "-c", "if [ \"$SKIP_MIGRATIONS\" != \"1\" ]; then prisma migrate deploy || exit 1; fi; exec node dist/main.js"]` — falha de migration agora propaga exit code != 0 e o processo Node nunca inicia. `SKIP_MIGRATIONS=1` continua pulando migrations como antes. Validado localmente (build + run com migration válida/inválida/skip).
- CI/CD (TASK19/T6) deixou de ser "a definir": `.github/workflows/ci.yml` (lint/typecheck/test+coverage/build em todo PR/push) e `.github/workflows/deploy.yml` (Vercel + Railway via `workflow_dispatch`/push em `main`, skip limpo sem secrets) existem e estão documentados em `docs/architecture/infra.md` § CI/CD, incluindo a lista de secrets e o passo a passo do primeiro deploy manual. Primeiro deploy real ainda não foi executado (decisão do usuário, fora do escopo da TASK19).

---

## Bloqueadores / Perguntas abertas

- (nenhum)
