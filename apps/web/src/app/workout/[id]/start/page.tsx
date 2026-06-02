import { notFound } from "next/navigation";
import { mockWorkouts, mockLastSessions } from "@/lib/mock/workout";
import { WorkoutStartPreview } from "@/components/workout/WorkoutStartPreview";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkoutStartPage({ params }: Props) {
  const { id } = await params;
  const workout = mockWorkouts[id];
  if (!workout) notFound();
  return <WorkoutStartPreview workout={workout} lastSession={mockLastSessions[id]} />;
}
