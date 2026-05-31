"use client";

import { NavContent } from "@/components/layout/nav-content";
import type { DashboardUser } from "@/lib/mock/dashboard";

interface SidebarProps {
  activeItem: string;
  onItemChange: (item: string) => void;
  user: DashboardUser;
}

export function Sidebar({ activeItem, onItemChange, user }: SidebarProps) {
  return (
    <aside className="flex flex-col w-60 h-full border-r border-border">
      <NavContent
        activeItem={activeItem}
        onItemChange={onItemChange}
        user={user}
        showThemeToggle={false}
      />
    </aside>
  );
}
