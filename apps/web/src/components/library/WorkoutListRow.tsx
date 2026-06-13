import { memo } from "react";
import Link from "next/link";
import { Ellipsis } from "lucide-react";
import { programColor } from "@/lib/utils/program-color";
import type { WorkoutDetailDto } from "@fitflow/types";

interface WorkoutListRowProps {
  workout: WorkoutDetailDto;
}

export const WorkoutListRow = memo(function WorkoutListRow({ workout }: WorkoutListRowProps) {
  return (
    <div className="relative flex items-center gap-3.5 md:gap-4 px-5 md:px-6 py-3.5 border-b border-border bg-card hover:bg-accent/30 transition-colors">
      {/* Stretched link covers the row except the button */}
      <Link href={`/workout/${workout.id}`} className="absolute inset-0" aria-label={workout.name} />

      {/* Thumbnail */}
      <div className="relative h-[52px] w-[52px] rounded-m overflow-hidden shrink-0">
        <div className="absolute inset-0" style={{ backgroundColor: programColor(workout.id) }} />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-[15px] font-semibold text-foreground leading-tight truncate">
          {workout.name}
        </span>
        <span className="text-[13px] text-muted-foreground">
          {workout.exercises.length} exercícios
        </span>
      </div>

      {/* More — sits above the link overlay */}
      <button
        className="relative z-10 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Mais opções"
        onClick={(e) => e.preventDefault()}
      >
        <Ellipsis className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
});
