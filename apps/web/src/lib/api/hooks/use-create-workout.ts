"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { CreateWorkoutDto, WorkoutDetailDto } from "@fitflow/types";

export function useCreateWorkout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkoutDto) =>
      apiFetch<WorkoutDetailDto>("/workouts", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["strategy", data.strategyId] });
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
    },
  });
}
