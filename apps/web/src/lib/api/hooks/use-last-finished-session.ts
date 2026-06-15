"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { PaginatedResponse, WorkoutSessionDetailDto, WorkoutSessionSummaryDto } from "@fitflow/types";

export function useLastFinishedSession(workoutId: string) {
  return useQuery({
    queryKey: ["workout-session", "last", workoutId],
    queryFn: async (): Promise<WorkoutSessionDetailDto | null> => {
      const page = await apiFetch<PaginatedResponse<WorkoutSessionSummaryDto>>(
        `/workout-sessions?workoutId=${workoutId}&limit=1`,
      );
      const summary = page.items[0];
      if (!summary) return null;
      return apiFetch<WorkoutSessionDetailDto>(`/workout-sessions/${summary.id}`);
    },
    enabled: !!workoutId,
  });
}
