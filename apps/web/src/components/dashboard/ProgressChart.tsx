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
import type { VolumeData } from "@/lib/mock/dashboard";

interface ProgressChartProps {
  data: VolumeData[];
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

const TICK_VALUES = [0, 2000, 4000, 6000, 8000];

function formatY(v: number) {
  if (v === 0) return "0";
  return `${v / 1000}k`;
}

function formatTooltip(value: number | string) {
  const v = Number(value);
  if (!v) return ["—", "Volume"];
  return [`${(v / 1000).toFixed(1)}k kg`, "Volume"];
}

export function ProgressChart({ data, className }: ProgressChartProps) {
  const colors = useChartColors();

  return (
    <div className={`bg-card rounded-xl border border-border p-5 flex flex-col gap-4 ${className ?? ""}`}>
      <h2 className="text-base font-semibold">Volume semanal (kg)</h2>

      <div className="flex-1 min-h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 16, left: 0 }}
            barCategoryGap="28%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={colors.grid}
              vertical={false}
            />
            <XAxis
              dataKey="dia"
              tick={{ fill: colors.axis, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              ticks={TICK_VALUES}
              tickFormatter={formatY}
              tick={{ fill: colors.axis, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={28}
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
                return v ? [`${(v / 1000).toFixed(1)}k kg`, "Volume"] : ["—", "Volume"];
              }}
            />
            <Bar dataKey="volume" radius={[4, 4, 0, 0]} maxBarSize={36}>
              {data.map((entry) => (
                <Cell
                  key={entry.dia}
                  fill={entry.volume > 0 ? colors.primary : colors.primaryMuted}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-center text-[11px] font-medium text-muted-foreground">
        Dias da semana
      </p>
    </div>
  );
}
