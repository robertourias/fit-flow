import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TreinoHoje } from "@/lib/mock/dashboard";

interface TreinoCardProps {
  treino: TreinoHoje;
  className?: string;
}

export function TreinoCard({ treino, className }: TreinoCardProps) {
  return (
    <div className={cn(
      "rounded-xl p-5 flex flex-col gap-4 bg-card border border-border",
      className
    )}>
      {/* Header: strategy badge + duration */}
      <div className="flex items-center gap-2 w-full">
        <span className="inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground">
          {treino.estrategia}
        </span>
        <div className="flex-1" />
        <span className="inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground">
          {treino.duracao}
        </span>
      </div>

      {/* Title block */}
      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          Treino de hoje
        </p>
        <h3 className="font-bold text-xl leading-tight text-foreground">
          {treino.nome}
        </h3>
      </div>

      {/* Exercise pills */}
      <div className="flex flex-wrap gap-2">
        {treino.exercicios.map((ex) => (
          <span
            key={ex}
            className="inline-flex items-center rounded-s px-2.5 py-1.5 text-xs bg-muted text-foreground"
          >
            {ex}
          </span>
        ))}
      </div>

      {/* Push CTA to bottom when card is stretched */}
      <div className="flex-1" />

      {/* CTA button */}
      <Button
        className="w-full h-11 rounded-m gap-2 font-bold bg-primary text-primary-foreground hover:bg-primary/90"
        disabled
      >
        <Play className="h-4 w-4 fill-current" />
        Iniciar Treino
      </Button>
    </div>
  );
}
