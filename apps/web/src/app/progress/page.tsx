import { apiFetch, ApiClientError } from "@/lib/api/client";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { ProgressChartClient } from "@/components/dashboard/ProgressChartClient";
import { MuscleCard } from "@/components/dashboard/MuscleCard";
import { DurationChartClient } from "@/components/progress/DurationChartClient";
import { ActivityHeatmapClient } from "@/components/progress/ActivityHeatmapClient";
import { ShareProgressButton } from "@/components/progress/ShareProgressButton";
import type { DashboardSummaryDto } from "@fitflow/types";

export default async function ProgressPage() {
  try {
    const summary = await apiFetch<DashboardSummaryDto>("/workout-sessions/summary");

    const metrics = {
      diasEstaSemana: summary.diasEstaSemana,
      treinosNoMes: summary.treinosNoMes,
      treinosNoMesDelta: summary.treinosNoMesDelta,
      diasSequencia: summary.diasSequencia,
      volumeSemanal: summary.volumeSemanal,
    };

    return (
      <div className="flex flex-col">
        <div className="flex justify-end px-5 pt-4 lg:px-7 lg:pt-6">
          <ShareProgressButton summary={summary} />
        </div>

        <MetricsStrip metrics={metrics} />

        {/* DESKTOP */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_340px] lg:gap-5 lg:p-7 lg:pt-6">
          <div className="flex flex-col gap-4">
            <ProgressChartClient data={summary.volumeData} className="min-h-[280px]" />
            <DurationChartClient
              data={summary.durationData}
              semanalDuracao={summary.semanalDuracao}
              className="min-h-[280px]"
            />
          </div>
          <div className="flex flex-col gap-4">
            <MuscleCard muscles={summary.muscleGroups} />
            <ActivityHeatmapClient data={summary.heatmapData} />
          </div>
        </div>

        {/* TABLET */}
        <div className="hidden md:flex lg:hidden flex-col gap-4 p-5 pt-5">
          <ProgressChartClient data={summary.volumeData} className="min-h-[220px]" />
          <DurationChartClient
            data={summary.durationData}
            semanalDuracao={summary.semanalDuracao}
            className="min-h-[220px]"
          />
          <div className="grid grid-cols-2 gap-4">
            <MuscleCard muscles={summary.muscleGroups} />
            <ActivityHeatmapClient data={summary.heatmapData} />
          </div>
        </div>

        {/* MOBILE */}
        <div className="md:hidden flex flex-col pb-4">
          <section className="px-5 pt-4 pb-5">
            <ProgressChartClient data={summary.volumeData} className="min-h-[200px]" />
          </section>
          <section className="px-5 pb-5">
            <DurationChartClient
              data={summary.durationData}
              semanalDuracao={summary.semanalDuracao}
              className="min-h-[200px]"
            />
          </section>
          <section className="px-5 pb-5">
            <MuscleCard muscles={summary.muscleGroups} />
          </section>
          <section className="px-5 pb-5">
            <ActivityHeatmapClient data={summary.heatmapData} />
          </section>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      return (
        <div className="p-4 text-center text-destructive">
          Sessão expirada. Faça login novamente.
        </div>
      );
    }
    return (
      <div className="p-4 text-center text-destructive">
        Erro ao carregar progresso.
      </div>
    );
  }
}
