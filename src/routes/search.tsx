import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { CompanyCard, type CompanyCardProps } from "@/components/company-card";
import { EMPLOYEE_RANGES, INDUSTRIES, PROVINCES, abs } from "@/lib/factory";
import { Filter, Search as SearchIcon, X } from "lucide-react";

const searchSchema = z.object({
  q: z.string().optional(),
  industry: z.string().optional(),
  province: z.string().optional(),
  size: z.string().optional(),
});

const SEARCH_TITLE = "Tìm nhà máy sản xuất | FactoryHub Vietnam";
const SEARCH_DESC = "Tìm nhà máy Việt Nam theo ngành, tỉnh, quy mô và năng lực sản xuất.";
const SEARCH_URL = abs("/search");

export const Route = createFileRoute("/search")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: SEARCH_TITLE },
      { name: "description", content: SEARCH_DESC },
      { property: "og:title", content: SEARCH_TITLE },
      { property: "og:description", content: SEARCH_DESC },
      { property: "og:url", content: SEARCH_URL },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: SEARCH_URL }],
  }),
  component: SearchPage,
});


function SearchPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(search.q ?? "");
  const [rows, setRows] = useState<CompanyCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => setQ(search.q ?? ""), [search.q]);

  useEffect(() => {
    setLoading(true);
    let qb = supabase.from("companies")
      .select("slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured")
      .order("featured", { ascending: false })
      .order("verified", { ascending: false })
      .limit(60);
    if (search.q) qb = qb.or(`name.ilike.%${search.q}%,description.ilike.%${search.q}%,industry.ilike.%${search.q}%,sub_industry.ilike.%${search.q}%`);
    if (search.industry) qb = qb.eq("industry", search.industry);
    if (search.province) qb = qb.eq("province", search.province);
    if (search.size) qb = qb.eq("employee_range", search.size);
    qb.then(({ data }) => { setRows((data ?? []) as CompanyCardProps[]); setLoading(false); });
  }, [search.q, search.industry, search.province, search.size]);

  function apply(next: Partial<typeof search>) {
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, ...next }) as any, replace: true });
  }

  const activeCount = useMemo(() => [search.industry, search.province, search.size].filter(Boolean).length, [search]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <form onSubmit={(e) => { e.preventDefault(); apply({ q: q || undefined }); }} className="flex items-center gap-2 rounded-md border bg-card p-2">
          <SearchIcon className="ml-2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Từ khóa: CNC, ép nhựa, SMT…"
            className="flex-1 bg-transparent px-1 py-1 text-sm outline-none" />
          <button className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Tìm</button>
          <button type="button" onClick={() => setShowFilters((v) => !v)} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent md:hidden">
            <Filter className="h-4 w-4" /> Lọc {activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeCount}</span>}
          </button>
        </form>

        <div className="mt-4 grid gap-4 md:grid-cols-[220px,1fr]">
          <aside className={(showFilters ? "block " : "hidden ") + "md:block"}>
            <div className="space-y-4 rounded-md border bg-card p-4 text-sm">
              <FilterGroup label="Ngành" value={search.industry} options={INDUSTRIES.map((i) => ({ v: i.name, l: i.name }))} onChange={(v) => apply({ industry: v })} />
              <FilterGroup label="Tỉnh/TP" value={search.province} options={PROVINCES.map((p) => ({ v: p.name, l: p.name }))} onChange={(v) => apply({ province: v })} />
              <FilterGroup label="Số lao động" value={search.size} options={EMPLOYEE_RANGES.map((v) => ({ v, l: v }))} onChange={(v) => apply({ size: v })} />
              {activeCount > 0 && (
                <button onClick={() => apply({ industry: undefined, province: undefined, size: undefined })}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" /> Xóa bộ lọc
                </button>
              )}
            </div>
          </aside>

          <div>
            <div className="mb-3 text-sm text-muted-foreground">
              {loading ? "Đang tải…" : `${rows.length} kết quả`}
            </div>
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-lg border bg-card" />)}
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">Không tìm thấy nhà máy phù hợp.</div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rows.map((c) => <CompanyCard key={c.slug} {...c} />)}
              </div>
            )}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function FilterGroup({ label, value, options, onChange }: { label: string; value?: string; options: { v: string; l: string }[]; onChange: (v: string | undefined) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button key={o.v} onClick={() => onChange(active ? undefined : o.v)}
              className={"rounded-full border px-2.5 py-1 text-xs transition " + (active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary hover:text-primary")}>
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}
