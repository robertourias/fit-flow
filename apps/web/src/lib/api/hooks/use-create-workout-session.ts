"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "../client";
import type { CreateWorkoutSessionDto, WorkoutSessionDetailDto } from "@fitflow/types";

export function useCreateWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation<WorkoutSessionDetailDto, ApiClientError, CreateWorkoutSessionDto>({
    mutationFn: (data) =>
      apiFetch<WorkoutSessionDetailDto>("/workout-sessions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workout-session", "last", data.workoutId] });
      queryClient.invalidateQueries({ queryKey: ["workout-sessions"] });
    },
  });
}
