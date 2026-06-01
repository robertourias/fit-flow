import Image from "next/image";
import { Ellipsis } from "lucide-react";
import type { Workout } from "@/lib/mock/library";

interface WorkoutListRowProps {
  workout: Workout;
}

export function WorkoutListRow({ workout }: WorkoutListRowProps) {
  return (
    <div className="flex items-center gap-3.5 md:gap-4 px-5 md:px-6 py-3.5 border-b border-border bg-card hover:bg-accent/30 transition-colors cursor-pointer">
      {/* Thumbnail */}
      <div className="relative h-[52px] w-[52px] rounded-m overflow-hidden shrink-0">
        <Image
          src={workout.image}
          alt={workout.name}
          fill
          className="object-cover"
          sizes="52px"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <span className="text-[15px] font-semibold text-foreground leading-tight truncate">
          {workout.name}
        </span>
        <span className="text-[13px] text-muted-foreground">
          {workout.exercises} exercícios
        </span>
      </div>

      {/* More */}
      <button
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Mais opções"
      >
        <Ellipsis className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}
