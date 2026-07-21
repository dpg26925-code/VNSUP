import { Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Star, Users } from "lucide-react";
import { truncate } from "@/lib/factory";

export type CompanyCardProps = {
  slug: string;
  name: string;
  province: string | null;
  industry: string | null;
  employee_range: string | null;
  ai_summary: string | null;
  capabilities: unknown;
  verified: boolean;
  featured: boolean;
};

export function CompanyCard(c: CompanyCardProps) {
  const caps = Array.isArray(c.capabilities) ? (c.capabilities as string[]) : [];
  return (
    <Link
      to="/company/$slug"
      params={{ slug: c.slug }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-tight tracking-tight group-hover:text-brand">{c.name}</h3>
        <div className="flex shrink-0 gap-1">
          {c.verified && (
            <span title="Đã xác thực" className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
              <BadgeCheck className="h-3 w-3" strokeWidth={2} />
            </span>
          )}
          {c.featured && (
            <span title="Nổi bật" className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand">
              <Star className="h-3 w-3" strokeWidth={2} />
            </span>
          )}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {c.province && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" strokeWidth={1.75} />{c.province}</span>}
        {c.industry && <span className="rounded-md bg-secondary px-1.5 py-0.5 font-medium text-secondary-foreground">{c.industry}</span>}
        {c.employee_range && <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" strokeWidth={1.75} />{c.employee_range}</span>}
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{truncate(c.ai_summary, 160)}</p>
      {caps.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-border pt-4">
          {caps.slice(0, 3).map((cap) => (
            <span key={cap} className="rounded-md border border-border bg-background px-2 py-0.5 text-[11px] text-foreground/80">{cap}</span>
          ))}
          {caps.length > 3 && <span className="self-center text-[11px] text-muted-foreground">+{caps.length - 3}</span>}
        </div>
      )}
    </Link>
  );
}
