"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "../client";
import type { BodyMeasurementDto, UpdateBodyMeasurementDto } from "@fitflow/types";

export function useUpdateBodyMeasurement() {
  const queryClient = useQueryClient();

  return useMutation<BodyMeasurementDto, ApiClientError, { id: string; data: UpdateBodyMeasurementDto }>({
    mutationFn: ({ id, data }) =>
      apiFetch<BodyMeasurementDto>(`/body-measurements/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["body-measurements"] });
      queryClient.invalidateQueries({ queryKey: ["body-measurement", id] });
    },
  });
}
