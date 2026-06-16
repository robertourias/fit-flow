# Spec & Plan: TASK14 — Medidas Corporais

**Status:** approved
**Data:** 2026-06-16
**Autor:** Claude (Planner)

---

## 1. Problema e Visão Geral

Não existe forma de registrar peso, medidas corporais (circunferências) e dados de bioimpedância. O usuário não consegue acompanhar evolução corporal ao longo do tempo — apenas progresso de treino (TASK13). TASK14 adiciona o módulo `measurements` (novo bounded context), com CRUD completo, retenção de 60 dias para o plano FREE e página dedicada `/measurements`.

O schema Prisma vive em `packages/db/prisma/schema.prisma`. O módulo NestJS seguirá o padrão de `TrainingModule` (clean architecture, repositório injetado via token). O frontend segue o padrão de `/history` + dialog de criação.

---

## 2. Cenários de Usuário

- **P1 (crítico):** Como usuário, quero registrar meu peso e medidas na data de hoje, para acompanhar minha evolução física.
- **P1 (crítico):** Como usuário, quero ver o histórico dos meus registros (mais recente primeiro), para comparar minha evolução ao longo das semanas.
- **P2 (importante):** Como usuário, quero editar ou deletar um registro incorreto.
- **P2 (importante):** Como usuário do plano gratuito, quero ser avisado que vejo apenas 60 dias de histórico.
- **P3 (nice-to-have, fora de escopo):** Gráfico de evolução de peso/medidas ao longo do tempo.

---

## 3. Requisitos Funcionais

- **FR-001:** Novo model Prisma `BodyMeasurement` em `packages/db/prisma/schema.prisma` — campos: `id`, `tenantId`, `measuredAt` (DateTime, user-provided), `weight` (Decimal?), circunferências `neck`/`chest`/`waist`/`hip`/`leftArm`/`rightArm`/`leftThigh`/`rightThigh`/`calf` (Decimal?), bioimpedância `bodyFatPct`/`muscleMassPct` (Decimal?)/`visceralFat` (Int?), `notes` (String?), `createdAt`/`updatedAt`. Relação `User.bodyMeasurements`. Índice `(tenantId, measuredAt)`. Tabela `@@map("body_measurements")`.
- **FR-002:** Migration via `prisma migrate dev` (nome sugerido: `add_body_measurements`).
- **FR-003:** Entidade de domínio `BodyMeasurement` em `apps/api/src/measurements/domain/body-measurement.entity.ts` (classe TypeScript pura, zero imports NestJS). Interface repositório `IBodyMeasurementsRepository` com métodos: `findById(id)`, `findManyByTenant({ tenantId, take, cursor, skip, measuredAfter? })`, `count({ tenantId, measuredAfter? })`, `create(entity)`, `update(id, entity)`, `delete(id)`.
- **FR-004:** `PrismaBodyMeasurementsRepository` em `apps/api/src/measurements/infra/`. Mapeia todos os campos; `Decimal` do Prisma → `number` (`.toNumber()`). `findManyByTenant` ordena por `measuredAt desc, id desc`.
- **FR-005:** 5 use cases em `apps/api/src/measurements/application/use-cases/`:
  - `ListBodyMeasurementsUseCase`: injeta `BODY_MEASUREMENTS_REPOSITORY` e `USERS_REPOSITORY` (para plano); aplica retenção de 60 dias se `user.isFreePlan()`; retorna `PaginatedResponse<BodyMeasurementDto>`.
  - `GetBodyMeasurementUseCase`: busca por id, valida ownership (`entity.tenantId !== tenantId` → `NotFoundException`).
  - `CreateBodyMeasurementUseCase`: cria entidade, persiste. Ao menos um campo de medição deve ser não-nulo (validação via `class-validator` no DTO).
  - `UpdateBodyMeasurementUseCase`: valida ownership, atualiza campos fornecidos.
  - `DeleteBodyMeasurementUseCase`: valida ownership, deleta.
- **FR-006:** DTOs em `apps/api/src/measurements/application/dto/body-measurement.dto.ts`: `BodyMeasurementDto` (resposta), `CreateBodyMeasurementDto` (input — `measuredAt: IsDateString`, campos numéricos com `@IsOptional @IsNumber @Min(x) @Max(y)`, decorador `@AtLeastOneField` custom ou validação no use case), `UpdateBodyMeasurementDto` (todos opcionais).
- **FR-007:** `@fitflow/types` — espelha `BodyMeasurementDto`, `CreateBodyMeasurementDto`, `UpdateBodyMeasurementDto` em `packages/types/src/index.ts`. Rebuild obrigatório após mudança.
- **FR-008:** `MeasurementsController` em `apps/api/src/measurements/presentation/measurements.controller.ts`: `POST /body-measurements` (201), `GET /body-measurements` (200, paginated), `GET /body-measurements/:id` (200), `PATCH /body-measurements/:id` (200), `DELETE /body-measurements/:id` (204). Todos protegidos por `JwtAuthGuard`. Decorators Swagger completos.
- **FR-009:** `MeasurementsModule` registra token `BODY_MEASUREMENTS_REPOSITORY`, use cases e controller; importa `IdentityModule`. Registrado em `AppModule`.
- **FR-010:** Navegação — `nav-content.tsx` ganha item "Medidas" (ícone `Ruler`, lucide) em `extraNavItems`, `href: "/measurements"`. `AppShell.tsx`: `getActiveItem` mapeia `/measurements` → `"medidas"`; `sectionTitles.medidas = "Medidas"`. Novo `apps/web/src/app/measurements/layout.tsx` (padrão `history/layout.tsx`).
- **FR-011:** Hooks em `apps/web/src/lib/api/hooks/`:
  - `useBodyMeasurements()` — `useInfiniteQuery`, `GET /body-measurements?limit=20[&cursor=]`.
  - `useBodyMeasurement(id)` — `useQuery`, `GET /body-measurements/:id`, `enabled: !!id`.
  - `useCreateBodyMeasurement()` — `useMutation`, `POST /body-measurements`, invalida `["body-measurements"]` on success.
  - `useUpdateBodyMeasurement()` — `useMutation`, `PATCH /body-measurements/:id`, invalida `["body-measurements"]` e `["body-measurement", id]`.
  - `useDeleteBodyMeasurement()` — `useMutation`, `DELETE /body-measurements/:id`, invalida `["body-measurements"]`.
- **FR-012:** `/measurements` — Server Component vazio (apenas layout) que renderiza `MeasurementsPage` (`"use client"`). `MeasurementsPage` usa `useBodyMeasurements()` e `useUserMe()`:
  - Banner FREE 60 dias no topo (padrão `/history`).
  - Botão "Novo registro" (abre `MeasurementFormDialog`).
  - Lista de `MeasurementListItem`: data (`measuredAt`, `dd/MM/yyyy`), peso (se presente), circunferência cintura (se presente), gordura corporal % (se presente). Clique no item abre dialog em modo edição. Botão de exclusão com confirmação.
  - Paginação: botão "Carregar mais" enquanto `hasNextPage`.
  - Estado vazio: "Nenhuma medida registrada ainda." + CTA para o botão Novo.
  - Loading: skeleton.
- **FR-013:** `MeasurementFormDialog` — dialog Radix UI / shadcn (`Dialog`), modo criar ou editar. Campos agrupados em 3 seções: "Peso" (`weight` em kg), "Medidas Corporais" (circunferências em cm: pescoço, peito, cintura, quadril, braço esquerdo/direito, coxa esquerda/direita, panturrilha), "Bioimpedância" (`bodyFatPct` %, `muscleMassPct` %, `visceralFat` nível). Campo `measuredAt` (date picker ou `<input type="date">`) e `notes`. Validação via Zod (mesmos limites do DTO backend). Submit via `useCreateBodyMeasurement` ou `useUpdateBodyMeasurement`. Feedback: toast / mensagem de erro inline.

---

## 4. Fora do Escopo & Riscos

- **Fora do Escopo:** Gráfico de evolução de peso/medidas ao longo do tempo (TASK16 pode incluir no card de compartilhamento).
- **Fora do Escopo:** Comparação entre dois registros (diff visual).
- **Fora do Escopo:** Exportação CSV/PDF de histórico.
- **Premissa:** `packages/db/prisma/schema.prisma` é o arquivo canônico do schema — a migration é executada a partir dali.
- **Premissa:** `IdentityModule` exporta `USERS_REPOSITORY` (necessário para checar plano FREE) — padrão já usado em `TrainingModule`.
- **Risco:** Campos `Decimal` do Prisma precisam de `.toNumber()` no mapeamento — esquecer causa erro de serialização JSON. → Mitigação: coberto nos critérios de aceite do repositório.
- **Risco:** `measuredAt` user-provided pode receber datas futuras. → Mitigação: validar `@MaxDate(new Date())` no DTO de criação/atualização.

---

## 5. Contratos de API

- `POST /body-measurements`
  - **Request:** `CreateBodyMeasurementDto` — `measuredAt: string (ISO date)`, campos opcionais; ao menos um campo de medição não-nulo.
  - **Response:** `BodyMeasurementDto` (201)

- `GET /body-measurements?limit=20[&cursor=<id>]`
  - **Response:** `PaginatedResponse<BodyMeasurementDto>` (200) — ordenado `measuredAt desc`; retenção 60d aplicada se FREE.

- `GET /body-measurements/:id`
  - **Response:** `BodyMeasurementDto` (200) | 404

- `PATCH /body-measurements/:id`
  - **Request:** `UpdateBodyMeasurementDto` — todos os campos opcionais.
  - **Response:** `BodyMeasurementDto` (200) | 404

- `DELETE /body-measurements/:id`
  - **Response:** `void` (204) | 404

**`BodyMeasurementDto` shape:**
```json
{
  "id": "clx...",
  "tenantId": "clx...",
  "measuredAt": "2026-06-16T00:00:00.000Z",
  "weight": 80.5,
  "neck": null, "chest": null, "waist": 85.0, "hip": null,
  "leftArm": null, "rightArm": null, "leftThigh": null, "rightThigh": null, "calf": null,
  "bodyFatPct": 18.5, "muscleMassPct": null, "visceralFat": null,
  "notes": null,
  "createdAt": "2026-06-16T12:00:00.000Z",
  "updatedAt": "2026-06-16T12:00:00.000Z"
}
```

---

## 6. Plano de Implementação (Tarefas)

### Ordem de Execução & Dependências

| Onda | Tarefas (paralelas) | Agente(s) | Pré-requisito |
|------|---------------------|-----------|---------------|
| 1    | T1, T5              | backend, frontend | — |
| 2    | T2                  | backend   | T1 |
| 3    | T3                  | backend   | T2 |
| 4    | T4, T6              | backend, frontend | T3, T5 |
| 5    | T7                  | frontend  | T4, T6 |
| 6    | T8                  | ambos     | T1, T7 |

```
Onda 1: T1 (migration) | T5 (nav+layout)        ← paralelo
Onda 2: T2 (domain + repo interface)
Onda 3: T3 (use cases + DTOs + types)
Onda 4: T4 (controller + module) | T6 (hooks)   ← paralelo
Onda 5: T7 (página + form)
Onda 6: T8 (testes + fechamento)
```

---

### Tarefa T1: Prisma — model BodyMeasurement + migration
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** —
- **Paralelizável com:** T5
- **Descrição:**
  - Em `packages/db/prisma/schema.prisma`, adicionar model `BodyMeasurement` e campo `bodyMeasurements BodyMeasurement[]` em `User`:
    ```prisma
    model BodyMeasurement {
      id            String   @id @default(cuid())
      tenantId      String
      measuredAt    DateTime
      weight        Decimal? @db.Decimal(5, 2)
      neck          Decimal? @db.Decimal(5, 2)
      chest         Decimal? @db.Decimal(5, 2)
      waist         Decimal? @db.Decimal(5, 2)
      hip           Decimal? @db.Decimal(5, 2)
      leftArm       Decimal? @db.Decimal(5, 2)
      rightArm      Decimal? @db.Decimal(5, 2)
      leftThigh     Decimal? @db.Decimal(5, 2)
      rightThigh    Decimal? @db.Decimal(5, 2)
      calf          Decimal? @db.Decimal(5, 2)
      bodyFatPct    Decimal? @db.Decimal(4, 2)
      muscleMassPct Decimal? @db.Decimal(4, 2)
      visceralFat   Int?
      notes         String?
      createdAt     DateTime @default(now())
      updatedAt     DateTime @updatedAt

      tenant User @relation(fields: [tenantId], references: [id], onDelete: Cascade)

      @@index([tenantId, measuredAt])
      @@map("body_measurements")
    }
    ```
  - Adicionar `bodyMeasurements BodyMeasurement[]` dentro de `User`.
  - Rodar `pnpm --filter @fitflow/db migrate dev --name add_body_measurements` (ou o comando equivalente do projeto — verificar `packages/db/package.json`).
  - Regenerar Prisma client: `pnpm --filter @fitflow/db generate` (se separado do migrate).
- **Critérios de Aceite:**
  - [x] `packages/db/prisma/schema.prisma` contém model `BodyMeasurement` com todos os campos e relação `User.bodyMeasurements`.
  - [x] Migration aplicada sem erros; tabela `body_measurements` existe no banco de desenvolvimento.
  - [x] Prisma client gerado sem erros (`PrismaClient.bodyMeasurement` disponível).
- **Notas:** Verificar o script exato de migrate em `packages/db/package.json` antes de rodar.

---

### Tarefa T5: Navegação + layout `/measurements`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** —
- **Paralelizável com:** T1
- **Descrição:**
  - `apps/web/src/components/layout/nav-content.tsx`: novo item em `extraNavItems` — `{ id: "medidas", label: "Medidas", icon: Ruler, href: "/measurements" }` (import `Ruler` de `lucide-react`).
  - `apps/web/src/components/layout/AppShell.tsx`: `getActiveItem` → `if (pathname.startsWith("/measurements")) return "medidas";`; `sectionTitles.medidas = "Medidas"`.
  - Novo `apps/web/src/app/measurements/layout.tsx`: `export default function MeasurementsLayout({ children }) { return <AppShell>{children}</AppShell>; }`.
- **Critérios de Aceite:**
  - [x] Item "Medidas" aparece na sidebar, navega para `/measurements` e fica destacado (sidebar ativa + título "Medidas" no `TopHeader`).

---

### Tarefa T2: Domain — entidade + interface repositório
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** T1
- **Paralelizável com:** —
- **Descrição:**
  - `apps/api/src/measurements/domain/body-measurement.entity.ts`: classe pura `BodyMeasurement` com props tipados (todos os campos do model, `Decimal` como `number | null`). Getter para cada campo.
  - `apps/api/src/measurements/domain/repositories/body-measurements.repository.interface.ts`: interface `IBodyMeasurementsRepository` com métodos `findById`, `findManyByTenant`, `count`, `create`, `update`, `delete`.
  - `apps/api/src/measurements/measurements.tokens.ts`: `export const BODY_MEASUREMENTS_REPOSITORY = Symbol("IBodyMeasurementsRepository")`.
  - `apps/api/src/measurements/infra/repositories/prisma-body-measurements.repository.ts`: implementação com `PrismaService` (importado de `@fitflow/db` ou do pacote compartilhado — verificar padrão de `PrismaWorkoutSessionsRepository`). `Decimal.toNumber()` em todos os campos. `findManyByTenant` ordena por `[{ measuredAt: "desc" }, { id: "desc" }]`; aceita `measuredAfter` para filtro de retenção.
- **Critérios de Aceite:**
  - [x] Entidade `BodyMeasurement` compila sem erros.
  - [x] `PrismaBodyMeasurementsRepository` implementa todos os métodos de `IBodyMeasurementsRepository`.
  - [x] `Decimal` → `number` em todos os campos numéricos (verificado via teste ou inspeção do tipo de retorno).

---

### Tarefa T3: Application — use cases + DTOs + `@fitflow/types`
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** T2
- **Paralelizável com:** —
- **Descrição:**
  - `apps/api/src/measurements/application/dto/body-measurement.dto.ts`:
    - `BodyMeasurementDto` com `@ApiProperty` em todos os campos; `fromEntity(entity)` estático.
    - `CreateBodyMeasurementDto`: `@IsDateString measuredAt`, todos os campos de medição opcionais com `@IsOptional @IsNumber @Min(x) @Max(y)` (`weight` 1–500, circunferências 1–300, `bodyFatPct`/`muscleMassPct` 0–100, `visceralFat` 1–59). Validação de "ao menos um campo não nulo" implementada no use case (lança `BadRequestException` se todos forem undefined/null).
    - `UpdateBodyMeasurementDto`: todos os campos opcionais (incluindo `measuredAt`).
  - 5 use cases: `CreateBodyMeasurementUseCase`, `ListBodyMeasurementsUseCase` (injeta `USERS_REPOSITORY` para plano FREE), `GetBodyMeasurementUseCase`, `UpdateBodyMeasurementUseCase`, `DeleteBodyMeasurementUseCase`. Padrão idêntico ao training — ownership check em Get/Update/Delete.
  - `packages/types/src/index.ts`: exportar `BodyMeasurementDto`, `CreateBodyMeasurementDto`, `UpdateBodyMeasurementDto` (todos os campos numéricos como `number | null`). Rebuild `@fitflow/types` após.
- **Critérios de Aceite:**
  - [x] 5 use cases funcionam corretamente (ownership check, retenção 60d FREE, validação "ao menos um campo").
  - [x] Testes unitários cobrindo `ListBodyMeasurementsUseCase` (plan FREE/PRO), `CreateBodyMeasurementUseCase` (sucesso, erro sem campos), `GetBodyMeasurementUseCase` (sucesso, 404, ownership), `DeleteBodyMeasurementUseCase` (sucesso, ownership).
  - [x] `@fitflow/types` exporta os 3 tipos; `tsc` limpo em `packages/types`.

---

### Tarefa T4: Presentation — controller + module + AppModule
- **Tipo:** feature
- **Agente:** backend
- **Depende de:** T3
- **Paralelizável com:** T6
- **Descrição:**
  - `apps/api/src/measurements/presentation/measurements.controller.ts`: 5 endpoints (`POST`, `GET`, `GET/:id`, `PATCH/:id`, `DELETE/:id`), guard `JwtAuthGuard`, `tenantId` extraído de `@CurrentUser()`. Decorators Swagger (`@ApiTags`, `@ApiBearerAuth`, `@ApiOperation`, `@ApiResponse`).
  - `apps/api/src/measurements/measurements.module.ts`:
    ```ts
    imports: [IdentityModule],
    controllers: [MeasurementsController],
    providers: [
      { provide: BODY_MEASUREMENTS_REPOSITORY, useClass: PrismaBodyMeasurementsRepository },
      CreateBodyMeasurementUseCase,
      ListBodyMeasurementsUseCase,
      GetBodyMeasurementUseCase,
      UpdateBodyMeasurementUseCase,
      DeleteBodyMeasurementUseCase,
    ],
    ```
  - `apps/api/src/app.module.ts`: adicionar `MeasurementsModule` ao array `imports`.
- **Critérios de Aceite:**
  - [x] `POST /body-measurements` cria e retorna `BodyMeasurementDto` (201).
  - [x] `GET /body-measurements` retorna `PaginatedResponse<BodyMeasurementDto>` com retenção.
  - [x] `GET /body-measurements/:id` retorna 404 para id inexistente ou de outro tenant.
  - [x] `DELETE /body-measurements/:id` retorna 204.
  - [x] `tsc` limpo em `apps/api`.

---

### Tarefa T6: Frontend — hooks
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T3
- **Paralelizável com:** T4
- **Descrição:** Em `apps/web/src/lib/api/hooks/`:
  - `use-body-measurements.ts`: `useBodyMeasurements()` via `useInfiniteQuery` — queryKey `["body-measurements"]`, `GET /body-measurements?limit=20[&cursor=]`, `getNextPageParam: last => last.nextCursor`, `initialPageParam: null`.
  - `use-body-measurement.ts`: `useBodyMeasurement(id)` via `useQuery`, `enabled: !!id`.
  - `use-create-body-measurement.ts`: `useCreateBodyMeasurement()` via `useMutation`, `POST /body-measurements`, `onSuccess: qc.invalidateQueries(["body-measurements"])`.
  - `use-update-body-measurement.ts`: `useUpdateBodyMeasurement()` via `useMutation`, `PATCH /body-measurements/:id`, `onSuccess: qc.invalidateQueries(["body-measurements"])`.
  - `use-delete-body-measurement.ts`: `useDeleteBodyMeasurement()` via `useMutation`, `DELETE /body-measurements/:id`, `onSuccess: qc.invalidateQueries(["body-measurements"])`.
- **Critérios de Aceite:**
  - [x] Testes (jest.mock de `apiFetch`, padrão `use-workout-sessions.test.tsx`) cobrindo: lista paginada (PRO sem retenção), create/update/delete invalidam cache, `useBodyMeasurement` 404.

---

### Tarefa T7: Frontend — `/measurements` page + `MeasurementFormDialog`
- **Tipo:** feature
- **Agente:** frontend
- **Depende de:** T4, T6
- **Paralelizável com:** —
- **Descrição:**
  - `apps/web/src/app/measurements/page.tsx`: `"use client"`, renderiza `MeasurementsPage`.
  - `apps/web/src/components/measurements/MeasurementsPage.tsx`: usa `useBodyMeasurements()` + `useUserMe()`.
    - Banner 60d para `plan === "FREE"` (padrão `/history`).
    - Botão "Novo registro" abre `MeasurementFormDialog` (modo create).
    - Lista de `MeasurementListItem`: data (`measuredAt`, `dd/MM/yyyy`), peso (kg, se não-nulo), cintura (cm, se não-nulo), gordura % (se não-nulo). Clique no item → `MeasurementFormDialog` (modo edit, pre-popula campos). Botão delete com `AlertDialog` de confirmação.
    - "Carregar mais" enquanto `hasNextPage`.
    - Estado vazio: "Nenhuma medida registrada ainda." com ícone `Ruler`.
    - Loading: skeleton (3 cards).
  - `apps/web/src/components/measurements/MeasurementFormDialog.tsx`: `Dialog` shadcn. Props: `open`, `onOpenChange`, `measurement?` (undefined = modo create). Formulário React Hook Form + Zod. Campos agrupados:
    - **Data:** `measuredAt` (`<input type="date">`, default hoje, max hoje)
    - **Peso:** `weight` (kg, step 0.1)
    - **Medidas corporais (cm):** pescoço, peito, cintura, quadril, braço esq/dir, coxa esq/dir, panturrilha (todos opcionais)
    - **Bioimpedância:** `bodyFatPct` (%), `muscleMassPct` (%), `visceralFat` (nível)
    - **Observações:** `notes` (textarea)
    - Submit: `useCreateBodyMeasurement` (create) ou `useUpdateBodyMeasurement` (edit). Fechar dialog on success.
- **Critérios de Aceite:**
  - [x] Lista renderiza registros reais (data, peso, cintura, gordura) com "Carregar mais" funcional.
  - [x] Banner FREE aparece apenas para `plan === "FREE"`.
  - [x] `MeasurementFormDialog` cria registro via POST e fecha ao salvar; pré-popula campos ao editar.
  - [x] Exclusão abre `AlertDialog` de confirmação antes de deletar.
  - [x] Estado vazio e skeleton de loading cobertos.
  - [x] Testes RTL (jest.mock dos hooks) cobrindo: lista populada, vazia, banner FREE/PRO, abertura de dialog, submit create.

---

### Tarefa T8: Testes finais, cobertura e fechamento
- **Tipo:** chore
- **Agente:** ambos
- **Depende de:** T1, T7
- **Paralelizável com:** —
- **Descrição:**
  - Rodar `tsc`/lint/jest em `apps/api` e `apps/web`.
  - Cobertura dentro das metas de `decisions.md` para arquivos novos/alterados.
  - `docs/context/product-backlog.md`: marcar TASK14 `done`, preencher coluna "Spec".
- **Critérios de Aceite:**
  - [x] `tsc`/lint/jest limpos em `apps/api` e `apps/web`.
  - [x] Cobertura dentro das metas de `decisions.md`.
  - [x] Backlog atualizado.

---

<!--
GATE DE APROVAÇÃO
Revise as regras de negócio e as tarefas técnicas.
Se tudo estiver correto, altere o Status acima de "review" para "approved" para liberar os agentes de frontend/backend para iniciar a implementação.
-->
