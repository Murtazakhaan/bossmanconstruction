import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Lock, ShieldCheck, Info, Headphones, User } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

const rows = [
  { to: "/profile", label: "Admin profile", icon: User },
  { to: "/settings/change-password", label: "Change password", icon: Lock },
  { to: "/settings/security", label: "Security & privacy", icon: ShieldCheck },
  { to: "/settings/contact", label: "Contact support", icon: Headphones },
  { to: "/settings/about", label: "About", icon: Info },
] as const;

function AdminSettings() {
  return (
    <AdminShell title="Admin · Settings">
      <PageHeader eyebrow="Admin" title="Settings" description="Account and platform preferences for administrators." />
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const Icon = r.icon;
                return (
                  <li key={r.to}>
                    <Link to={r.to} className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-accent/40 sm:px-5">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="flex-1 text-sm font-medium">{r.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}