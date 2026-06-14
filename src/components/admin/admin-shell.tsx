import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Package,
  ListChecks,
  Tag,
  Settings as SettingsIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/materials", label: "Materials", icon: Package },
  { to: "/admin/transactions", label: "Transactions", icon: ListChecks },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

export function AdminShell({ children, title }: { children: ReactNode; title?: string }) {
  const location = useLocation();
  return (
    <AppShell title={title ?? "Admin"}>
      <nav
        aria-label="Admin sections"
        className="mb-6 -mx-1 flex gap-1 overflow-x-auto border-b border-border pb-1"
      >
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.exact
            ? location.pathname === t.to || location.pathname === t.to + "/"
            : location.pathname === t.to || location.pathname.startsWith(t.to + "/");
          return (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </AppShell>
  );
}