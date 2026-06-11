"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { EquipmentDto } from "@fitflow/types";

export function useEquipment() {
  return useQuery({
    queryKey: ["equipment"],
    queryFn: () => apiFetch<EquipmentDto[]>("/equipment"),
    staleTime: Infinity,
  });
}
