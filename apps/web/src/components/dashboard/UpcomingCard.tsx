import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UpcomingWorkout } from "@/lib/mock/dashboard";

interface UpcomingCardProps {
  workouts: UpcomingWorkout[];
  className?: string;
}

export function UpcomingCard({ workouts, className }: UpcomingCardProps) {
  return (
    <div className={cn("bg-card rounded-xl border border-border p-5 flex flex-col gap-3.5", className)}>
      <h2 className="text-base font-semibold">Próximos treinos</h2>

      <div className="flex flex-col gap-0">
        {workouts.map((w, i) => (
          <div key={w.dayNum}>
            <div className="flex items-center gap-3 py-1">
              {/* Day box */}
              <div
                className={cn(
                  "flex flex-col items-center justify-center w-[38px] h-[42px] rounded-m shrink-0",
                  w.hasWorkout
                    ? "bg-[hsl(var(--color-success-bg))]"
                    : "bg-muted"
                )}
              >
                <span className={cn(
                  "text-[10px] font-semibold leading-none",
                  w.hasWorkout ? "text-primary" : "text-muted-foreground"
                )}>
                  {w.dayAbbr}
                </span>
                <span className={cn(
                  "text-base font-bold leading-tight",
                  w.hasWorkout ? "text-primary" : "text-muted-foreground"
                )}>
                  {w.dayNum}
                </span>
              </div>

              {/* Info */}
              <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                <span className={cn(
                  "text-sm font-medium leading-tight truncate",
                  !w.hasWorkout && "text-muted-foreground"
                )}>
                  {w.treino}
                </span>
                {w.numExercicios > 0 && (
                  <span className="text-[11px] text-muted-foreground">
                    {w.numExercicios} exercícios
                  </span>
                )}
              </div>

              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            </div>

            {i < workouts.length - 1 && (
              <div className="h-px bg-border w-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
