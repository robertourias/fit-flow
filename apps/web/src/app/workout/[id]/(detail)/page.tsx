import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mockWorkouts } from "@/lib/mock/workout";
import { WorkoutDetailPage } from "@/components/workout/WorkoutDetailPage";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const workout = mockWorkouts[id];
  return { title: workout ? `${workout.name} — FitFlow` : "Treino — FitFlow" };
}

export default async function WorkoutDetailRoute({ params }: Props) {
  const { id } = await params;
  const workout = mockWorkouts[id];
  if (!workout) notFound();
  return <WorkoutDetailPage workout={workout} />;
}
