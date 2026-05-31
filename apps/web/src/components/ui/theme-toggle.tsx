"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon" | "row";
}

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Mudar para tema claro" : "Mudar para tema escuro";

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  if (variant === "row") {
    return (
      <button
        onClick={toggle}
        aria-label={label}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-2.5 rounded-m text-sm font-medium transition-colors text-left text-foreground hover:bg-accent",
          className
        )}
      >
        {mounted && isDark ? (
          <Sun className="h-5 w-5 shrink-0" />
        ) : (
          <Moon className="h-5 w-5 shrink-0" />
        )}
        {mounted ? (isDark ? "Tema claro" : "Tema escuro") : "Tema"}
      </button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={label}
      className={cn("h-9 w-9 rounded-m bg-accent hover:bg-accent/80 shrink-0", className)}
    >
      {mounted && isDark ? (
        <Sun className="h-[18px] w-[18px]" />
      ) : (
        <Moon className="h-[18px] w-[18px]" />
      )}
    </Button>
  );
}
