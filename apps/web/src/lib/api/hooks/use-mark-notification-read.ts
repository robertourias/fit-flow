"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "../client";
import type { NotificationDto } from "@fitflow/types";

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation<NotificationDto, ApiClientError, string>({
    mutationFn: (notificationId) =>
      apiFetch<NotificationDto>(`/notifications/${notificationId}/read`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
