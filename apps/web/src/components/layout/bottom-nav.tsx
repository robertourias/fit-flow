"use client";

import { Dumbbell, BarChart2, Compass, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  { id: "rotina", label: "Rotina", icon: Dumbbell },
  { id: "progresso", label: "Progresso", icon: BarChart2 },
  { id: "treino", label: "Treino", icon: Dumbbell, isCenter: true },
  { id: "explorar", label: "Explorar", icon: Compass },
  { id: "personal", label: "Personal", icon: User },
];

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="flex items-center justify-around bg-card border-t border-border px-0 pt-2 pb-6"
      aria-label="Navegação principal"
    >
      {navItems.map(({ id, label, icon: Icon, isCenter }) => {
        const isActive = activeTab === id;

        if (isCenter) {
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex flex-col items-center gap-1 flex-1"
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="flex items-center justify-center h-9 w-9 rounded-full bg-primary">
                <Icon className="h-[22px] w-[22px] text-primary-foreground" />
              </span>
              <span className={cn("text-[10px] font-semibold", isActive ? "text-primary" : "text-muted-foreground")}>
                {label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className="flex flex-col items-center gap-1 flex-1"
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className={cn("h-[22px] w-[22px]", isActive ? "text-primary" : "text-muted-foreground")} />
            <span className={cn("text-[10px]", isActive ? "text-primary font-medium" : "text-muted-foreground")}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
