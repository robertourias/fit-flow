"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { WorkoutsLimitDto } from "@fitflow/types";

export function useWorkoutsLimit() {
  return useQuery({
    queryKey: ["workouts-limit"],
    queryFn: () => apiFetch<WorkoutsLimitDto>("/workouts/limit"),
  });
}
