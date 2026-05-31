"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface MuscleChipProps {
  label: string;
  image: string;
  active: boolean;
  onClick: () => void;
}

export function MuscleChip({ label, image, active, onClick }: MuscleChipProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 w-[58px] shrink-0"
      aria-pressed={active}
    >
      <div className={cn(
        "h-11 w-11 rounded-full overflow-hidden ring-2 transition-all",
        active ? "ring-primary" : "ring-transparent opacity-70"
      )}>
        <Image
          src={image}
          alt={label}
          width={44}
          height={44}
          className="object-cover w-full h-full"
        />
      </div>
      <span className={cn(
        "text-[9px] text-center leading-none",
        active ? "text-primary font-semibold" : "text-muted-foreground"
      )}>
        {label}
      </span>
    </button>
  );
}
