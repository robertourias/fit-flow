import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { ExerciseDetail } from "@/components/exercises/ExerciseDetail";
import type { ExerciseDto } from "@fitflow/types";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const exercise = await apiFetch<ExerciseDto>(`/exercises/${id}`);
    return { title: `${exercise.name} — FitFlow` };
  } catch {
    return { title: "Exercício — FitFlow" };
  }
}

export default async function ExerciseDetailPage({ params }: Props) {
  const { id } = await params;

  try {
    const exercise = await apiFetch<ExerciseDto>(`/exercises/${id}`);
    return <ExerciseDetail exercise={exercise} />;
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
