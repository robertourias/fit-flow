"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { RelationshipDto, RelationshipStatus } from "@fitflow/types";

export function useStudents(status?: RelationshipStatus) {
  return useQuery({
    queryKey: ["coaching", "students", status],
    queryFn: () => {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      const query = params.toString();
      return apiFetch<RelationshipDto[]>(`/coaching/students${query ? `?${query}` : ""}`);
    },
  });
}
