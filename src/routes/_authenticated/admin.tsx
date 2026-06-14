import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { roles, loading } = useCurrentUser();
  if (loading)
    return (
      <AppShell title="Admin">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </AppShell>
    );
  if (!roles.includes("admin")) {
    return (
      <AppShell title="Admin">
        <PageHeader eyebrow="Restricted" title="Admin area" />
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            You don't have access to this area.
          </CardContent>
        </Card>
      </AppShell>
    );
  }
  return <Outlet />;
}