"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "../client";
import type { MarkMessagesReadResponseDto } from "@fitflow/types";

export function useMarkMessagesRead(relationshipId: string) {
  const queryClient = useQueryClient();

  return useMutation<MarkMessagesReadResponseDto, ApiClientError, void>({
    mutationFn: () =>
      apiFetch<MarkMessagesReadResponseDto>(`/coaching/relationships/${relationshipId}/messages/read`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching", "messages", relationshipId] });
    },
  });
}
