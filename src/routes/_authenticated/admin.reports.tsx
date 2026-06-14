import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/admin-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: () => (
    <AdminShell title="Admin · Reports">
      <PageHeader
        eyebrow="Tax & impact"
        title="Reports"
        description="Annual donation totals, exports, and program impact."
      />
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Tax summary & CSV export are coming in the next pass.
        </CardContent>
      </Card>
    </AdminShell>
  ),
});