import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDate,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Week starts on Monday (weekStartsOn: 1) matching the design
const DOW_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface CalendarSectionProps {
  trainDates: number[];
  today?: Date;
}

export function CalendarSection({ trainDates, today: todayProp }: CalendarSectionProps) {
  const today = todayProp ?? new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const trainDateSet = new Set(trainDates);

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold capitalize">
          {format(today, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        <button className="text-[13px] font-medium text-primary hover:opacity-80 transition-opacity">
          Ver mais
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-0.5">
        {DOW_LABELS.map((d) => (
          <div key={d} className="flex items-center justify-center h-7">
            <span className="text-[11px] font-semibold text-muted-foreground">{d}</span>
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="flex flex-col gap-0.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-0.5">
            {week.map((day) => {
              const inCurrentMonth = isSameMonth(day, today);
              const dayNum = getDate(day);
              const hasTreino = inCurrentMonth && trainDateSet.has(dayNum);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className="flex items-center justify-center"
                >
                  <span
                    className={cn(
                      "h-8 w-8 flex items-center justify-center rounded-full text-xs leading-none",
                      !inCurrentMonth && "text-muted-foreground opacity-30",
                      inCurrentMonth && !hasTreino && !isCurrentDay && "text-foreground font-normal",
                      hasTreino && "bg-primary text-white font-bold",
                      isCurrentDay && !hasTreino && "bg-accent text-foreground font-normal",
                    )}
                  >
                    {dayNum}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
