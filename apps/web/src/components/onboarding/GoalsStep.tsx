"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { GOAL_OPTIONS } from "@/lib/onboarding/split-presets";

interface GoalsStepProps {
  goals: string[];
  onGoalsChange: (goals: string[]) => void;
}

export function GoalsStep({ goals, onGoalsChange }: GoalsStepProps) {
  const handleToggle = (goal: string) => {
    onGoalsChange(
      goals.includes(goal) ? goals.filter((g) => g !== goal) : [...goals, goal],
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Selecione seus objetivos:</p>
      {GOAL_OPTIONS.map((goal) => (
        <div key={goal} className="flex items-center space-x-2">
          <Checkbox
            id={goal}
            checked={goals.includes(goal)}
            onCheckedChange={() => handleToggle(goal)}
          />
          <Label htmlFor={goal} className="cursor-pointer">
            {goal}
          </Label>
        </div>
      ))}
    </div>
  );
}
