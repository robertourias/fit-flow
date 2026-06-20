"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { InviteRelationshipDto, RelationshipDto } from "@fitflow/types";

export function useInviteRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteRelationshipDto) =>
      apiFetch<RelationshipDto>("/coaching/relationships", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching", "students"] });
      queryClient.invalidateQueries({ queryKey: ["coaching", "trainers"] });
    },
  });
}
