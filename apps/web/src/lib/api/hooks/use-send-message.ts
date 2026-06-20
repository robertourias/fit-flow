"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "../client";
import type { MessageDto, SendMessageDto } from "@fitflow/types";

export function useSendMessage(relationshipId: string) {
  const queryClient = useQueryClient();

  return useMutation<MessageDto, ApiClientError, SendMessageDto>({
    mutationFn: (data) =>
      apiFetch<MessageDto>(`/coaching/relationships/${relationshipId}/messages`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching", "messages", relationshipId] });
    },
  });
}
