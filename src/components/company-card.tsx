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
  logo_url?: string | null;
};

function initials(name: string) {
  return name.replace(/(Công ty|TNHH|Cổ phần|CP|MTV)/gi, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "F";
}

export function CompanyCard(c: CompanyCardProps) {
  const caps = Array.isArray(c.capabilities) ? (c.capabilities as string[]) : [];
  return (
    <Link
      to="/company/$slug"
      params={{ slug: c.slug }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {c.logo_url ? (
          <img src={c.logo_url} alt={`Logo ${c.name}`} loading="lazy" className="h-11 w-11 shrink-0 rounded-xl border border-border bg-background object-contain p-1" />
        ) : (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-brand text-sm font-bold text-primary-foreground shadow-sm">
            {initials(c.name)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold leading-tight tracking-tight group-hover:text-brand">{c.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {c.province && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" strokeWidth={1.75} />{c.province}</span>}
            {c.employee_range && <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" strokeWidth={1.75} />{c.employee_range}</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {c.verified && (
            <span title="Đã xác thực" className="inline-flex items-center rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
              <BadgeCheck className="h-3 w-3" strokeWidth={2.25} />
            </span>
          )}
          {c.featured && (
            <span title="Nổi bật" className="inline-flex items-center rounded-full bg-brand-soft px-1.5 py-0.5 text-[10px] font-semibold text-brand">
              <Star className="h-3 w-3" strokeWidth={2.25} fill="currentColor" />
            </span>
          )}
        </div>
      </div>
      {c.industry && (
        <div className="mt-3">
          <span className="rounded-md bg-secondary px-1.5 py-0.5 text-xs font-medium text-secondary-foreground">{c.industry}</span>
        </div>
      )}
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
