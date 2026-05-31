import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { TreinoCard } from "@/components/dashboard/TreinoCard";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { CalendarSection } from "@/components/dashboard/CalendarSection";
import { UpcomingCard } from "@/components/dashboard/UpcomingCard";
import { MuscleCard } from "@/components/dashboard/MuscleCard";
import {
  mockMetrics,
  mockTreinoHoje,
  mockVolumeData,
  mockTreinoDates,
  mockMuscleGroups,
  mockUpcomingWorkouts,
} from "@/lib/mock/dashboard";

export default function DashboardPage() {
  return (
    <div className="flex flex-col">
      {/* Metrics strip */}
      <MetricsStrip metrics={mockMetrics} />

      {/* ── DESKTOP (lg+) ──────────────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_340px] lg:gap-5 lg:flex-1 lg:min-h-0 lg:p-7 lg:pt-6">
        <div className="flex flex-col gap-4 min-h-0">
          <div className="grid grid-cols-[1fr_300px] gap-4 min-h-[282px]">
            <TreinoCard treino={mockTreinoHoje} className="h-full" />
            <UpcomingCard workouts={mockUpcomingWorkouts} className="h-full" />
          </div>
          <ProgressChart data={mockVolumeData} className="flex-1 min-h-[329px]" />
        </div>
        <div className="flex flex-col gap-4 min-h-0">
          <CalendarSection trainDates={mockTreinoDates} />
          <MuscleCard muscles={mockMuscleGroups} className="flex-1" />
        </div>
      </div>

      {/* ── TABLET (md to lg) ──────────────────────────────────────── */}
      <div className="hidden md:flex lg:hidden flex-col gap-4 p-5 pt-5">
        <div className="grid grid-cols-[1fr_280px] gap-4 min-h-[282px]">
          <TreinoCard treino={mockTreinoHoje} className="h-full" />
          <UpcomingCard workouts={mockUpcomingWorkouts} className="h-full" />
        </div>
        <ProgressChart data={mockVolumeData} className="min-h-[220px]" />
        <div className="grid grid-cols-2 gap-4">
          <CalendarSection trainDates={mockTreinoDates} />
          <MuscleCard muscles={mockMuscleGroups} />
        </div>
      </div>

      {/* ── MOBILE (< md) ──────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col pb-4">
        <section className="px-5 pt-4 pb-5 flex flex-col gap-3">
          <h2 className="text-base font-semibold">Treino de hoje</h2>
          <TreinoCard treino={mockTreinoHoje} />
        </section>
        <section className="px-5 pb-5">
          <ProgressChart data={mockVolumeData} className="min-h-[200px]" />
        </section>
        <section className="px-5 pb-5">
          <CalendarSection trainDates={mockTreinoDates} />
        </section>
        <section className="px-5 pb-5">
          <MuscleCard muscles={mockMuscleGroups} />
        </section>
      </div>
    </div>
  );
}
