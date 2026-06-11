export const SPLIT_PRESETS = {
  ABC: ["Treino A", "Treino B", "Treino C"],
  "Upper/Lower": ["Upper A", "Lower A", "Upper B", "Lower B"],
  PPL: ["Push", "Pull", "Legs"],
  "Full Body": ["Full Body A", "Full Body B", "Full Body C"],
} as const;

export type SplitType = keyof typeof SPLIT_PRESETS;

export const GOAL_OPTIONS = [
  "Hipertrofia",
  "Emagrecimento",
  "Performance",
  "Saúde/Condicionamento",
] as const;

export type Goal = (typeof GOAL_OPTIONS)[number];
