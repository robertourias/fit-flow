import { Dumbbell, Flame, TrendingUp } from "lucide-react";
import type { DashboardSummaryDto } from "@fitflow/types";

interface ShareCardProgressTemplateProps {
  summary: DashboardSummaryDto;
}

export function ShareCardProgressTemplate({ summary }: ShareCardProgressTemplateProps) {
  const topMuscleGroups = [...summary.muscleGroups]
    .sort((a, b) => b.percentual - a.percentual)
    .slice(0, 3);

  return (
    <div
      className="w-[1080px] h-[1350px] flex flex-col justify-between p-16 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground"
      style={{ width: 1080, height: 1350 }}
    >
      <div className="flex flex-col gap-2">
        <span className="text-3xl font-semibold uppercase tracking-wide text-primary-foreground/80">
          Esta semana
        </span>
        <span className="text-7xl font-bold">{summary.volumeSemanal} kg</span>
        <span className="text-2xl text-primary-foreground/80">volume treinado</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2 rounded-l bg-white/10 p-6">
          <Flame className="h-8 w-8" />
          <span className="text-5xl font-bold">{summary.diasSequencia}</span>
          <span className="text-xl text-primary-foreground/80">dias de sequência</span>
        </div>
        <div className="flex flex-col gap-2 rounded-l bg-white/10 p-6">
          <Dumbbell className="h-8 w-8" />
          <span className="text-5xl font-bold">{summary.treinosNoMes}</span>
          <span className="text-xl text-primary-foreground/80">treinos no mês</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-7 w-7" />
          <span className="text-2xl font-semibold">Grupos musculares em destaque</span>
        </div>
        <div className="flex flex-col gap-3">
          {topMuscleGroups.map(({ nome, percentual }) => (
            <div key={nome} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xl">{nome}</span>
                <span className="text-xl font-semibold">{percentual}%</span>
              </div>
              <div className="h-3 w-full rounded-pill bg-white/20 overflow-hidden">
                <div
                  className="h-full rounded-pill bg-white"
                  style={{ width: `${percentual}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Dumbbell className="h-7 w-7" />
        <span className="font-bold text-2xl">FitFlow</span>
      </div>
    </div>
  );
}

export default ShareCardProgressTemplate;
