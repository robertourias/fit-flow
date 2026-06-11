"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { StrategyDetailDto } from "@fitflow/types";

export function useStrategy(id: string) {
  return useQuery({
    queryKey: ["strategy", id],
    queryFn: () => apiFetch<StrategyDetailDto>(`/strategies/${id}`),
  });
}
