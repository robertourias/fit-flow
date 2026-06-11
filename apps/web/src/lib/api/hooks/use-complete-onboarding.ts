"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../client";
import type { UpdateUserMeDto, StrategySummaryDto, WorkoutDetailDto } from "@fitflow/types";
import type { SplitType } from "@/lib/onboarding/split-presets";
import { SPLIT_PRESETS } from "@/lib/onboarding/split-presets";

interface CompleteOnboardingInput {
  name: string;
  age?: number;
  bio?: string;
  goals: string[];
  splitType: SplitType;
  programName: string;
}

export function useCompleteOnboarding() {
  return useMutation({
    mutationFn: async (input: CompleteOnboardingInput) => {
      // Step 1: Update user with hasOnboarded
      await apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: input.name,
          age: input.age,
          bio: input.bio,
          goals: input.goals,
          hasOnboarded: true,
        } as UpdateUserMeDto),
      });

      // Step 2: Create strategy
      const strategy = await apiFetch<StrategySummaryDto>("/strategies", {
        method: "POST",
        body: JSON.stringify({
          name: input.programName,
          type: input.splitType,
        }),
      });

      // Step 3: Create workouts for each split
      const workoutNames = SPLIT_PRESETS[input.splitType];
      await Promise.all(
        workoutNames.map((name, order) =>
          apiFetch("/workouts", {
            method: "POST",
            body: JSON.stringify({
              strategyId: strategy.id,
              name,
              order,
              exercises: [],
            }),
          }),
        ),
      );

      return strategy;
    },
  });
}
