"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { DashboardSummaryDto } from "@fitflow/types";

export function useStudentDashboard(studentId: string) {
  return useQuery({
    queryKey: ["coaching", "student-dashboard", studentId],
    queryFn: () => apiFetch<DashboardSummaryDto>(`/coaching/students/${studentId}/dashboard`),
    enabled: !!studentId,
  });
}
