import { notFound } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { programColor } from "@/lib/utils/program-color";
import { ProgramHeader } from "@/components/library/ProgramHeader";
import { WorkoutListRow } from "@/components/library/WorkoutListRow";
import type { StrategyDetailDto } from "@fitflow/types";

interface ProgramPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { id } = await params;

  try {
    const strategy = await apiFetch<StrategyDetailDto>(`/strategies/${id}`);

    return (
      <div className="flex flex-col">
        <div className="h-32 relative" style={{ backgroundColor: programColor(strategy.id) }} />

        <ProgramHeader strategy={strategy} />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold">Treinos</h2>
            {strategy.workouts.length === 0 ? (
              <p className="text-muted-foreground">Nenhum treino adicionado ainda.</p>
            ) : (
              <div className="rounded-l border border-border overflow-hidden">
                {strategy.workouts.map((workout) => (
                  <WorkoutListRow key={workout.id} workout={workout} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}
