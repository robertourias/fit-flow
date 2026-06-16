"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "../client";

export function useDeleteBodyMeasurement() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiClientError, string>({
    mutationFn: (id) =>
      apiFetch<void>(`/body-measurements/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["body-measurements"] });
    },
  });
}
