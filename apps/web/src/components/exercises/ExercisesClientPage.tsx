"use client";

import {
  memo,
  useMemo,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  FixedSizeList,
  type ListChildComponentProps,
  type ListOnItemsRenderedProps,
} from "react-window";
import { RefreshCw } from "lucide-react";
import { FilterBar, type ExerciseTypeFilter } from "@/components/exercises/FilterBar";
import { ExerciseCard } from "@/components/exercises/ExerciseCard";
import { Button } from "@/components/ui/button";
import { useExercises } from "@/lib/api/hooks/use-exercises";
import { useMuscleGroups } from "@/lib/api/hooks/use-muscle-groups";
import { useEquipment } from "@/lib/api/hooks/use-equipment";
import type { ExerciseDto } from "@fitflow/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const LG_BREAKPOINT = 1024;
const COLS_DEFAULT = 2;
const COLS_LG = 3;
const ROW_HEIGHT = 210;  // card ~190px + gap 12px + buffer 8px
const ROW_PADDING = 16;  // p-4
const GAP = 12;          // gap-3
// Activate virtualization only when list is large enough to justify the overhead
const VIRTUALIZE_THRESHOLD = 30;

const CATEGORY_BY_TYPE: Record<"Força" | "Cardio", "STRENGTH" | "CARDIO"> = {
  "Força": "STRENGTH",
  Cardio: "CARDIO",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

// ─── Virtualized row renderer (defined outside to keep stable reference) ─────

interface RowData {
  rows: ExerciseDto[][];
  cols: number;
}

const ExerciseRow = memo(function ExerciseRow({
  index,
  style,
  data,
}: ListChildComponentProps<RowData>) {
  const { rows, cols } = data;
  return (
    <div
      style={
        {
          ...style,
          top: (style.top as number) + ROW_PADDING,
          paddingLeft: ROW_PADDING,
          paddingRight: ROW_PADDING,
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: GAP,
        } as CSSProperties
      }
    >
      {rows[index]?.map((ex) => (
        <ExerciseCard key={ex.id} exercise={ex} />
      ))}
    </div>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

export function ExercisesClientPage() {
  const [search, setSearch] = useState("");
  const [muscleGroupSlug, setMuscleGroupSlug] = useState<string | undefined>(undefined);
  const [equipmentSlug, setEquipmentSlug] = useState<string | undefined>(undefined);
  const [type, setType] = useState<ExerciseTypeFilter>("Todos");

  // Defer search so each keystroke doesn't synchronously trigger a refetch
  const deferredSearch = useDeferredValue(search);

  const { data: muscleGroups = [] } = useMuscleGroups();
  const { data: equipment = [] } = useEquipment();

  const {
    data,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useExercises({
    search: deferredSearch || undefined,
    muscleGroupSlug,
    equipmentSlug,
    category: type === "Todos" ? undefined : CATEGORY_BY_TYPE[type],
  });

  const exercises = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const totalCount = data?.pages[0]?.total ?? 0;
  const isStale = isFetching && !isFetchingNextPage;

  // ── react-window: measure container height ───────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Column count from media query ─────────────────────────────────────────
  const [cols, setCols] = useState(COLS_DEFAULT);

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${LG_BREAKPOINT}px)`);
    setCols(mq.matches ? COLS_LG : COLS_DEFAULT);
    const onChange = (e: MediaQueryListEvent) =>
      setCols(e.matches ? COLS_LG : COLS_DEFAULT);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const rows = useMemo(() => chunkArray(exercises, cols), [exercises, cols]);
  const itemData = useMemo<RowData>(() => ({ rows, cols }), [rows, cols]);

  const shouldVirtualize = exercises.length >= VIRTUALIZE_THRESHOLD;

  // Virtualized list: fetch the next page once the last row scrolls into view
  const handleItemsRendered = ({ visibleStopIndex }: ListOnItemsRenderedProps) => {
    if (visibleStopIndex >= rows.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <FilterBar
        search={search}
        onSearch={setSearch}
        muscleGroups={muscleGroups}
        muscleGroupSlug={muscleGroupSlug}
        onMuscleGroupSlug={setMuscleGroupSlug}
        equipment={equipment}
        equipmentSlug={equipmentSlug}
        onEquipmentSlug={setEquipmentSlug}
        type={type}
        onType={setType}
        totalCount={totalCount}
        isLoading={isLoading}
      />

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4 md:p-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[190px] rounded-l bg-muted animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16 text-center px-6">
          <p className="font-semibold text-foreground">Erro ao carregar exercícios</p>
          <p className="text-sm text-muted-foreground">Tente novamente em alguns instantes.</p>
          <Button variant="secondary" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      ) : exercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-2 py-16 text-center px-6">
          <span className="text-4xl">🔍</span>
          <p className="font-semibold text-foreground">Nenhum exercício encontrado</p>
          <p className="text-sm text-muted-foreground">
            Tente ajustar os filtros ou a busca.
          </p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="flex-1 overflow-hidden transition-opacity duration-150"
          style={{ opacity: isStale ? 0.6 : 1 }}
        >
          {shouldVirtualize ? (
            <FixedSizeList
              height={containerHeight}
              width="100%"
              itemCount={rows.length}
              itemSize={ROW_HEIGHT}
              itemData={itemData}
              overscanCount={3}
              onItemsRendered={handleItemsRendered}
            >
              {ExerciseRow}
            </FixedSizeList>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4 md:p-5">
                {exercises.map((ex) => (
                  <ExerciseCard key={ex.id} exercise={ex} />
                ))}
              </div>
              {hasNextPage && (
                <div className="flex justify-center pb-6">
                  <Button
                    variant="secondary"
                    onClick={() => fetchNextPage()}
                    isLoading={isFetchingNextPage}
                  >
                    Carregar mais
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
