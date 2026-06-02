import { notFound } from "next/navigation";
import { mockWorkouts, mockLastSessions } from "@/lib/mock/workout";
import { WorkoutActiveSession } from "@/components/workout/WorkoutActiveSession";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WorkoutSessionPage({ params }: Props) {
  const { id } = await params;
  const workout = mockWorkouts[id];
  if (!workout) notFound();
  return <WorkoutActiveSession workout={workout} lastSession={mockLastSessions[id]} />;
}
