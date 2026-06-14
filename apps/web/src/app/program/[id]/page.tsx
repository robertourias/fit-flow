import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { apiFetch, ApiClientError } from "@/lib/api/client";
import { programColor } from "@/lib/utils/program-color";
import { Button } from "@/components/ui/button";
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
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Treinos</h2>
              <Button asChild size="sm">
                <Link href={`/program/${strategy.id}/workout/novo`}>
                  <Plus className="h-4 w-4" />
                  Adicionar treino
                </Link>
              </Button>
            </div>
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
