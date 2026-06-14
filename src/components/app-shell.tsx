import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Inbox,
  Gift,
  ListChecks,
  FileBarChart,
  Settings as SettingsIcon,
  Users as UsersIcon,
  Tag,
  LogOut,
  Menu,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { BcmLogo } from "@/components/bcm-logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationsBell } from "@/components/notifications-bell";

type Item = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ("contractor" | "recipient" | "admin")[];
};

const USER_ITEMS: Item[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/materials", label: "Materials", icon: Package },
  { to: "/donations", label: "My Donations", icon: HandHeart, roles: ["contractor"] },
  { to: "/transactions", label: "Transactions", icon: ListChecks },
  { to: "/reports", label: "Reports", icon: FileBarChart, roles: ["contractor"] },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

const ADMIN_ITEMS: Item[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: UsersIcon },
  { to: "/admin/materials", label: "Materials", icon: Package },
  { to: "/admin/transactions", label: "Transactions", icon: ListChecks },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  { to: "/admin/reports", label: "Reports", icon: FileBarChart },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

// Primary destinations surfaced in the mobile bottom tab bar.
const USER_MOBILE_TAB_KEYS = ["/dashboard", "/materials", "/donations", "/transactions", "/settings"];
const ADMIN_MOBILE_TAB_KEYS = ["/admin", "/admin/users", "/admin/materials", "/admin/transactions", "/admin/settings"];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { roles } = useCurrentUser();
  const isAdmin = roles.includes("admin");
  const items = isAdmin ? ADMIN_ITEMS : USER_ITEMS;
  return (
    <nav className="flex flex-col gap-1 px-3">
      {items.filter((i) => !i.roles || i.roles.some((r) => roles.includes(r))).map((item) => {
        const Icon = item.icon;
        const active =
          item.to === "/admin"
            ? location.pathname === "/admin" || location.pathname === "/admin/"
            : location.pathname === item.to || location.pathname.startsWith(item.to + "/");
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium tracking-wide transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, roles } = useCurrentUser();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center justify-center border-b border-sidebar-border px-5 py-5">
        <BcmLogo variant="onDark" className="h-14 w-auto" />
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <NavList />
      </div>
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 px-2">
          <div className="truncate text-sm font-medium">{user?.email ?? "Signed in"}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {roles.map((r) => (
              <span
                key={r}
                className="rounded-sm bg-sidebar-accent px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-sidebar-accent-foreground"
              >
                {r === "contractor" ? "Donor" : r}
              </span>
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="w-full border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { roles } = useCurrentUser();
  const isAdmin = roles.includes("admin");
  const tabItems = isAdmin ? ADMIN_ITEMS : USER_ITEMS;
  const tabKeys = isAdmin ? ADMIN_MOBILE_TAB_KEYS : USER_MOBILE_TAB_KEYS;
  const mobileTabs = tabItems.filter(
    (i) => tabKeys.includes(i.to) && (!i.roles || i.roles.some((r) => roles.includes(r))),
  );
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border md:block">
        <SidebarContent />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/95 px-4 py-3 backdrop-blur md:static md:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-r-0 bg-sidebar p-0">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            {title ? (
              <h1 className="truncate font-display text-base font-semibold uppercase tracking-wide text-foreground sm:text-xl">
                {title}
              </h1>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            <NotificationsBell />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">{children}</main>
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
        <ul className="mx-auto flex max-w-md items-stretch justify-around">
          {mobileTabs.map((item) => {
            const Icon = item.icon;
            const active =
              location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center justify-center px-2 py-3 transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-7 w-7" />
                </Link>
              </li>
            );
          })}
        </ul>
        </nav>
      </div>
    </div>
  );
}