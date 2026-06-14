"use client";

import { useQueries } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { ExerciseDto } from "@fitflow/types";

export function useExercisesByIds(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: ["exercise", id],
      queryFn: () => apiFetch<ExerciseDto>(`/exercises/${id}`),
    })),
  });
}
