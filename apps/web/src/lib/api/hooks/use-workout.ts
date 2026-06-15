"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { WorkoutDetailDto } from "@fitflow/types";

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ["workout", id],
    queryFn: () => apiFetch<WorkoutDetailDto>(`/workouts/${id}`),
  });
}
