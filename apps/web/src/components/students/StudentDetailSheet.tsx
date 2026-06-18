"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { ProgressChartClient } from "@/components/dashboard/ProgressChartClient";
import { MuscleCard } from "@/components/dashboard/MuscleCard";
import { DurationChartClient } from "@/components/progress/DurationChartClient";
import { ActivityHeatmapClient } from "@/components/progress/ActivityHeatmapClient";
import { useStudentDashboard } from "@/lib/api/hooks/use-student-dashboard";
import { CreateStudentRoutineForm } from "./CreateStudentRoutineForm";

interface StudentDetailSheetProps {
  studentId: string;
  studentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentDetailSheet({ studentId, studentName, open, onOpenChange }: StudentDetailSheetProps) {
  const { data: summary, isLoading, isError } = useStudentDashboard(studentId);
  const [tab, setTab] = useState<"dashboard" | "routine">("dashboard");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{studentName}</SheetTitle>
        </SheetHeader>

        <div className="flex gap-2 border-b border-border mt-4" role="tablist" aria-label="Detalhe do aluno">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "dashboard"}
            className={`px-3 py-2 text-sm font-medium border-b-2 ${tab === "dashboard" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
            onClick={() => setTab("dashboard")}
          >
            Progresso
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "routine"}
            className={`px-3 py-2 text-sm font-medium border-b-2 ${tab === "routine" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
            onClick={() => setTab("routine")}
          >
            Criar rotina
          </button>
        </div>

        {tab === "dashboard" && (
          <div className="flex flex-col gap-4 pt-4">
            {isLoading && (
              <div className="flex flex-col gap-3">
                <div className="h-24 rounded-l bg-muted animate-pulse" />
                <div className="h-40 rounded-l bg-muted animate-pulse" />
              </div>
            )}
            {isError && (
              <p className="text-sm text-destructive">Não foi possível carregar o progresso do aluno.</p>
            )}
            {summary && (
              <>
                <MetricsStrip
                  metrics={{
                    diasEstaSemana: summary.diasEstaSemana,
                    treinosNoMes: summary.treinosNoMes,
                    treinosNoMesDelta: summary.treinosNoMesDelta,
                    diasSequencia: summary.diasSequencia,
                    volumeSemanal: summary.volumeSemanal,
                  }}
                />
                <ProgressChartClient data={summary.volumeData} className="min-h-[200px]" />
                <DurationChartClient
                  data={summary.durationData}
                  semanalDuracao={summary.semanalDuracao}
                  className="min-h-[200px]"
                />
                <MuscleCard muscles={summary.muscleGroups} />
                <ActivityHeatmapClient data={summary.heatmapData} />
              </>
            )}
          </div>
        )}

        {tab === "routine" && (
          <div className="pt-4">
            <CreateStudentRoutineForm studentId={studentId} onCreated={() => setTab("dashboard")} />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
