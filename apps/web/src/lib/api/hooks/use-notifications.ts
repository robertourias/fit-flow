"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { NotificationDto } from "@fitflow/types";

// Sem WebSocket/SSE nesta fase (FR-009) — mesmo intervalo conservador usado para mensagens.
const NOTIFICATIONS_REFETCH_INTERVAL_MS = 12000;

export function useNotifications(unread?: boolean) {
  return useQuery({
    queryKey: ["notifications", unread],
    queryFn: () => {
      const params = new URLSearchParams();
      if (unread) params.append("unread", "true");
      const query = params.toString();
      return apiFetch<NotificationDto[]>(`/notifications${query ? `?${query}` : ""}`);
    },
    refetchInterval: NOTIFICATIONS_REFETCH_INTERVAL_MS,
  });
}
