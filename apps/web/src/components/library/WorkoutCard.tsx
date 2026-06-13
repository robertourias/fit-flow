import { memo } from "react";
import Link from "next/link";
import { programColor } from "@/lib/utils/program-color";
import type { WorkoutDetailDto } from "@fitflow/types";

interface WorkoutCardProps {
  workout: WorkoutDetailDto;
}

export const WorkoutCard = memo(function WorkoutCard({ workout }: WorkoutCardProps) {
  return (
    <Link
      href={`/workout/${workout.id}`}
      className="bg-card rounded-l border border-border overflow-hidden flex flex-col hover:shadow-md transition-shadow group"
    >
      {/* Thumbnail */}
      <div className="relative h-[120px] w-full overflow-hidden">
        <div
          className="absolute inset-0 transition-transform group-hover:scale-105"
          style={{ backgroundColor: programColor(workout.id) }}
        />
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-foreground leading-tight line-clamp-2">
          {workout.name}
        </span>
        <span className="inline-flex items-center rounded-pill bg-muted text-muted-foreground px-1.5 py-0.5 text-[10px] self-start">
          {workout.exercises.length} exercícios
        </span>
      </div>
    </Link>
  );
});
