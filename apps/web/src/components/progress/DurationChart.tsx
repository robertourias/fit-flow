"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { DurationDataDto } from "@fitflow/types";

interface DurationChartProps {
  data: DurationDataDto[];
  semanalDuracao: number;
  className?: string;
}

function useChartColors() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";
  return useMemo(
    () => ({
      primary: "#10B981",
      primaryMuted: isDark ? "#10B98133" : "#10B98122",
      grid: isDark ? "#1C3550" : "#E2E8F0",
      axis: isDark ? "#7BA4C0" : "#4F6278",
      card: isDark ? "#0D1D2E" : "#FFFFFF",
      border: isDark ? "#1C3550" : "#E2E8F0",
      foreground: isDark ? "#D9EAF7" : "#0F172A",
    }),
    [isDark]
  );
}

function formatMinutes(minutes: number): string {
  if (minutes === 0) return "—";
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function DurationChart({ data, semanalDuracao, className }: DurationChartProps) {
  const colors = useChartColors();

  return (
    <div className={`bg-card rounded-xl border border-border p-5 flex flex-col gap-4 ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Duração semanal</h2>
        <span className="text-sm text-muted-foreground">{formatMinutes(semanalDuracao)}</span>
      </div>

      <div className="flex-1 min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 16, left: 0 }}
            barCategoryGap="28%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="dia"
              tick={{ fill: colors.axis, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => (v === 0 ? "0" : `${v}min`)}
              tick={{ fill: colors.axis, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              cursor={{ fill: colors.primaryMuted, radius: 4 }}
              contentStyle={{
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: "8px",
                fontSize: 12,
                color: colors.foreground,
              }}
              formatter={(value) => {
                const v = Number(value ?? 0);
                return v ? [formatMinutes(v), "Duração"] : ["—", "Duração"];
              }}
            />
            <Bar dataKey="totalMinutos" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {data.map((entry) => (
                <Cell
                  key={entry.dia}
                  fill={entry.totalMinutos > 0 ? colors.primary : colors.primaryMuted}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-center text-[11px] font-medium text-muted-foreground">Dias da semana</p>
    </div>
  );
}
