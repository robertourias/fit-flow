import { memo } from "react";
import Link from "next/link";
import { programColor } from "@/lib/utils/program-color";
import { WorkoutOptionsMenu } from "@/components/library/WorkoutOptionsMenu";
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
      <div className="relative z-10">
        <WorkoutOptionsMenu workout={workout} />
      </div>
    </div>
  );
});
