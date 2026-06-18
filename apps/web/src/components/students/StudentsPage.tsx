"use client";

import { useState } from "react";
import { useStudents } from "@/lib/api/hooks/use-students";
import { useTrainers } from "@/lib/api/hooks/use-trainers";
import { useUserMe } from "@/lib/api/hooks/use-user-me";
import { RelationshipList } from "./RelationshipList";
import { StudentDetailSheet } from "./StudentDetailSheet";
import type { RelationshipDto } from "@fitflow/types";

type TabId = "students" | "trainers";

export function StudentsPage() {
  const [tab, setTab] = useState<TabId>("students");
  const [selected, setSelected] = useState<RelationshipDto | null>(null);

  const { data: user } = useUserMe();
  const students = useStudents();
  const trainers = useTrainers();

  return (
    <main className="min-h-dvh bg-background">
      <div className="px-5 pt-5">
        <h1 className="text-base font-semibold text-foreground">Alunos</h1>
      </div>

      <div className="flex gap-2 border-b border-border px-5 mt-3" role="tablist" aria-label="Vínculos de coaching">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "students"}
          className={`px-3 py-2 text-sm font-medium border-b-2 ${tab === "students" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          onClick={() => setTab("students")}
        >
          Meus Alunos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "trainers"}
          className={`px-3 py-2 text-sm font-medium border-b-2 ${tab === "trainers" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}
          onClick={() => setTab("trainers")}
        >
          Meus Preparadores
        </button>
      </div>

      {tab === "students" && (
        <RelationshipList
          role="trainer"
          relationships={students.data ?? []}
          isLoading={students.isLoading}
          isError={students.isError}
          currentUserId={user?.id ?? ""}
          onSelectActive={(relationship) => setSelected(relationship)}
        />
      )}

      {tab === "trainers" && (
        <RelationshipList
          role="student"
          relationships={trainers.data ?? []}
          isLoading={trainers.isLoading}
          isError={trainers.isError}
          currentUserId={user?.id ?? ""}
        />
      )}

      {selected && (
        <StudentDetailSheet
          studentId={selected.studentId}
          studentName={selected.studentName}
          open={!!selected}
          onOpenChange={(open) => { if (!open) setSelected(null); }}
        />
      )}
    </main>
  );
}
