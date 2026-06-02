import { notFound } from "next/navigation";
import { mockWorkouts } from "@/lib/mock/workout";
import { WorkoutFinishForm } from "@/components/workout/WorkoutFinishForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkoutFinishPage({ params }: Props) {
  const { id } = await params;
  const workout = mockWorkouts[id];
  if (!workout) notFound();
  return <WorkoutFinishForm workout={workout} />;
}
