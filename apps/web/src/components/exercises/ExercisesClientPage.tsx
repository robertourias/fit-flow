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
import { FixedSizeList, type ListChildComponentProps } from "react-window";
import { FilterBar } from "@/components/exercises/FilterBar";
import { ExerciseCard } from "@/components/exercises/ExerciseCard";
import type { Exercise, ExerciseType } from "@/lib/mock/exercises";

// ─── Constants ────────────────────────────────────────────────────────────────

const LG_BREAKPOINT = 1024;
const COLS_DEFAULT = 2;
const COLS_LG = 3;
const ROW_HEIGHT = 210;   // card ~190px + gap 12px + buffer 8px
const ROW_PADDING = 16;   // p-4
const GAP = 12;           // gap-3
// Activate virtualization only when list is large enough to justify the overhead
const VIRTUALIZE_THRESHOLD = 30;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size));
  return result;
}

// ─── Virtualized row renderer (defined outside to keep stable reference) ─────

interface RowData {
  rows: Exercise[][];
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

interface ExercisesClientPageProps {
  exercises?: Exercise[];
}

export function ExercisesClientPage({ exercises: mockExercises }: ExercisesClientPageProps) {
  // TODO: Replace with useExercises hook for real data
  // For now, fall back to mock data or empty array if not provided
  const exercises = mockExercises ?? [];
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("todos");
  const [equipment, setEquipment] = useState("Todos");
  const [type, setType] = useState<"Todos" | ExerciseType>("Todos");

  // Defer search so each keystroke doesn't synchronously re-filter the list
  const deferredSearch = useDeferredValue(search);

  const filtered = useMemo(
    () =>
      exercises.filter((e) => {
        const matchSearch =
          !deferredSearch ||
          e.name.toLowerCase().includes(deferredSearch.toLowerCase());
        const matchMuscle = muscle === "todos" || e.muscleGroup === muscle;
        const matchEquip = equipment === "Todos" || e.equipment === equipment;
        const matchType = type === "Todos" || e.type === type;
        return matchSearch && matchMuscle && matchEquip && matchType;
      }),
    [exercises, deferredSearch, muscle, equipment, type]
  );

  // Defers grid re-render while new filter result is being prepared
  const deferredFiltered = useDeferredValue(filtered);
  const isStale = deferredFiltered !== filtered;

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

  const rows = useMemo(
    () => chunkArray(deferredFiltered, cols),
    [deferredFiltered, cols]
  );
  const itemData = useMemo<RowData>(() => ({ rows, cols }), [rows, cols]);

  const shouldVirtualize = deferredFiltered.length >= VIRTUALIZE_THRESHOLD;

  return (
    <div className="flex flex-col h-full">
      <FilterBar
        search={search}
        onSearch={setSearch}
        muscle={muscle}
        onMuscle={setMuscle}
        equipment={equipment}
        onEquipment={setEquipment}
        type={type}
        onType={setType}
        totalCount={deferredFiltered.length}
        totalAll={exercises.length}
      />

      {deferredFiltered.length === 0 ? (
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
            >
              {ExerciseRow}
            </FixedSizeList>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 p-4 md:p-5">
              {deferredFiltered.map((ex) => (
                <ExerciseCard key={ex.id} exercise={ex} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
