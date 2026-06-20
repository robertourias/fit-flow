import { AppShell } from "@/components/layout/AppShell";

export default function StudentsLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
