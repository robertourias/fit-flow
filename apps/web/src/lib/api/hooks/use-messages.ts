"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { MessageListResponseDto } from "@fitflow/types";

// Sem WebSocket/SSE nesta fase (FR-009) — polling conservador para não sobrecarregar o backend
// em conversas com o vínculo aberto.
const MESSAGES_REFETCH_INTERVAL_MS = 12000;

interface UseMessagesOptions {
  limit?: number;
  offset?: number;
}

export function useMessages(relationshipId: string, options: UseMessagesOptions = {}) {
  const { limit, offset } = options;

  return useQuery({
    queryKey: ["coaching", "messages", relationshipId, limit, offset],
    queryFn: () => {
      const params = new URLSearchParams();
      if (limit !== undefined) params.append("limit", String(limit));
      if (offset !== undefined) params.append("offset", String(offset));
      const query = params.toString();
      return apiFetch<MessageListResponseDto>(
        `/coaching/relationships/${relationshipId}/messages${query ? `?${query}` : ""}`,
      );
    },
    enabled: !!relationshipId,
    refetchInterval: MESSAGES_REFETCH_INTERVAL_MS,
  });
}
