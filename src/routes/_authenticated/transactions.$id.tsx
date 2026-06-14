import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/transactions/$id")({
  component: () => (
    <AppShell title="Transaction">
      <PageHeader eyebrow="Pickup" title="Transaction detail" />
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
        Timeline, status changes, and in-app messaging land in the next pass.
      </CardContent></Card>
    </AppShell>
  ),
});