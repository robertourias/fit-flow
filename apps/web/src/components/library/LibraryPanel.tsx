import { ChevronRight } from "lucide-react";

interface LibraryPanelProps {
  templates: string[];
}

export function LibraryPanel({ templates }: LibraryPanelProps) {
  return (
    <div className="flex flex-col w-[300px] shrink-0 bg-card border-l border-border h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border shrink-0">
        <span className="text-[13px] font-bold text-primary">
          Biblioteca de Treinos
        </span>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto">
        {templates.map((template) => (
          <button
            key={template}
            className="flex items-center w-full px-4 py-3 border-b border-border hover:bg-accent/50 transition-colors text-left gap-2"
          >
            <span className="flex-1 text-[13px] text-foreground">{template}</span>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
