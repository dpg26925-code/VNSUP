import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CardGrid } from "@/components/primitives";

/** Base shimmer bar. Uses tokens only. */
export function Shimmer({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-muted", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <Shimmer className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-3/4" />
          <div className="flex gap-2">
            <Shimmer className="h-3 w-16" />
            <Shimmer className="h-3 w-20" />
          </div>
        </div>
      </div>
      <Shimmer className="h-3 w-full" />
      <Shimmer className="h-3 w-5/6" />
      <div className="mt-2 flex gap-1.5 border-t border-border pt-3">
        <Shimmer className="h-4 w-14" />
        <Shimmer className="h-4 w-14" />
        <Shimmer className="h-4 w-14" />
      </div>
    </div>
  );
}

/** N-card grid skeleton — drop-in for loading states. */
export function SkeletonGrid({ count = 6, cols = 3 }: { count?: number; cols?: 2 | 3 | 4 }) {
  return (
    <CardGrid cols={cols}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </CardGrid>
  );
}

/** Row-list skeleton — for tables/leads. */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-card">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Shimmer className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Shimmer className="h-3.5 w-1/3" />
            <Shimmer className="h-3 w-1/2" />
          </div>
          <Shimmer className="h-6 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

/** Full profile-page skeleton — hero + sections. */
export function SkeletonProfile() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-4">
          <Shimmer className="h-16 w-16 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <Shimmer className="h-6 w-2/3" />
            <Shimmer className="h-4 w-1/3" />
            <div className="flex gap-2 pt-1">
              <Shimmer className="h-5 w-16 rounded-full" />
              <Shimmer className="h-5 w-16 rounded-full" />
              <Shimmer className="h-5 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr,320px]">
        <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} className={`h-3 ${i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-5/6" : "w-3/4"}`} />
          ))}
        </div>
        <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
          <Shimmer className="h-4 w-1/2" />
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

/** Empty state with icon slot. Defaults to a search icon. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  tone = "default",
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "default" | "muted";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border p-10 text-center",
        tone === "muted" ? "bg-muted/30" : "bg-card/50",
      )}
    >
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-secondary text-muted-foreground">
        {icon ?? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        )}
      </div>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-pretty text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Error state — compact, actionable. */
export function ErrorState({
  title = "Đã xảy ra lỗi",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-destructive/10 text-destructive">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" /><path d="M12 16h.01" />
        </svg>
      </div>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
