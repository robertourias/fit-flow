"use client";

import { Search, SlidersHorizontal, Grid2x2 } from "lucide-react";
import { MuscleChip } from "@/components/exercises/MuscleChip";
import { cn } from "@/lib/utils";
import { muscleGroups, equipmentOptions, typeOptions } from "@/lib/mock/exercises";
import type { ExerciseType } from "@/lib/mock/exercises";

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  muscle: string;
  onMuscle: (v: string) => void;
  equipment: string;
  onEquipment: (v: string) => void;
  type: "Todos" | ExerciseType;
  onType: (v: "Todos" | ExerciseType) => void;
  totalCount: number;
  totalAll: number;
}

function PillChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium transition-colors shrink-0",
        active
          ? "bg-primary text-white"
          : "bg-muted text-muted-foreground border border-border hover:bg-accent"
      )}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export function FilterBar({
  search,
  onSearch,
  muscle,
  onMuscle,
  equipment,
  onEquipment,
  type,
  onType,
  totalCount,
  totalAll,
}: FilterBarProps) {
  return (
    <div className="flex flex-col border-b border-border bg-card md:bg-background">
      {/* Search row */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/50">
        <div className="flex-1 flex items-center gap-2 bg-background rounded-m border border-border px-3 py-2">
          <Search className="h-[15px] w-[15px] text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Buscar exercício..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <button
          className="h-[38px] w-[38px] rounded-m bg-primary flex items-center justify-center shrink-0"
          aria-label="Filtros"
        >
          <SlidersHorizontal className="h-4 w-4 text-white" />
        </button>
      </div>

      {/* Muscle chips — horizontal scroll */}
      <div className="flex items-center gap-3 px-4 py-2 overflow-x-auto scrollbar-none border-b border-border">
        {muscleGroups.map((g) => (
          <MuscleChip
            key={g.id}
            label={g.label}
            image={g.image}
            active={muscle === g.id}
            onClick={() => onMuscle(g.id)}
          />
        ))}
      </div>

      {/* Equipment filter */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-semibold text-muted-foreground w-[52px] shrink-0">
          Equip.
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {equipmentOptions.map((opt) => (
            <PillChip
              key={opt}
              label={opt}
              active={equipment === opt}
              onClick={() => onEquipment(opt)}
            />
          ))}
        </div>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-semibold text-muted-foreground w-[52px] shrink-0">
          Tipo
        </span>
        <div className="flex gap-1.5">
          {typeOptions.map((opt) => (
            <PillChip
              key={opt}
              label={opt}
              active={type === opt}
              onClick={() => onType(opt)}
            />
          ))}
        </div>
      </div>

      {/* Count row */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[13px] text-muted-foreground">
          {totalCount === totalAll ? `${totalAll} exercícios` : `${totalCount} de ${totalAll} exercícios`}
        </span>
        <button
          className="h-7 w-7 rounded-s bg-primary flex items-center justify-center"
          aria-label="Ver em grade"
        >
          <Grid2x2 className="h-3.5 w-3.5 text-white" />
        </button>
      </div>
    </div>
  );
}
