"use client";

import { Dumbbell, TrendingUp, Compass, User, ListChecks, BookOpen, Zap, Settings } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import type { DashboardUser } from "@/lib/mock/dashboard";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const mainNavItems: NavItem[] = [
  { id: "rotina", label: "Rotina", icon: Dumbbell },
  { id: "progresso", label: "Progresso", icon: TrendingUp },
  { id: "explorar", label: "Explorar", icon: Compass },
  { id: "personal", label: "Personal", icon: User },
];

const extraNavItems: NavItem[] = [
  { id: "exercicios", label: "Exercícios", icon: ListChecks },
  { id: "biblioteca", label: "Biblioteca", icon: BookOpen },
];

interface NavContentProps {
  activeItem: string;
  onItemChange: (item: string) => void;
  user: DashboardUser;
  showThemeToggle?: boolean;
  onClose?: () => void;
}

export function NavContent({
  activeItem,
  onItemChange,
  user,
  showThemeToggle = false,
  onClose,
}: NavContentProps) {
  function handleNav(id: string) {
    onItemChange(id);
    onClose?.();
  }

  function navButtonClass(id: string) {
    return cn(
      "flex items-center gap-3 w-full px-3 py-[10px] rounded-m text-sm transition-colors text-left",
      activeItem === id
        ? "bg-[hsl(var(--color-success-bg))] text-primary font-semibold"
        : "text-muted-foreground font-normal hover:bg-accent hover:text-foreground"
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Logo */}
      <div className="h-20 flex items-center gap-2.5 px-5 border-b border-border shrink-0">
        <span className="flex items-center justify-center h-8 w-8 rounded-m bg-primary shrink-0">
          <Dumbbell className="h-[18px] w-[18px] text-primary-foreground" />
        </span>
        <span className="font-bold text-lg">FitFlow</span>
      </div>

      {/* Main nav */}
      <nav className="px-3 py-4 flex flex-col gap-1" aria-label="Navegação principal">
        {mainNavItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => handleNav(id)} className={navButtonClass(id)} aria-current={activeItem === id ? "page" : undefined}>
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      <Separator className="mx-3 w-auto" />

      {/* Extra nav */}
      <nav className="px-3 py-2 flex flex-col gap-1" aria-label="Biblioteca">
        {extraNavItems.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => handleNav(id)} className={navButtonClass(id)} aria-current={activeItem === id ? "page" : undefined}>
            <Icon className="h-[18px] w-[18px] shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      <Separator className="mx-3 w-auto" />

      {/* Premium */}
      <div className="px-3 py-2">
        <button
          onClick={() => handleNav("premium")}
          className="flex items-center gap-3 w-full px-3 py-[10px] rounded-m text-sm font-semibold transition-opacity bg-[hsl(var(--color-warning-bg))] text-[hsl(var(--color-warning-text))] hover:opacity-90 text-left"
        >
          <Zap className="h-[18px] w-[18px] shrink-0 text-[hsl(var(--color-warning))]" />
          <span className="flex-1">Premium</span>
          <span className="inline-flex items-center rounded-pill bg-[hsl(var(--color-warning))] px-2 py-0.5 text-[11px] font-semibold text-white">
            Upgrade
          </span>
        </button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme toggle — mobile only */}
      {showThemeToggle && (
        <div className="px-3 py-2 border-t border-border">
          <ThemeToggle variant="row" />
        </div>
      )}

      {/* User row */}
      <div className="border-t border-border px-4 py-4 flex items-center gap-2.5 shrink-0">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
            {user.initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[13px] font-semibold leading-tight truncate">{user.name}</span>
          <span className="text-[11px] text-muted-foreground truncate">Plano Gratuito</span>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Configurações">
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
