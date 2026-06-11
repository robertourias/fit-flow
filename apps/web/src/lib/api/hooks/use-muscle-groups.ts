"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { MuscleGroupDto } from "@fitflow/types";

export function useMuscleGroups() {
  return useQuery({
    queryKey: ["muscleGroups"],
    queryFn: () => apiFetch<MuscleGroupDto[]>("/muscle-groups"),
    staleTime: Infinity,
  });
}
