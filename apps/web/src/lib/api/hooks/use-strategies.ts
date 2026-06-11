"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { StrategySummaryDto } from "@fitflow/types";

export function useStrategies() {
  return useQuery({
    queryKey: ["strategies"],
    queryFn: () => apiFetch<StrategySummaryDto[]>("/strategies"),
  });
}
