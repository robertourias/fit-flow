"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ProgramHeader } from "@/components/library/ProgramHeader";
import { WorkoutCard } from "@/components/library/WorkoutCard";
import { WorkoutListRow } from "@/components/library/WorkoutListRow";
import { ViewToggle, type ViewMode } from "@/components/library/ViewToggle";
import { LibraryPanel } from "@/components/library/LibraryPanel";
import type { TrainingProgram } from "@/lib/mock/library";

interface LibraryClientPageProps {
  program: TrainingProgram;
  templates: string[];
}

export function LibraryClientPage({ program, templates }: LibraryClientPageProps) {
  const [mode, setMode] = useState<ViewMode>("grade");

  return (
    <div className="flex h-full">
      {/* Center content — scrollable */}
      <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
        {/* Program header */}
        <ProgramHeader program={program} />

        {/* Section header */}
        <div className="flex items-center justify-between px-5 md:px-6 py-3.5 border-b border-border">
          <span className="text-[13px] font-semibold text-muted-foreground">
            Treinos
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-muted-foreground">
              {program.workouts.length} / {program.workouts.length}
            </span>
            <ViewToggle mode={mode} onChange={setMode} />
          </div>
        </div>

        {/* Grid mode */}
        {mode === "grade" && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4 md:p-5 pb-28 md:pb-0">
            {program.workouts.map((w) => (
              <WorkoutCard key={w.id} workout={w} />
            ))}
          </div>
        )}

        {/* List mode */}
        {mode === "lista" && (
          <div className="flex flex-col pb-28 md:pb-0">
            {program.workouts.map((w) => (
              <WorkoutListRow key={w.id} workout={w} />
            ))}
          </div>
        )}

        {/* Desktop CTA */}
        <div className="hidden md:flex justify-center px-6 py-5 mt-auto border-t border-border">
          <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-pill px-8 py-3 text-[15px] font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="h-[18px] w-[18px]" />
            Criar nova rotina
          </button>
        </div>
      </div>

      {/* Desktop right panel */}
      <div className="hidden lg:flex shrink-0">
        <LibraryPanel templates={templates} />
      </div>

      {/* Mobile sticky CTA — above bottom nav */}
      <div className="md:hidden fixed bottom-[88px] left-0 right-0 px-5 z-10">
        <button className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-pill h-12 text-[15px] font-semibold shadow-lg hover:bg-primary/90 transition-colors">
          <Plus className="h-[18px] w-[18px]" />
          Criar nova rotina
        </button>
      </div>
    </div>
  );
}
