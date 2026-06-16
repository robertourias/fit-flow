"use client";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { HeatmapDataDto } from "@fitflow/types";

interface Props {
  data: HeatmapDataDto[];
}

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function cellColor(count: number): string {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-primary/40";
  return "bg-primary";
}

export function ActivityHeatmapClient({ data }: Props) {
  // data is 84 items, oldest first (index 0 = 83 days ago, index 83 = today)
  // Organize into 12 columns (weeks), 7 rows (Mon–Sun)
  // Each week = 7 consecutive days. Week 0 = oldest, week 11 = most recent.
  const weeks: HeatmapDataDto[][] = [];
  for (let w = 0; w < 12; w++) {
    weeks.push(data.slice(w * 7, w * 7 + 7));
  }

  // Determine month label for each week column (show when month changes)
  const monthLabels = weeks.map((week, i) => {
    const firstDay = week[0];
    if (!firstDay) return "";
    const month = firstDay.date.slice(0, 7); // "YYYY-MM"
    if (i === 0) return format(parseISO(firstDay.date), "MMM", { locale: ptBR });
    const prevWeekFirstDay = weeks[i - 1]?.[0];
    if (prevWeekFirstDay && prevWeekFirstDay.date.slice(0, 7) !== month) {
      return format(parseISO(firstDay.date), "MMM", { locale: ptBR });
    }
    return "";
  });

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-3">
      <h2 className="text-base font-semibold">Atividade</h2>

      <div className="flex gap-1">
        {/* Y-axis day labels */}
        <div className="flex flex-col gap-1 pr-1 pt-5">
          {DAY_LABELS.map((label) => (
            <div key={label} className="h-4 flex items-center">
              <span className="text-[10px] text-muted-foreground w-6 text-right">{label}</span>
            </div>
          ))}
        </div>

        {/* Grid: 12 columns */}
        <div className="flex gap-1 overflow-x-auto">
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="flex flex-col gap-1">
              {/* Month label row */}
              <div className="h-4 flex items-center">
                <span className="text-[10px] text-muted-foreground capitalize">
                  {monthLabels[wIdx]}
                </span>
              </div>
              {/* 7 day cells */}
              {week.map((day, dIdx) => (
                <div
                  key={dIdx}
                  className={`w-4 h-4 rounded-sm ${cellColor(day.count)} cursor-default`}
                  title={`${format(parseISO(day.date), "dd/MM/yyyy")} — ${day.count} sessão(ões)`}
                  aria-label={`${day.date}: ${day.count} sessão(ões)`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
