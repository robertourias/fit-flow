"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { History, LayoutGrid, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ViewToggle, type ViewMode } from "@/components/library/ViewToggle";
import { StrategyFormDialog, type StrategyFormSubmitValues } from "@/components/library/StrategyFormDialog";
import { useStrategies } from "@/lib/api/hooks/use-strategies";
import { useCreateStrategy } from "@/lib/api/hooks/use-create-strategy";
import { programColor } from "@/lib/utils/program-color";
import type { StrategySummaryDto } from "@fitflow/types";

const tabs = ["Programas", "Rotinas", "Exercícios"] as const;
type Tab = (typeof tabs)[number];

function CreateNewCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative rounded-2xl overflow-hidden aspect-square flex flex-col items-center justify-center gap-2 border border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors"
      aria-label="Criar novo programa"
    >
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <Plus className="h-5 w-5 text-muted-foreground" />
      </div>
      <span className="text-[12px] text-muted-foreground text-center px-3 leading-tight">
        Criar novo programa
      </span>
    </button>
  );
}

function ProgramCard({ program }: { program: StrategySummaryDto }) {
  return (
    <Link
      href={`/program/${program.id}`}
      className="relative rounded-2xl overflow-hidden aspect-square block group"
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: programColor(program.id) }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2.5">
        <p className="text-white font-semibold text-[13px] leading-tight truncate">
          {program.name}
        </p>
        <p className="text-white/70 text-[11px] mt-0.5">
          {program.workouts.length} rotinas
        </p>
      </div>
    </Link>
  );
}

function ProgramListRow({ program }: { program: StrategySummaryDto }) {
  return (
    <Link
      href={`/program/${program.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
    >
      <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0">
        <div className="absolute inset-0" style={{ backgroundColor: programColor(program.id) }} />
      </div>
      <div className="flex flex-col">
        <span className="text-[14px] font-semibold leading-tight">{program.name}</span>
        <span className="text-[12px] text-muted-foreground mt-0.5">
          {program.workouts.length} rotinas
        </span>
      </div>
    </Link>
  );
}

export function LibraryListPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Programas");
  const [viewMode, setViewMode] = useState<ViewMode>("grade");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { data: strategies = [], isLoading } = useStrategies();
  const createMutation = useCreateStrategy();

  const handleCreate = async (values: StrategyFormSubmitValues) => {
    const strategy = await createMutation.mutateAsync(values);
    router.push(`/program/${strategy.id}`);
  };

  return (
    <div className="flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              activeTab === tab
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Programas" && (
        <>
          {/* Section header */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-1.5">
              <History className="h-[14px] w-[14px] text-muted-foreground" />
              <span className="text-[13px] font-semibold text-muted-foreground">Recentes</span>
            </div>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>

          {/* Grid view */}
          {viewMode === "grade" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4 pb-8">
              <CreateNewCard onClick={() => setShowCreateDialog(true)} />
              {strategies.map((program) => (
                <ProgramCard key={program.id} program={program} />
              ))}
            </div>
          )}

          {/* List view */}
          {viewMode === "lista" && (
            <div className="flex flex-col pb-8">
              {strategies.map((program) => (
                <ProgramListRow key={program.id} program={program} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab !== "Programas" && (
        <div className="flex flex-col items-center justify-center gap-3 text-center px-6 py-24">
          <p className="text-muted-foreground text-sm">
            {activeTab === "Rotinas" ? "Nenhuma rotina encontrada." : "Nenhum exercício salvo."}
          </p>
        </div>
      )}

      <StrategyFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        mode="create"
        onSubmit={handleCreate}
      />
    </div>
  );
}
