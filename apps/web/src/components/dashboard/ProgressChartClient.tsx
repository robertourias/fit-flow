"use client";

import dynamic from "next/dynamic";
import type { VolumeData } from "@/lib/mock/dashboard";

// ssr: false defers recharts (~80 KB) from the initial bundle — only valid in a Client Component
const ProgressChart = dynamic(
  () =>
    import("@/components/dashboard/ProgressChart").then((m) => ({
      default: m.ProgressChart,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="bg-card rounded-xl border border-border animate-pulse h-full min-h-[160px]" />
    ),
  }
);

interface Props {
  data: VolumeData[];
  className?: string;
}

export function ProgressChartClient({ data, className }: Props) {
  return <ProgressChart data={data} className={className} />;
}
