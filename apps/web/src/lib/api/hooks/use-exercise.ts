"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { ExerciseDto } from "@fitflow/types";

export function useExercise(id: string) {
  return useQuery({
    queryKey: ["exercise", id],
    queryFn: () => apiFetch<ExerciseDto>(`/exercises/${id}`),
    enabled: !!id,
  });
}
