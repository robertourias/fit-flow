import Link from "next/link";
import { ArrowLeft, Bookmark, Share2, Plus, EllipsisVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExerciseImage } from "@/components/exercises/ExerciseImage";
import type { ExerciseDto } from "@fitflow/types";

interface ExerciseDetailProps {
  exercise: ExerciseDto;
}

export function ExerciseDetail({ exercise }: ExerciseDetailProps) {
  const primaryMuscles = exercise.muscleGroups.filter((m) => m.isPrimary).map((m) => m.name);
  const secondaryMuscles = exercise.muscleGroups.filter((m) => !m.isPrimary).map((m) => m.name);
  const allMuscleGroups = exercise.muscleGroups.map((m) => m.name);
  const equipmentNames = exercise.equipment.map((e) => e.name);
  const headerMuscleGroup = primaryMuscles[0] ?? allMuscleGroups[0] ?? "—";

  return (
    <div className="flex flex-col relative min-h-full">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-4 bg-card border-b border-border">
        <Link
          href="/exercises"
          className="h-9 w-9 rounded-m bg-muted flex items-center justify-center shrink-0 hover:bg-muted/80 transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-[18px] w-[18px] text-foreground" />
        </Link>
        <h1 className="flex-1 font-bold text-lg leading-tight text-foreground">
          {exercise.name}
        </h1>
        <button
          className="h-9 w-9 rounded-m bg-muted flex items-center justify-center shrink-0"
          aria-label="Mais opções"
        >
          <EllipsisVertical className="h-[18px] w-[18px] text-foreground" />
        </button>
      </header>

      {/* Image area */}
      <div className="relative h-[220px] w-full overflow-hidden">
        <ExerciseImage src={exercise.imageUrl} alt={exercise.name} sizes="100vw" priority />
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 px-5 py-3 bg-card border-b border-border">
        <span className="flex-1 text-[13px] text-muted-foreground">
          Exercícios de {headerMuscleGroup}
        </span>
        <button className="flex items-center gap-1.5 text-[12px] text-foreground">
          <Bookmark className="h-4 w-4 text-muted-foreground" />
          —
        </button>
        <button className="flex items-center gap-1.5 text-[12px] text-foreground">
          <Share2 className="h-4 w-4 text-muted-foreground" />
          Compartilhar
        </button>
      </div>

      {/* Body section */}
      <div className="flex bg-card border-b border-border" style={{ minHeight: 220 }}>
        {/* Muscle silhouette placeholder */}
        <div className="w-[180px] shrink-0 flex flex-col items-center justify-center gap-3 p-4 border-r border-border">
          <div className="flex gap-2">
            {/* Front */}
            <div className="bg-muted rounded-l w-[70px] h-[120px] flex flex-col items-center justify-center gap-1 p-2">
              <span className="text-[9px] font-semibold text-muted-foreground">FRENTE</span>
              <div className="text-center">
                {primaryMuscles.slice(0, 2).map((m) => (
                  <p key={m} className="text-[8px] text-primary font-medium leading-snug">{m}</p>
                ))}
              </div>
            </div>
            {/* Back */}
            <div className="bg-muted rounded-l w-[70px] h-[120px] flex flex-col items-center justify-center gap-1 p-2">
              <span className="text-[9px] font-semibold text-muted-foreground">COSTAS</span>
              <div className="text-center">
                {secondaryMuscles.slice(0, 2).map((m) => (
                  <p key={m} className="text-[8px] text-muted-foreground leading-snug">{m}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col flex-1">
          <div className="px-3 pt-2.5 pb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Informações
            </span>
          </div>

          {[
            { label: "GRUPO MUSCULAR", value: allMuscleGroups.join(", ") || "—" },
            { label: "EQUIPAMENTO", value: equipmentNames.join(", ") || "—" },
            { label: "MÚSC. PRIMÁRIOS", value: primaryMuscles.join(", ") || "—" },
            { label: "MÚSC. SECUNDÁRIOS", value: secondaryMuscles.join(", ") || "—" },
          ].map(({ label, value }) => (
            <div key={label} className="px-3 py-2 border-t border-border flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </span>
              <span className="text-[13px] text-foreground leading-tight">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA — fixed bottom */}
      <div className="sticky bottom-0 left-0 right-0 bg-card border-t border-border px-5 py-4 pb-8 mt-auto">
        <Button
          className="w-full h-12 rounded-m gap-2 font-bold"
          disabled
        >
          <Plus className="h-4 w-4" />
          Adicionar ao Treino
        </Button>
      </div>
    </div>
  );
}
