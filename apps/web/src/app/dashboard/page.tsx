import { apiFetch, ApiClientError } from "@/lib/api/client";
import { MetricsStrip } from "@/components/dashboard/MetricsStrip";
import { TreinoCard } from "@/components/dashboard/TreinoCard";
import { ProgressChartClient as ProgressChart } from "@/components/dashboard/ProgressChartClient";
import { CalendarSection } from "@/components/dashboard/CalendarSection";
import { UpcomingCard } from "@/components/dashboard/UpcomingCard";
import { MuscleCard } from "@/components/dashboard/MuscleCard";
import type { UserMeDto, DashboardSummaryDto, ActiveWorkoutDto } from "@fitflow/types";

export default async function DashboardPage() {
  try {
    const [user, summary, activeWorkout] = await Promise.all([
      apiFetch<UserMeDto>("/users/me"),
      apiFetch<DashboardSummaryDto>("/workout-sessions/summary"),
      apiFetch<ActiveWorkoutDto | null>("/strategies/active-workout"),
    ]);

    const metrics = {
      diasEstaSemana: summary.diasEstaSemana,
      treinosNoMes: summary.treinosNoMes,
      treinosNoMesDelta: summary.treinosNoMesDelta,
      diasSequencia: summary.diasSequencia,
      volumeSemanal: summary.volumeSemanal,
    };

    const treinoHoje = activeWorkout ? {
      estrategia: activeWorkout.estrategiaNome,
      nome: activeWorkout.workout.nome,
      exercicios: activeWorkout.workout.exercicios,
      diaDaSemana: "—",
      duracao: "—",
    } : null;

    const upcomingWorkouts = activeWorkout?.proximos.map((p, i) => ({
      dayAbbr: "—",
      dayNum: i + 1,
      treino: p.nome,
      numExercicios: p.numExercicios,
      hasWorkout: true,
    })) ?? [];

    const dashboardUser = {
      name: user.name,
      initials: user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
      email: user.email,
      plan: user.plan,
      planUsed: summary.workoutsCount,
      planLimit: 6,
    };

    return (
      <div className="flex flex-col">
        {/* Metrics strip */}
        <MetricsStrip metrics={metrics} />

        {/* ── DESKTOP (lg+) ──────────────────────────────────────────── */}
        <div className="hidden lg:grid lg:grid-cols-[1fr_340px] lg:gap-5 lg:flex-1 lg:min-h-0 lg:p-7 lg:pt-6">
          <div className="flex flex-col gap-4 min-h-0">
            <div className="grid grid-cols-[1fr_300px] gap-4 min-h-[282px]">
              <TreinoCard treino={treinoHoje} className="h-full" />
              <UpcomingCard workouts={upcomingWorkouts} className="h-full" />
            </div>
            <ProgressChart data={summary.volumeData} className="flex-1 min-h-[329px]" />
          </div>
          <div className="flex flex-col gap-4 min-h-0">
            <CalendarSection trainDates={summary.trainDates} />
            <MuscleCard muscles={summary.muscleGroups} className="flex-1" />
          </div>
        </div>

        {/* ── TABLET (md to lg) ──────────────────────────────────────── */}
        <div className="hidden md:flex lg:hidden flex-col gap-4 p-5 pt-5">
          <div className="grid grid-cols-[1fr_280px] gap-4 min-h-[282px]">
            <TreinoCard treino={treinoHoje} className="h-full" />
            <UpcomingCard workouts={upcomingWorkouts} className="h-full" />
          </div>
          <ProgressChart data={summary.volumeData} className="min-h-[220px]" />
          <div className="grid grid-cols-2 gap-4">
            <CalendarSection trainDates={summary.trainDates} />
            <MuscleCard muscles={summary.muscleGroups} />
          </div>
        </div>

        {/* ── MOBILE (< md) ──────────────────────────────────────────── */}
        <div className="md:hidden flex flex-col pb-4">
          <section className="px-5 pt-4 pb-5 flex flex-col gap-3">
            <h2 className="text-base font-semibold">Treino de hoje</h2>
            <TreinoCard treino={treinoHoje} />
          </section>
          <section className="px-5 pb-5">
            <ProgressChart data={summary.volumeData} className="min-h-[200px]" />
          </section>
          <section className="px-5 pb-5">
            <CalendarSection trainDates={summary.trainDates} />
          </section>
          <section className="px-5 pb-5">
            <MuscleCard muscles={summary.muscleGroups} />
          </section>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      return <div className="p-4 text-center text-destructive">Sessão expirada. Faça login novamente.</div>;
    }
    return <div className="p-4 text-center text-destructive">Erro ao carregar dashboard.</div>;
  }
}
