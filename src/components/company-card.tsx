import { Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Star, Users, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { industryLabel, truncate } from "@/lib/factory";

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
  id?: string;
  rating?: number;
  review_count?: number;
  address?: string | null;
};

function initials(name: string) {
  return (
    name
      .replace(/(Công ty|TNHH|Cổ phần|CP|MTV|Tập đoàn|Factory|Co\., Ltd|JSC)/gi, "")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "VN"
  );
}

export function CompanyCard(c: CompanyCardProps) {
  const caps = Array.isArray(c.capabilities) ? (c.capabilities as string[]) : [];

  return (
    <Link
      to="/company/$slug"
      params={{ slug: c.slug }}
      className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-brand/50 hover:shadow-lg hover:shadow-brand/5"
    >
      <div>
        {/* Top bar with Logo, Name and Trust Badges */}
        <div className="flex items-start gap-3.5">
          {c.logo_url ? (
            <img
              src={c.logo_url}
              alt={`Logo ${c.name}`}
              loading="lazy"
              className="h-12 w-12 shrink-0 rounded-xl border border-border/80 bg-background object-contain p-1 shadow-xs transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand/90 text-sm font-bold text-white shadow-xs transition-transform group-hover:scale-105">
              {initials(c.name)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-base font-bold text-foreground transition-colors group-hover:text-brand">
                {c.name}
              </h3>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {c.province && (
                <span className="inline-flex items-center gap-1 font-medium text-foreground/80">
                  <MapPin className="h-3.5 w-3.5 text-brand/80" strokeWidth={2} />
                  {c.province}
                </span>
              )}
              {c.employee_range && (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
                  {c.employee_range} người
                </span>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            {c.verified && (
              <span
                title="Doanh nghiệp đã xác thực hồ sơ năng lực"
                className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              >
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                <span className="hidden sm:inline">Xác thực</span>
              </span>
            )}
            {c.featured && (
              <span
                title="Nhà máy tiêu biểu"
                className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand border border-brand/20"
              >
                <Sparkles className="h-3 w-3" strokeWidth={2.5} />
                <span className="hidden sm:inline">Tiêu biểu</span>
              </span>
            )}
          </div>
        </div>

        {/* Rating and Industry pill */}
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
          {c.industry ? (
            <span className="inline-flex items-center rounded-lg bg-secondary/80 px-2.5 py-1 text-xs font-semibold text-secondary-foreground border border-border/50">
              {industryLabel(c.industry)}
            </span>
          ) : <div />}

          {typeof c.rating === "number" && c.rating > 0 ? (
            <div className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>{c.rating.toFixed(1)}</span>
              {c.review_count ? <span className="text-[11px] font-normal text-muted-foreground">({c.review_count})</span> : null}
            </div>
          ) : null}
        </div>

        {/* AI Summary / Description */}
        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {truncate(c.ai_summary, 140) || "Hồ sơ năng lực nhà máy sản xuất đã được kiểm chứng trên VNSupplier."}
        </p>
      </div>

      {/* Bottom capabilities & link */}
      <div className="mt-4 pt-3 border-t border-border/70">
        {caps.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {caps.slice(0, 3).map((cap) => (
              <span
                key={cap}
                className="rounded-md bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-foreground/75 border border-border/40"
              >
                {cap}
              </span>
            ))}
            {caps.length > 3 && (
              <span className="text-[11px] font-semibold text-brand">
                +{caps.length - 3}
              </span>
            )}
          </div>
        ) : null}

        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground group-hover:text-brand">
          <span>Xem chi tiết hồ sơ</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" strokeWidth={2} />
        </div>
      </div>
    </Link>
  );
}
