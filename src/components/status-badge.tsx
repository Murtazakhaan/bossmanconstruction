import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  available: "bg-success/15 text-success",
  reserved: "bg-warning/20 text-warning-foreground",
  claimed: "bg-concrete text-foreground",
  removed: "bg-muted text-muted-foreground",
  requested: "bg-warning/20 text-warning-foreground",
  scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-primary text-primary-foreground",
  completed: "bg-success/15 text-success",
  canceled: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        STYLES[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}