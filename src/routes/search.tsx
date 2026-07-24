import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { CompanyCard, type CompanyCardProps } from "@/components/company-card";
import { SkeletonGrid, EmptyState } from "@/components/skeleton-card";
import { Container, CardGrid } from "@/components/primitives";
import { EMPLOYEE_RANGES, INDUSTRIES, PROVINCES, abs } from "@/lib/factory";
import { smartSearch } from "@/lib/smart-search.functions";
import { Filter, Search as SearchIcon, Sparkles, X } from "lucide-react";

const searchSchema = z.object({
  q: z.string().optional(),
  industry: z.string().optional(),
  province: z.string().optional(),
  size: z.string().optional(),
  sort: z.enum(["featured", "name", "province", "industry"]).optional(),
});

const SEARCH_TITLE = "Tìm nhà máy sản xuất | VNSupplier";
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
    links: [
      { rel: "canonical", href: SEARCH_URL },
      { rel: "alternate", hrefLang: "vi", href: SEARCH_URL },
      { rel: "alternate", hrefLang: "x-default", href: SEARCH_URL },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const runSmart = useServerFn(smartSearch);
  const [q, setQ] = useState(search.q ?? "");
  const [rows, setRows] = useState<CompanyCardProps[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [aiTerms, setAiTerms] = useState<string[]>([]);

  useEffect(() => setQ(search.q ?? ""), [search.q]);

  useEffect(() => {
    supabase.from("companies").select("id", { count: "exact", head: true })
      .then(({ count }) => setTotal(count ?? 0));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setAiTerms([]);
    const sort = search.sort ?? "featured";

    async function run() {
      // AI-assisted search when the user typed a query
      if (search.q && search.q.trim().length > 0) {
        try {
          const res = await runSmart({
            data: {
              q: search.q,
              industry: search.industry ?? null,
              province: search.province ?? null,
              size: search.size ?? null,
            },
          });
          if (cancelled) return;
          const list = (res.rows ?? []) as CompanyCardProps[];
          const sorted = [...list];
          if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name, "vi"));
          else if (sort === "province") sorted.sort((a, b) => (a.province ?? "").localeCompare(b.province ?? "", "vi"));
          else if (sort === "industry") sorted.sort((a, b) => (a.industry ?? "").localeCompare(b.industry ?? "", "vi"));
          setRows(sorted);
          const terms = [
            ...(res.expansion?.keywords ?? []),
            ...(res.expansion?.industries ?? []),
          ]
            .map((s) => s.trim())
            .filter((s) => s && s.toLowerCase() !== (search.q ?? "").toLowerCase());
          setAiTerms(Array.from(new Set(terms)).slice(0, 8));
          setLoading(false);
          return;
        } catch {
          // fall through to plain query
        }
      }

      // No query: plain filter/browse
      let qb = supabase.from("companies")
        .select("slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured,logo_url")
        .eq("status", "approved")
        .limit(60);
      if (sort === "featured") qb = qb.order("featured", { ascending: false }).order("verified", { ascending: false });
      else if (sort === "name") qb = qb.order("name", { ascending: true });
      else if (sort === "province") qb = qb.order("province", { ascending: true });
      else if (sort === "industry") qb = qb.order("industry", { ascending: true });
      if (search.industry) qb = qb.eq("industry", search.industry);
      if (search.province) qb = qb.eq("province", search.province);
      if (search.size) qb = qb.eq("employee_range", search.size);
      const { data } = await qb;
      if (cancelled) return;
      setRows((data ?? []) as CompanyCardProps[]);
      setLoading(false);
    }

    run();
    return () => { cancelled = true; };
  }, [search.q, search.industry, search.province, search.size, search.sort, runSmart]);

  function apply(next: Partial<typeof search>) {
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, ...next }) as any, replace: true });
  }

  const activeCount = useMemo(() => [search.industry, search.province, search.size].filter(Boolean).length, [search]);
  const activeChips: { label: string; clear: () => void }[] = [];
  if (search.industry) activeChips.push({ label: `Ngành: ${search.industry}`, clear: () => apply({ industry: undefined }) });
  if (search.province) activeChips.push({ label: `Tỉnh: ${search.province}`, clear: () => apply({ province: undefined }) });
  if (search.size) activeChips.push({ label: `Quy mô: ${search.size}`, clear: () => apply({ size: undefined }) });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Container className="py-6">

        <form onSubmit={(e) => { e.preventDefault(); apply({ q: q || undefined }); }} className="flex items-center gap-2 rounded-md border bg-card p-2">
          <SearchIcon className="ml-2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Từ khóa: CNC, ép nhựa, SMT…"
            className="flex-1 bg-transparent px-1 py-1 text-sm outline-none" />
          <button className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Tìm</button>
          <button type="button" onClick={() => setShowFilters((v) => !v)} className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-accent md:hidden">
            <Filter className="h-4 w-4" /> Lọc {activeCount > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">{activeCount}</span>}
          </button>
        </form>

        {/* Mobile horizontal filter chips */}
        <div className="mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:hidden">
          {INDUSTRIES.map((i) => {
            const on = search.industry === i.name;
            return (
              <button key={i.slug} onClick={() => apply({ industry: on ? undefined : i.name })}
                className={"shrink-0 rounded-full border px-3 py-1 text-xs transition " + (on ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary")}>{i.name}</button>
            );
          })}
        </div>

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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {loading ? "Đang tải…" : (
                  <><span className="font-semibold text-foreground">{rows.length}</span>{total > 0 && <>/{total}</>} nhà máy</>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <label className="text-muted-foreground">Sắp xếp:</label>
                <select
                  value={search.sort ?? "featured"}
                  onChange={(e) => apply({ sort: e.target.value as any })}
                  className="rounded-md border bg-card px-2 py-1"
                >
                  <option value="featured">Nổi bật</option>
                  <option value="name">Tên A→Z</option>
                  <option value="province">Tỉnh/TP</option>
                  <option value="industry">Ngành</option>
                </select>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {activeChips.map((c) => (
                  <button key={c.label} onClick={c.clear} className="inline-flex items-center gap-1 rounded-full border bg-secondary px-2.5 py-0.5 text-xs hover:border-destructive hover:text-destructive">
                    {c.label} <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <SkeletonGrid count={6} cols={3} />
            ) : rows.length === 0 ? (
              <EmptyState
                title="Không tìm thấy nhà máy phù hợp"
                description="Thử bỏ bớt bộ lọc hoặc tìm với từ khóa khác."
                action={<button onClick={() => { setQ(""); apply({ q: undefined, industry: undefined, province: undefined, size: undefined }); }} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Xóa toàn bộ bộ lọc</button>}
              />
            ) : (
              <CardGrid cols={3}>
                {rows.map((c) => <CompanyCard key={c.slug} {...c} />)}
              </CardGrid>
            )}
          </div>
        </div>
      </Container>
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
