"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "../client";
import type { StrategySummaryDto, UpdateStrategyDto } from "@fitflow/types";

export function useUpdateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: { id: string; data: UpdateStrategyDto }) =>
      apiFetch<StrategySummaryDto>(`/strategies/${variables.id}`, {
        method: "PATCH",
        body: JSON.stringify(variables.data),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      queryClient.invalidateQueries({ queryKey: ["strategy", variables.id] });
    },
  });
}
