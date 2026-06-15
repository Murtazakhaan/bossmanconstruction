import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Lock,
  Bookmark,
  ShieldCheck,
  Headphones,
  Info,
  LogOut,
  Trash2,
  Pencil,
  ChevronRight,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/settings/")({
  component: SettingsIndex,
});

type Row = {
  to?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  danger?: boolean;
  onClick?: () => void | Promise<void>;
};

function SettingsIndex() {
  const { user } = useCurrentUser();
  const [profile, setProfile] = useState<{ full_name?: string | null; org_name?: string | null; phone?: string | null } | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, c] = await Promise.all([
        supabase.from("profiles").select("full_name, org_name").eq("id", user.id).maybeSingle(),
        supabase.from("profile_contacts").select("phone").eq("id", user.id).maybeSingle(),
      ]);
      setProfile({ ...(p.data ?? {}), phone: c.data?.phone ?? null });
    })();
  }, [user]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const rows: Row[] = [
    { to: "/settings/change-password", label: "Change Password", icon: Lock },
    { to: "/settings/favorites", label: "Favorites", icon: Bookmark },
    { to: "/settings/security", label: "Security & Privacy", icon: ShieldCheck },
    { to: "/settings/contact", label: "Contact Us", icon: Headphones },
    { to: "/settings/about", label: "About", icon: Info },
    { label: "Logout", icon: LogOut, onClick: signOut },
    { to: "/settings/delete-account", label: "Delete Account", icon: Trash2, danger: true },
  ];

  const displayName = profile?.org_name || profile?.full_name || user?.email || "Your account";
  const displaySub = profile?.phone || user?.email || "";

  return (
    <AppShell title="Settings">
      <PageHeader title="Settings" description="Manage your account and preferences." />

      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5">
            <div className="min-w-0">
              <div className="truncate font-semibold text-foreground">{displayName}</div>
              {displaySub ? (
                <div className="mt-0.5 truncate text-sm text-muted-foreground">{displaySub}</div>
              ) : null}
            </div>
            <Button asChild variant="outline" size="icon" aria-label="Edit profile">
              <Link to="/profile">
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {rows.map((r) => {
                const Icon = r.icon;
                const content = (
                  <div
                    className={`flex items-center gap-3 px-4 py-4 transition-colors hover:bg-accent/40 sm:px-5 ${
                      r.danger ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${r.danger ? "text-destructive" : "text-muted-foreground"}`} />
                    <span className="flex-1 text-sm font-medium">{r.label}</span>
                    {r.to ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : null}
                  </div>
                );
                return (
                  <li key={r.label}>
                    {r.to ? (
                      <Link to={r.to}>{content}</Link>
                    ) : (
                      <button type="button" onClick={r.onClick} className="w-full text-left">
                        {content}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}