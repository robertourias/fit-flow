"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopHeader } from "@/components/layout/top-header";
import { mockUser } from "@/lib/mock/dashboard";

const sectionLabels: Record<string, string> = {
  rotina: "Dashboard",
  progresso: "Progresso",
  treino: "Iniciar treino",
  explorar: "Explorar",
  explorar2: "Exercícios",
  biblioteca: "Biblioteca",
  personal: "Personal",
  premium: "Premium",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeItem, setActiveItem] = useState("rotina");

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar
          activeItem={activeItem}
          onItemChange={setActiveItem}
          user={mockUser}
        />
      </div>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden">
          <TopBar
            user={mockUser}
            activeTab={activeItem}
            onTabChange={setActiveItem}
          />
        </div>

        {/* Desktop top header */}
        <div className="hidden md:block">
          <TopHeader
            sectionTitle={sectionLabels[activeItem] ?? activeItem}
            user={mockUser}
          />
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <div className="md:hidden">
          <BottomNav activeTab={activeItem} onTabChange={setActiveItem} />
        </div>
      </div>
    </div>
  );
}
