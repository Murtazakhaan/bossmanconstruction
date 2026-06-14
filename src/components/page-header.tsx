import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow ? (
          <div className="text-[11px] font-semibold uppercase tracking-[0.25em] text-concrete-dark">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}