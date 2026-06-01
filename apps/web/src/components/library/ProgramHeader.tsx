import Image from "next/image";
import { Ellipsis } from "lucide-react";
import type { TrainingProgram } from "@/lib/mock/library";

interface ProgramHeaderProps {
  program: TrainingProgram;
}

export function ProgramHeader({ program }: ProgramHeaderProps) {
  return (
    <div className="flex items-center gap-4 md:gap-5 px-5 md:px-6 py-4 md:py-5 bg-card border-b border-border">
      {/* Program image */}
      <div className="relative h-[72px] w-[72px] md:h-20 md:w-20 rounded-l overflow-hidden shrink-0">
        <Image
          src={program.image}
          alt={program.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
          {program.name}
        </h1>
        <div className="flex flex-wrap gap-1.5">
          {program.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-pill bg-accent text-accent-foreground px-2.5 py-1 text-xs font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* More button */}
      <button
        className="h-9 w-9 rounded-m bg-muted flex items-center justify-center shrink-0 hover:bg-muted/80 transition-colors"
        aria-label="Mais opções"
      >
        <Ellipsis className="h-[18px] w-[18px] text-muted-foreground" />
      </button>
    </div>
  );
}
