"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { WorkoutSessionDetailDto } from "@fitflow/types";

export function useWorkoutSession(id: string) {
  return useQuery({
    queryKey: ["workout-session", id],
    queryFn: () => apiFetch<WorkoutSessionDetailDto>(`/workout-sessions/${id}`),
    enabled: !!id,
  });
}
