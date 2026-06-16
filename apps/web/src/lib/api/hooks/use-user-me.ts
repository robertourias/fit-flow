"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { UserMeDto } from "@fitflow/types";

export function useUserMe() {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: () => apiFetch<UserMeDto>("/users/me"),
  });
}
