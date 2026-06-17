"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "../client";
import type { StrategySummaryDto } from "@fitflow/types";

export function useImportTemplate() {
  const queryClient = useQueryClient();

  return useMutation<StrategySummaryDto, ApiClientError, string>({
    mutationFn: (templateId) =>
      apiFetch<StrategySummaryDto>(`/explore/templates/${templateId}/import`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      queryClient.invalidateQueries({ queryKey: ["workouts-limit"] });
    },
  });
}
