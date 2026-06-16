"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "../client";
import type { BodyMeasurementDto, CreateBodyMeasurementDto } from "@fitflow/types";

export function useCreateBodyMeasurement() {
  const queryClient = useQueryClient();

  return useMutation<BodyMeasurementDto, ApiClientError, CreateBodyMeasurementDto>({
    mutationFn: (data) =>
      apiFetch<BodyMeasurementDto>("/body-measurements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["body-measurements"] });
    },
  });
}
