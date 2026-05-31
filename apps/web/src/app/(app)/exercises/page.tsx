import type { Metadata } from "next";
import { mockExercises } from "@/lib/mock/exercises";
import { ExercisesClientPage } from "@/components/exercises/ExercisesClientPage";

export const metadata: Metadata = {
  title: "Exercícios — FitFlow",
};

export default function ExercisesPage() {
  return <ExercisesClientPage exercises={mockExercises} />;
}
