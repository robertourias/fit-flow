"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { CreateWorkoutDto, WorkoutDetailDto } from "@fitflow/types";

export function useCreateStudentWorkout(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWorkoutDto) =>
      apiFetch<WorkoutDetailDto>(`/coaching/students/${studentId}/workouts`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coaching", "student-dashboard", studentId] });
    },
  });
}
