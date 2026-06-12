import { notFound } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { programColor } from "@/lib/utils/program-color";
import { ProgramHeader } from "@/components/library/ProgramHeader";
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
              <div className="space-y-2">
                {strategy.workouts.map((workout) => (
                  <div key={workout.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium">{workout.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {workout.exercises.length} exercício{workout.exercises.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
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
