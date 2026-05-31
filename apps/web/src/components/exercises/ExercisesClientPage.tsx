"use client";

import { useState, useMemo } from "react";
import { FilterBar } from "@/components/exercises/FilterBar";
import { ExerciseCard } from "@/components/exercises/ExerciseCard";
import { useDebounce } from "@/lib/hooks/useDebounce";
import type { Exercise, ExerciseType } from "@/lib/mock/exercises";

interface ExercisesClientPageProps {
  exercises: Exercise[];
}

export function ExercisesClientPage({ exercises }: ExercisesClientPageProps) {
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("todos");
  const [equipment, setEquipment] = useState("Todos");
  const [type, setType] = useState<"Todos" | ExerciseType>("Todos");

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(
    () =>
      exercises.filter((e) => {
        const matchSearch =
          !debouncedSearch ||
          e.name.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchMuscle = muscle === "todos" || e.muscleGroup === muscle;
        const matchEquip = equipment === "Todos" || e.equipment === equipment;
        const matchType = type === "Todos" || e.type === type;
        return matchSearch && matchMuscle && matchEquip && matchType;
      }),
    [exercises, debouncedSearch, muscle, equipment, type]
  );

  return (
    <div className="flex flex-col h-full">
      <FilterBar
        search={search}
        onSearch={setSearch}
        muscle={muscle}
        onMuscle={setMuscle}
        equipment={equipment}
        onEquipment={setEquipment}
        type={type}
        onType={setType}
        totalCount={filtered.length}
        totalAll={exercises.length}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 py-16 text-center px-6">
          <span className="text-4xl">🔍</span>
          <p className="font-semibold text-foreground">Nenhum exercício encontrado</p>
          <p className="text-sm text-muted-foreground">Tente ajustar os filtros ou a busca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4 md:p-5">
          {filtered.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      )}
    </div>
  );
}
