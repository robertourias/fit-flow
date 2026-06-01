"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grade" | "lista";

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-m p-0.5">
      <button
        onClick={() => onChange("grade")}
        className={cn(
          "h-7 w-7 flex items-center justify-center rounded-s transition-colors",
          mode === "grade"
            ? "bg-primary text-white"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Visualização em grade"
        aria-pressed={mode === "grade"}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => onChange("lista")}
        className={cn(
          "h-7 w-7 flex items-center justify-center rounded-s transition-colors",
          mode === "lista"
            ? "bg-primary text-white"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Visualização em lista"
        aria-pressed={mode === "lista"}
      >
        <List className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
