import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

export function AdminShell({ children, title }: { children: ReactNode; title?: string }) {
  return <AppShell title={title ?? "Admin"}>{children}</AppShell>;
}