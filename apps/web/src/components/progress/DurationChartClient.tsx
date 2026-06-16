"use client";

import dynamic from "next/dynamic";
import type { DurationDataDto } from "@fitflow/types";

const DurationChart = dynamic(
  () => import("@/components/progress/DurationChart").then((m) => ({ default: m.DurationChart })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-card rounded-xl border border-border animate-pulse h-full min-h-[160px]" />
    ),
  }
);

interface Props {
  data: DurationDataDto[];
  semanalDuracao: number;
  className?: string;
}

export function DurationChartClient({ data, semanalDuracao, className }: Props) {
  return <DurationChart data={data} semanalDuracao={semanalDuracao} className={className} />;
}
