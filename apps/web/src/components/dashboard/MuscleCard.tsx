import { cn } from "@/lib/utils";
import type { MuscleGroup } from "@/lib/mock/dashboard";

interface MuscleCardProps {
  muscles: MuscleGroup[];
  className?: string;
}

export function MuscleCard({ muscles, className }: MuscleCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-xl border border-border p-5 flex flex-col gap-3.5",
      className
    )}>
      <h2 className="text-base font-semibold">Grupos musculares esta semana</h2>

      <div className="flex flex-col gap-3">
        {muscles.map(({ nome, percentual }) => (
          <div key={nome} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-foreground">{nome}</span>
              <span className="text-[13px] font-semibold text-primary">{percentual}%</span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 w-full rounded-pill bg-accent overflow-hidden">
              <div
                className="h-full rounded-pill bg-primary transition-all"
                style={{ width: `${percentual}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
