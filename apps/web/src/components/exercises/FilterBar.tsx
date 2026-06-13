"use client";

import { Search, SlidersHorizontal, Grid2x2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MuscleGroupDto, EquipmentDto } from "@fitflow/types";

export type ExerciseTypeFilter = "Todos" | "Força" | "Cardio";

const typeOptions: ExerciseTypeFilter[] = ["Todos", "Força", "Cardio"];

interface FilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  muscleGroups: MuscleGroupDto[];
  muscleGroupSlug?: string;
  onMuscleGroupSlug: (slug?: string) => void;
  equipment: EquipmentDto[];
  equipmentSlug?: string;
  onEquipmentSlug: (slug?: string) => void;
  type: ExerciseTypeFilter;
  onType: (v: ExerciseTypeFilter) => void;
  totalCount: number;
  isLoading: boolean;
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
  muscleGroups,
  muscleGroupSlug,
  onMuscleGroupSlug,
  equipment,
  equipmentSlug,
  onEquipmentSlug,
  type,
  onType,
  totalCount,
  isLoading,
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

      {/* Muscle group filter */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-semibold text-muted-foreground w-[56px] shrink-0">
          Músculo
        </span>
        <div className="flex gap-1.5 flex-wrap">
          <PillChip
            label="Todos"
            active={!muscleGroupSlug}
            onClick={() => onMuscleGroupSlug(undefined)}
          />
          {muscleGroups.map((mg) => (
            <PillChip
              key={mg.id}
              label={mg.name}
              active={muscleGroupSlug === mg.slug}
              onClick={() => onMuscleGroupSlug(mg.slug)}
            />
          ))}
        </div>
      </div>

      {/* Equipment filter */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-semibold text-muted-foreground w-[56px] shrink-0">
          Equip.
        </span>
        <div className="flex gap-1.5 flex-wrap">
          <PillChip
            label="Todos"
            active={!equipmentSlug}
            onClick={() => onEquipmentSlug(undefined)}
          />
          {equipment.map((eq) => (
            <PillChip
              key={eq.id}
              label={eq.name}
              active={equipmentSlug === eq.slug}
              onClick={() => onEquipmentSlug(eq.slug)}
            />
          ))}
        </div>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto scrollbar-none">
        <span className="text-[11px] font-semibold text-muted-foreground w-[56px] shrink-0">
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
          {isLoading ? "Carregando..." : `${totalCount} exercício${totalCount === 1 ? "" : "s"}`}
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
