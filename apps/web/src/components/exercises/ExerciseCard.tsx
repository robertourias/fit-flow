import { memo } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { ExerciseImage } from "@/components/exercises/ExerciseImage";
import type { ExerciseDto } from "@fitflow/types";

interface ExerciseCardProps {
  exercise: ExerciseDto;
}

export const ExerciseCard = memo(function ExerciseCard({ exercise }: ExerciseCardProps) {
  const primaryMuscle = exercise.muscleGroups.find((m) => m.isPrimary) ?? exercise.muscleGroups[0];
  const primaryEquipment = exercise.equipment[0];

  return (
    <Link href={`/exercises/${exercise.id}`} className="block group">
      <div className="relative bg-card rounded-l border border-border overflow-hidden flex flex-col transition-shadow group-hover:shadow-md">
        {/* Thumbnail */}
        <div className="relative h-[120px] w-full overflow-hidden">
          <ExerciseImage
            src={exercise.imageUrl}
            alt={exercise.name}
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="transition-transform group-hover:scale-105"
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
            {primaryMuscle && (
              <span className="inline-flex items-center rounded-pill px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground">
                {primaryMuscle.name}
              </span>
            )}
            {primaryEquipment && (
              <span className="inline-flex items-center rounded-pill px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground">
                {primaryEquipment.name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});
