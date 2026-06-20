"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { BodyMeasurementDto } from "@fitflow/types";

export function useBodyMeasurement(id: string | null) {
  return useQuery({
    queryKey: ["body-measurement", id],
    queryFn: () => apiFetch<BodyMeasurementDto>(`/body-measurements/${id}`),
    enabled: !!id,
  });
}
