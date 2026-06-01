"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopHeader } from "@/components/layout/top-header";
import { mockUser } from "@/lib/mock/dashboard";

function getActiveItem(pathname: string): string {
  if (pathname.startsWith("/exercises")) return "exercicios";
  if (pathname.startsWith("/library")) return "biblioteca";
  if (pathname.startsWith("/program")) return "biblioteca";
  if (pathname.startsWith("/progress")) return "progresso";
  if (pathname.startsWith("/explore")) return "explorar";
  if (pathname.startsWith("/personal")) return "personal";
  return "rotina";
}

const sectionTitles: Record<string, string> = {
  rotina: "Dashboard",
  exercicios: "Exercícios",
  biblioteca: "Biblioteca",
  progresso: "Progresso",
  explorar: "Explorar",
  personal: "Personal",
  premium: "Premium",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeItem = getActiveItem(pathname);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <div className="hidden md:flex">
        <Sidebar activeItem={activeItem} onItemChange={() => {}} user={mockUser} />
      </div>

      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        <div className="md:hidden">
          <TopBar user={mockUser} activeTab={activeItem} onTabChange={() => {}} />
        </div>

        <div className="hidden md:block">
          <TopHeader
            sectionTitle={sectionTitles[activeItem] ?? activeItem}
            user={mockUser}
          />
        </div>

        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          {children}
        </main>

        <div className="md:hidden">
          <BottomNav activeTab={activeItem} onTabChange={() => {}} />
        </div>
      </div>
    </div>
  );
}
