"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { RelationshipDto } from "@fitflow/types";

export function useRevokeRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<RelationshipDto>(`/coaching/relationships/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "REVOKE" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching", "students"] });
      queryClient.invalidateQueries({ queryKey: ["coaching", "trainers"] });
    },
  });
}
