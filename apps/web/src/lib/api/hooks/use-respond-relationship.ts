"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { RelationshipDto } from "@fitflow/types";

export function useRespondRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; action: "ACCEPT" | "REJECT" }) =>
      apiFetch<RelationshipDto>(`/coaching/relationships/${variables.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: variables.action }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching", "students"] });
      queryClient.invalidateQueries({ queryKey: ["coaching", "trainers"] });
    },
  });
}
