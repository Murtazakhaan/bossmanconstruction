import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/settings/favorites")({
  component: FavoritesPage,
});

function FavoritesPage() {
  return (
    <AppShell title="Favorites">
      <div className="mx-auto max-w-2xl">
        <Link to="/settings" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to settings
        </Link>
        <PageHeader title="Favorites" description="Materials you've saved for later." />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="rounded-full bg-muted p-4">
              <Bookmark className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="font-semibold">No favorites yet</div>
            <p className="max-w-sm text-sm text-muted-foreground">
              Browse available materials and tap the bookmark icon to save them here for quick access.
            </p>
            <Button asChild className="mt-2">
              <Link to="/materials">Browse materials</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}