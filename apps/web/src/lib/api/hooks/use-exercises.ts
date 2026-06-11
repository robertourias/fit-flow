"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { ExerciseDto, PaginatedResponse } from "@fitflow/types";

interface UseExercisesFilters {
  search?: string;
  muscleGroupSlug?: string;
  equipmentSlug?: string;
  category?: "STRENGTH" | "CARDIO" | "FLEXIBILITY" | "BALANCE";
}

export function useExercises(filters: UseExercisesFilters = {}) {
  return useInfiniteQuery({
    queryKey: ["exercises", filters],
    queryFn: async ({ pageParam = null }) => {
      const params = new URLSearchParams();
      if (filters.search) params.append("search", filters.search);
      if (filters.muscleGroupSlug) params.append("muscleGroupSlug", filters.muscleGroupSlug);
      if (filters.equipmentSlug) params.append("equipmentSlug", filters.equipmentSlug);
      if (filters.category) params.append("category", filters.category);
      if (pageParam) params.append("cursor", pageParam);

      const path = `/exercises?${params.toString()}`;
      return apiFetch<PaginatedResponse<ExerciseDto>>(path);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: null,
  });
}
