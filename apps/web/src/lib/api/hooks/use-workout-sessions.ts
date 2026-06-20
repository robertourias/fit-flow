"use client";

import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { PaginatedResponse, WorkoutSessionSummaryDto } from "@fitflow/types";

export function useWorkoutSessions() {
  return useInfiniteQuery({
    queryKey: ["workout-sessions"],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.append("limit", "20");
      if (pageParam) params.append("cursor", pageParam);
      return apiFetch<PaginatedResponse<WorkoutSessionSummaryDto>>(`/workout-sessions?${params.toString()}`);
    },
    getNextPageParam: (lastPage): string | null => lastPage.nextCursor,
    initialPageParam: null as string | null,
    placeholderData: keepPreviousData,
  });
}
