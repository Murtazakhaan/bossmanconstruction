import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/reports")({
  component: () => (
    <AppShell title="Reports">
      <PageHeader eyebrow="Tax & impact" title="Reports" description="Annual donation totals, exports for your accountant, and program impact." />
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
        Tax summary & CSV export are coming in the next pass.
      </CardContent></Card>
    </AppShell>
  ),
});