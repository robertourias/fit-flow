import Image from "next/image";
import type { Workout } from "@/lib/mock/library";

interface WorkoutCardProps {
  workout: Workout;
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  return (
    <div className="bg-card rounded-l border border-border overflow-hidden flex flex-col cursor-pointer hover:shadow-md transition-shadow group">
      {/* Thumbnail */}
      <div className="relative h-[120px] w-full overflow-hidden">
        <Image
          src={workout.image}
          alt={workout.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      </div>

      {/* Info */}
      <div className="p-2.5 flex flex-col gap-1">
        <span className="text-[13px] font-semibold text-foreground leading-tight line-clamp-2">
          {workout.name}
        </span>
        <span className="inline-flex items-center rounded-pill bg-muted text-muted-foreground px-1.5 py-0.5 text-[10px] self-start">
          {workout.exercises} exercícios
        </span>
      </div>
    </div>
  );
}
