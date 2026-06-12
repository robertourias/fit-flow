"use client";

import type { StrategyDetailDto } from "@fitflow/types";
import { programColor } from "@/lib/utils/program-color";
import { ProgramOptionsMenu } from "@/components/library/ProgramOptionsMenu";

interface ProgramHeaderProps {
  strategy: StrategyDetailDto;
}

export function ProgramHeader({ strategy }: ProgramHeaderProps) {
  return (
    <div className="flex items-center gap-4 md:gap-5 px-5 md:px-6 py-4 md:py-5 bg-card border-b border-border">
      {/* Program image */}
      <div className="relative h-[72px] w-[72px] md:h-20 md:w-20 rounded-l overflow-hidden shrink-0">
        <div
          className="absolute inset-0"
          style={{ backgroundColor: programColor(strategy.id) }}
        />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
          {strategy.name}
        </h1>
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center rounded-pill bg-accent text-accent-foreground px-2.5 py-1 text-xs font-medium">
            {strategy.workouts.length} treinos
          </span>
          <span className="inline-flex items-center rounded-pill bg-accent text-accent-foreground px-2.5 py-1 text-xs font-medium">
            {strategy.type ?? "Personalizado"}
          </span>
        </div>
      </div>

      {/* More options menu */}
      <ProgramOptionsMenu strategy={strategy} />
    </div>
  );
}
