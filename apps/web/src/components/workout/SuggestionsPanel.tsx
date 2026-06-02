import Image from "next/image";
import { mockExercises } from "@/lib/mock/exercises";

interface SuggestionsPanelProps {
  muscleGroups: string[];
}

export function SuggestionsPanel({ muscleGroups }: SuggestionsPanelProps) {
  const suggestions = mockExercises
    .filter((ex) =>
      muscleGroups.some(
        (g) =>
          ex.muscleGroup.toLowerCase().includes(g.toLowerCase()) ||
          g.toLowerCase().includes(ex.muscleGroup.toLowerCase())
      )
    )
    .slice(0, 8);

  const list = suggestions.length > 0 ? suggestions : mockExercises.slice(0, 6);

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          Músculo selecionado
        </h2>
        <p className="text-[13px] font-medium mt-0.5 truncate">
          {muscleGroups.slice(0, 3).join(", ")}
        </p>
      </div>

      <div className="flex flex-col">
        {list.map((ex) => (
          <button
            key={ex.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors text-left border-b border-border/50"
          >
            <div className="relative h-10 w-10 rounded-m overflow-hidden shrink-0">
              <Image
                src={ex.image}
                alt={ex.name}
                fill
                sizes="40px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium leading-tight truncate">{ex.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {ex.primaryMuscles.slice(0, 2).join(", ")}
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground shrink-0">{ex.bookmarkCount}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
