"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { CreateStrategyDto, StrategySummaryDto } from "@fitflow/types";

export function useCreateStudentStrategy(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStrategyDto) =>
      apiFetch<StrategySummaryDto>(`/coaching/students/${studentId}/strategies`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching", "student-dashboard", studentId] });
    },
  });
}
