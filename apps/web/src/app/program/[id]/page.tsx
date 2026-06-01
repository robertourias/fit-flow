import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mockPrograms, libraryTemplates } from "@/lib/mock/library";
import { LibraryClientPage } from "@/components/library/LibraryClientPage";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const program = mockPrograms.find((p) => p.id === id);
  return { title: program ? `${program.name} — FitFlow` : "Programa — FitFlow" };
}

export function generateStaticParams() {
  return mockPrograms.map((p) => ({ id: p.id }));
}

export default async function ProgramDetailPage({ params }: Props) {
  const { id } = await params;
  const program = mockPrograms.find((p) => p.id === id);
  if (!program) notFound();
  return <LibraryClientPage program={program} templates={libraryTemplates} />;
}
