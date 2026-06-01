import type { Metadata } from "next";
import { mockProgram, libraryTemplates } from "@/lib/mock/library";
import { LibraryClientPage } from "@/components/library/LibraryClientPage";

export const metadata: Metadata = {
  title: "Biblioteca — FitFlow",
};

export default function LibraryPage() {
  return (
    <LibraryClientPage program={mockProgram} templates={libraryTemplates} />
  );
}
