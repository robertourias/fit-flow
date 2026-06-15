import type { Metadata } from "next";
import { WorkoutDetailPage } from "@/components/workout/WorkoutDetailPage";

export const metadata: Metadata = {
  title: "Treino — FitFlow",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkoutDetailRoute({ params }: Props) {
  const { id } = await params;
  return <WorkoutDetailPage id={id} />;
}
