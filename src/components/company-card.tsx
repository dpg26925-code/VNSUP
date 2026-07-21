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
      className="group flex flex-col rounded-lg border bg-card p-4 shadow-sm transition hover:border-primary hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-tight group-hover:text-primary">{c.name}</h3>
        <div className="flex shrink-0 gap-1">
          {c.verified && (
            <span title="Đã xác thực" className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
              <BadgeCheck className="h-3 w-3" />
            </span>
          )}
          {c.featured && (
            <span title="Nổi bật" className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
              <Star className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {c.province && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.province}</span>}
        {c.industry && <span className="rounded bg-secondary px-1.5 py-0.5 font-medium text-secondary-foreground">{c.industry}</span>}
        {c.employee_range && <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" />{c.employee_range}</span>}
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{truncate(c.ai_summary, 160)}</p>
      {caps.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {caps.slice(0, 3).map((cap) => (
            <span key={cap} className="rounded border bg-background px-1.5 py-0.5 text-[11px] text-foreground/80">{cap}</span>
          ))}
          {caps.length > 3 && <span className="text-[11px] text-muted-foreground">+{caps.length - 3}</span>}
        </div>
      )}
    </Link>
  );
}
