import { notFound } from "next/navigation";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { programColor } from "@/lib/utils/program-color";
import type { StrategyDetailDto } from "@fitflow/types";

interface ProgramPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { id } = await params;

  try {
    const strategy = await apiFetch<StrategyDetailDto>(`/strategies/${id}`);

    const color = programColor(strategy.id);
    const tags = [
      `${strategy.workouts.length} treino${strategy.workouts.length !== 1 ? "s" : ""}`,
      strategy.type ?? "Personalizado",
    ];

    return (
      <div className="flex flex-col">
        <div className="h-32 relative" style={{ backgroundColor: color }} />

        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">{strategy.name}</h1>
            <div className="flex gap-2 flex-wrap">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center rounded-pill px-3 py-1 text-sm bg-muted text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>

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
