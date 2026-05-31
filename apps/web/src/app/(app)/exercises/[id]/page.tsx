import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mockExercises } from "@/lib/mock/exercises";
import { ExerciseDetail } from "@/components/exercises/ExerciseDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const exercise = mockExercises.find((e) => e.id === id);
  return { title: exercise ? `${exercise.name} — FitFlow` : "Exercício — FitFlow" };
}

export function generateStaticParams() {
  return mockExercises.map((e) => ({ id: e.id }));
}

export default async function ExerciseDetailPage({ params }: Props) {
  const { id } = await params;
  const exercise = mockExercises.find((e) => e.id === id);
  if (!exercise) notFound();
  return <ExerciseDetail exercise={exercise} />;
}
