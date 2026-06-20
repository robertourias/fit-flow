"use client";

import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { PaginatedResponse, BodyMeasurementDto } from "@fitflow/types";

export function useBodyMeasurements() {
  return useInfiniteQuery({
    queryKey: ["body-measurements"],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      params.append("limit", "20");
      if (pageParam) params.append("cursor", pageParam);
      return apiFetch<PaginatedResponse<BodyMeasurementDto>>(`/body-measurements?${params.toString()}`);
    },
    getNextPageParam: (lastPage): string | null => lastPage.nextCursor,
    initialPageParam: null as string | null,
    placeholderData: keepPreviousData,
  });
}
