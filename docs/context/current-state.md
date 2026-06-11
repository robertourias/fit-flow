# Status do Projeto

> Memória de trabalho persistente. Atualizado pelo `/checkpoint`, lido pelo `/retomar`.

**Última atualização:** 2026-06-11
**Fase Atual:** Fase 2 — Integração & Fluxo

---

## Status de Alto Nível

O backend core (API, Data Model, Auth) e as UIs estáticas estão concluídos (Fase 0 e Fase 1). O foco principal agora é a Fase 2: conectar o Frontend (web) às novas APIs reais, substituindo os dados mockados.

---

## 🔄 Em Progresso

- Integração Frontend ↔ Backend (API reais via TanStack Query)

---

## ⏭ Próximos Passos Imediatos

1. Adicionar `http://localhost:3000/api/auth/callback/google` em Authorized redirect URIs no Google Cloud Console.
2. Implementar fluxo de onboarding (`/onboarding`).
3. Conectar telas do frontend (Dashboard, Exercícios, Biblioteca, Treino) aos endpoints da API.
4. Criar rota `/program/[programId]` (destino do `WorkoutFinishForm`).
