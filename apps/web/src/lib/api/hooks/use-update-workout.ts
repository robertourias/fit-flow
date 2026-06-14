"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { UpdateWorkoutDto, WorkoutDetailDto } from "@fitflow/types";

export function useUpdateWorkout(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateWorkoutDto) =>
      apiFetch<WorkoutDetailDto>(`/workouts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workout", id] });
      queryClient.invalidateQueries({ queryKey: ["strategy", data.strategyId] });
    },
  });
}
