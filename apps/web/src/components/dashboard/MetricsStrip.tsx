"use client";

import useEmblaCarousel from "embla-carousel-react";
import { Calendar, Dumbbell, Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardMetrics } from "@/lib/mock/dashboard";

interface MetricTile {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  unit: string;
  delta?: string;
  deltaPositive?: boolean;
}

interface TileCardProps extends MetricTile {}

function TileCard({ label, icon: Icon, value, unit, delta, deltaPositive }: TileCardProps) {
  return (
    <div className="bg-card rounded-l border border-border p-[18px] h-full flex flex-col
      /* Mobile/tablet: center-aligned, icon on top */
      items-center text-center gap-3
      /* Desktop: left-aligned, icon on right of label */
      lg:items-start lg:text-left lg:gap-2
    ">
      {/* Desktop header: label + icon */}
      <div className="hidden lg:flex items-center justify-between w-full">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>

      {/* Mobile: icon on top */}
      <Icon className="h-6 w-6 text-muted-foreground lg:hidden" />

      {/* Value + unit */}
      <div className="flex flex-col gap-0.5 items-center lg:items-start">
        <span className="text-[28px] font-bold text-primary leading-none">{value}</span>
        <span className="text-[13px] text-muted-foreground">{unit}</span>
      </div>

      {/* Mobile: label below value */}
      <span className="text-[11px] text-muted-foreground/70 lg:hidden">{label}</span>

      {/* Delta (desktop) */}
      {delta && (
        <div className={cn(
          "hidden lg:flex items-center gap-1",
          deltaPositive
            ? "text-[hsl(var(--color-success-text))]"
            : "text-[hsl(var(--color-error-text))]"
        )}>
          <TrendingUp className="h-[11px] w-[11px]" />
          <span className="text-[10px]">{delta}</span>
        </div>
      )}
    </div>
  );
}

interface MetricsStripProps {
  metrics: DashboardMetrics;
}

function formatVolume(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);
}

export function MetricsStrip({ metrics }: MetricsStripProps) {
  const [emblaRef] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });

  const tiles: MetricTile[] = [
    {
      label: "Esta semana",
      icon: Calendar,
      value: String(metrics.diasEstaSemana),
      unit: "dias de treino",
    },
    {
      label: "Este mês",
      icon: Dumbbell,
      value: String(metrics.treinosNoMes),
      unit: "treinos realizados",
      delta: `+${metrics.treinosNoMesDelta} vs mês passado`,
      deltaPositive: metrics.treinosNoMesDelta >= 0,
    },
    {
      label: "Sequência atual",
      icon: Flame,
      value: String(metrics.diasSequencia),
      unit: "dias consecutivos",
    },
    {
      label: "Volume semanal",
      icon: TrendingUp,
      value: formatVolume(metrics.volumeSemanal),
      unit: "kg treinados",
    },
  ];

  return (
    <div>
      {/* ── Desktop (lg+): 4-column grid ─────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-4 p-7 pb-0">
        {tiles.map((t) => (
          <TileCard key={t.label} {...t} />
        ))}
      </div>

      {/* ── Mobile + Tablet: Embla carousel ──────────────── */}
      {/* mobile=1 slide, tablet md=2 slides */}
      <div className="lg:hidden px-5 pt-5 pb-0">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3">
            {tiles.map((t) => (
              <div
                key={t.label}
                className="basis-[85%] md:basis-[46%] shrink-0 min-w-0"
              >
                <TileCard {...t} />
              </div>
            ))}
          </div>
        </div>
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-3">
          {tiles.map((t, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-border"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
