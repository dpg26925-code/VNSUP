export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
      <div className="flex gap-2">
        <div className="h-3 w-16 animate-pulse rounded bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-3 w-full animate-pulse rounded bg-muted" />
      <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
      <div className="mt-2 flex gap-1.5 border-t border-border pt-3">
        <div className="h-4 w-14 animate-pulse rounded bg-muted" />
        <div className="h-4 w-14 animate-pulse rounded bg-muted" />
        <div className="h-4 w-14 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
