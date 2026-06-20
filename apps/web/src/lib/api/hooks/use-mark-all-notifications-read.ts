"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "../client";
import type { MarkAllNotificationsReadResponseDto } from "@fitflow/types";

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation<MarkAllNotificationsReadResponseDto, ApiClientError, void>({
    mutationFn: () =>
      apiFetch<MarkAllNotificationsReadResponseDto>("/notifications/read-all", {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
