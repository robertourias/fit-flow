import type { Metadata } from "next";
import { LibraryListPage } from "@/components/library/LibraryListPage";

export const metadata: Metadata = {
  title: "Biblioteca — FitFlow",
};

export default function LibraryPage() {
  return <LibraryListPage />;
}
