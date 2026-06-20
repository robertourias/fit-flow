"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { StrategyTemplateDto } from "@fitflow/types";

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: () => apiFetch<StrategyTemplateDto[]>("/explore/templates"),
  });
}
