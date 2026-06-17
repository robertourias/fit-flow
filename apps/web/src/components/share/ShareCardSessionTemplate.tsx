import { Dumbbell, ListChecks, TrendingUp } from "lucide-react";
import { differenceInMinutes, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { WorkoutSessionDetailDto } from "@fitflow/types";
import { computeSessionVolume } from "@/lib/training/session-volume";

interface ShareCardSessionTemplateProps {
  session: WorkoutSessionDetailDto;
}

export function ShareCardSessionTemplate({ session }: ShareCardSessionTemplateProps) {
  const startedAt = parseISO(session.startedAt);
  const formattedDate = format(startedAt, "d 'de' MMMM", { locale: ptBR });
  const durationMinutes = session.endedAt
    ? differenceInMinutes(parseISO(session.endedAt), startedAt)
    : 0;
  const totalVolume = computeSessionVolume(session.exercises);
  const exerciseCount = session.exercises.length;

  return (
    <div
      className="w-[1080px] h-[1350px] flex flex-col justify-between p-16 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground"
      style={{ width: 1080, height: 1350 }}
    >
      <div className="flex flex-col gap-2">
        <span className="text-3xl font-semibold uppercase tracking-wide text-primary-foreground/80">
          {formattedDate}
        </span>
        <span className="text-7xl font-bold">{session.workoutName}</span>
        <span className="text-2xl text-primary-foreground/80">treino concluído</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2 rounded-l bg-white/10 p-6">
          <TrendingUp className="h-8 w-8" />
          <span className="text-5xl font-bold">{durationMinutes} min</span>
          <span className="text-xl text-primary-foreground/80">duração</span>
        </div>
        <div className="flex flex-col gap-2 rounded-l bg-white/10 p-6">
          <ListChecks className="h-8 w-8" />
          <span className="text-5xl font-bold">{exerciseCount}</span>
          <span className="text-xl text-primary-foreground/80">exercícios</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-l bg-white/10 p-6">
        <Dumbbell className="h-8 w-8" />
        <span className="text-5xl font-bold">{totalVolume} kg</span>
        <span className="text-xl text-primary-foreground/80">volume total</span>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Dumbbell className="h-7 w-7" />
        <span className="font-bold text-2xl">FitFlow</span>
      </div>
    </div>
  );
}

export default ShareCardSessionTemplate;
