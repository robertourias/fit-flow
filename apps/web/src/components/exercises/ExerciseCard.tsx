import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark } from "lucide-react";
import type { Exercise } from "@/lib/mock/exercises";

interface ExerciseCardProps {
  exercise: Exercise;
}

export const ExerciseCard = memo(function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <Link href={`/exercises/${exercise.id}`} className="block group">
      <div className="relative bg-card rounded-l border border-border overflow-hidden flex flex-col transition-shadow group-hover:shadow-md">
        {/* Thumbnail */}
        <div className="relative h-[120px] w-full overflow-hidden">
          <Image
            src={exercise.image}
            alt={exercise.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {/* Bookmark overlay */}
          <button
            onClick={(e) => e.preventDefault()}
            className="absolute top-2 left-2 h-7 w-7 bg-card rounded-s flex items-center justify-center hover:bg-card/90 transition-colors"
            aria-label="Salvar exercício"
          >
            <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Info */}
        <div className="p-2.5 flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-foreground leading-tight line-clamp-2">
            {exercise.name}
          </span>
          <div className="flex gap-1.5 flex-wrap">
            <span className="inline-flex items-center rounded-pill px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground">
              {exercise.muscleGroup}
            </span>
            <span className="inline-flex items-center rounded-pill px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground">
              {exercise.equipment}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
});
