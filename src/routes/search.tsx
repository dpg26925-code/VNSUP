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
import { ChevronDown, Filter, Search as SearchIcon, Sparkles, X } from "lucide-react";

const searchSchema = z.object({
  q: z.string().optional(),
  industry: z.string().optional(),
  province: z.string().optional(),
  size: z.string().optional(),
  cert: z.string().optional(),
  market: z.string().optional(),
  rating: z.coerce.string().optional(),
  verified: z.coerce.string().optional(),
  sort: z.string().optional(),
});

const CERTIFICATIONS = ["ISO 9001", "ISO 14001", "ISO 45001", "IATF 16949", "ISO 13485", "FSC", "BRC", "HACCP", "VietGAP", "BSCI", "WRAP"];
const EXPORT_MARKETS = ["Mỹ", "EU", "Nhật Bản", "Hàn Quốc", "Trung Quốc", "ASEAN", "Úc", "Canada", "Trung Đông", "Ấn Độ"];
const SORTS = ["featured", "name", "province", "industry", "rating"] as const;
const PAGE_SIZE = 24;

const SEARCH_TITLE = "Tìm nhà máy sản xuất | VNSupplier";
const SEARCH_DESC = "Tìm nhà máy Việt Nam theo ngành, tỉnh, quy mô, chứng nhận, thị trường xuất khẩu và đánh giá.";
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

function parseList(value: string | undefined) {
  return (value ?? "").split(",").map((v) => v.trim()).filter(Boolean);
}

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
  const [visible, setVisible] = useState(PAGE_SIZE);

  const certs = useMemo(() => parseList(search.cert), [search.cert]);
  const markets = useMemo(() => parseList(search.market), [search.market]);
  const minRating = Number(search.rating ?? 0) || 0;
  const verifiedOnly = search.verified === "1";
  const sort = SORTS.includes((search.sort ?? "") as (typeof SORTS)[number]) ? (search.sort as (typeof SORTS)[number]) : "featured";

  useEffect(() => setQ(search.q ?? ""), [search.q]);

  useEffect(() => {
    supabase.from("companies").select("id", { count: "exact", head: true })
      .then(({ count }) => setTotal(count ?? 0));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setAiTerms([]);
    setVisible(PAGE_SIZE);

    async function base(): Promise<CompanyCardProps[]> {
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
          if (!cancelled) {
            const terms = [...(res.expansion?.keywords ?? []), ...(res.expansion?.industries ?? [])]
              .map((s) => s.trim())
              .filter((s) => s && s.toLowerCase() !== (search.q ?? "").toLowerCase());
            setAiTerms(Array.from(new Set(terms)).slice(0, 8));
          }
          return (res.rows ?? []) as CompanyCardProps[];
        } catch {
          // fall through to plain query
        }
      }

      let qb = supabase.from("companies")
        .select("id,slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured,logo_url")
        .eq("status", "approved")
        .limit(200);
      if (search.industry) qb = qb.eq("industry", search.industry);
      if (search.province) qb = qb.eq("province", search.province);
      if (search.size) qb = qb.eq("employee_range", search.size);
      const { data } = await qb;
      return (data ?? []) as CompanyCardProps[];
    }

    async function run() {
      let list = await base();
      if (cancelled) return;

      if (verifiedOnly) list = list.filter((c) => c.verified);

      const ids = list.map((c) => c.id).filter((v): v is string => !!v);

      // Chứng nhận
      if (certs.length > 0 && ids.length > 0) {
        const { data } = await supabase
          .from("certifications")
          .select("company_id,name")
          .in("company_id", ids);
        if (cancelled) return;
        const ok = new Set(
          (data ?? [])
            .filter((r) => certs.some((c) => (r.name ?? "").toLowerCase().includes(c.toLowerCase())))
            .map((r) => r.company_id),
        );
        list = list.filter((c) => c.id && ok.has(c.id));
      }

      // Thị trường xuất khẩu
      if (markets.length > 0 && ids.length > 0) {
        const { data } = await supabase
          .from("company_export_markets")
          .select("company_id,country")
          .in("company_id", ids);
        if (cancelled) return;
        const ok = new Set(
          (data ?? [])
            .filter((r) => markets.some((m) => (r.country ?? "").toLowerCase().includes(m.toLowerCase())))
            .map((r) => r.company_id),
        );
        list = list.filter((c) => c.id && ok.has(c.id));
      }

      // Đánh giá
      if (ids.length > 0) {
        const { data } = await supabase
          .from("company_reviews")
          .select("company_id,rating")
          .eq("status", "published")
          .in("company_id", ids);
        if (cancelled) return;
        const agg = new Map<string, { sum: number; n: number }>();
        for (const r of data ?? []) {
          const cur = agg.get(r.company_id) ?? { sum: 0, n: 0 };
          cur.sum += r.rating ?? 0;
          cur.n += 1;
          agg.set(r.company_id, cur);
        }
        list = list.map((c) => {
          const a = c.id ? agg.get(c.id) : undefined;
          return a && a.n > 0 ? { ...c, rating: a.sum / a.n, review_count: a.n } : c;
        });
        if (minRating > 0) list = list.filter((c) => (c.rating ?? 0) >= minRating);
      }

      const sorted = [...list];
      if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name, "vi"));
      else if (sort === "province") sorted.sort((a, b) => (a.province ?? "").localeCompare(b.province ?? "", "vi"));
      else if (sort === "industry") sorted.sort((a, b) => (a.industry ?? "").localeCompare(b.industry ?? "", "vi"));
      else if (sort === "rating") sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      else sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.verified) - Number(a.verified));

      setRows(sorted);
      setLoading(false);

      // Ghi log tìm kiếm để phân tích hành vi
      void supabase.from("search_logs").insert({
        query: search.q ?? null,
        filters: {
          industry: search.industry ?? null,
          province: search.province ?? null,
          size: search.size ?? null,
          cert: certs,
          market: markets,
          rating: minRating || null,
          verified: verifiedOnly,
          sort,
        },
        results_count: sorted.length,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : null,
      });
    }

    run();
    return () => { cancelled = true; };
  }, [search.q, search.industry, search.province, search.size, search.cert, search.market, search.rating, search.verified, search.sort, runSmart, certs, markets, minRating, verifiedOnly, sort]);

  function apply(next: Partial<typeof search>) {
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, ...next }) as never, replace: true });
  }

  function toggleInList(key: "cert" | "market", value: string) {
    const current = parseList(search[key]);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    apply({ [key]: next.length > 0 ? next.join(",") : undefined } as Partial<typeof search>);
  }

  function clearAll() {
    setQ("");
    apply({ q: undefined, industry: undefined, province: undefined, size: undefined, cert: undefined, market: undefined, rating: undefined, verified: undefined });
  }

  const activeCount = [search.industry, search.province, search.size, search.rating, search.verified].filter(Boolean).length + certs.length + markets.length;

  const activeChips: { label: string; clear: () => void }[] = [];
  if (search.industry) activeChips.push({ label: `Ngành: ${search.industry}`, clear: () => apply({ industry: undefined }) });
  if (search.province) activeChips.push({ label: `Tỉnh: ${search.province}`, clear: () => apply({ province: undefined }) });
  if (search.size) activeChips.push({ label: `Quy mô: ${search.size}`, clear: () => apply({ size: undefined }) });
  if (minRating > 0) activeChips.push({ label: `Đánh giá: ${minRating}+ sao`, clear: () => apply({ rating: undefined }) });
  if (verifiedOnly) activeChips.push({ label: "Chỉ đã xác thực", clear: () => apply({ verified: undefined }) });
  for (const c of certs) activeChips.push({ label: `Chứng nhận: ${c}`, clear: () => toggleInList("cert", c) });
  for (const m of markets) activeChips.push({ label: `Thị trường: ${m}`, clear: () => toggleInList("market", m) });

  const shown = rows.slice(0, visible);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Container className="py-6">

        <form onSubmit={(e) => { e.preventDefault(); apply({ q: q || undefined }); }} className="flex items-center gap-2 rounded-md border bg-card p-2">
          <SearchIcon className="ml-2 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Từ khóa: CNC, ép nhựa, SMT…"
            className="flex-1 bg-transparent px-1 py-1 text-sm outline-none" />
          <button className="hidden rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 md:inline-block">Tìm</button>
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

        <div className="mt-4 grid gap-4 md:grid-cols-[240px,1fr]">
          <aside className={(showFilters ? "block " : "hidden ") + "md:block"}>
            <div className="space-y-2 rounded-md border bg-card p-4 text-sm">
              <label className="flex cursor-pointer items-center justify-between gap-2 pb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chỉ nhà máy đã xác thực</span>
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => apply({ verified: e.target.checked ? "1" : undefined })}
                  className="h-4 w-4 accent-[var(--brand)]"
                />
              </label>

              <FilterSection label="Ngành" defaultOpen>
                <ChipList options={INDUSTRIES.map((i) => i.name)} isOn={(v) => search.industry === v} onToggle={(v) => apply({ industry: search.industry === v ? undefined : v })} />
              </FilterSection>

              <FilterSection label="Tỉnh/TP">
                <ChipList options={PROVINCES.map((p) => p.name)} isOn={(v) => search.province === v} onToggle={(v) => apply({ province: search.province === v ? undefined : v })} />
              </FilterSection>

              <FilterSection label="Số lao động" defaultOpen>
                <select
                  value={search.size ?? ""}
                  onChange={(e) => apply({ size: e.target.value || undefined })}
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-xs"
                >
                  <option value="">Tất cả</option>
                  {EMPLOYEE_RANGES.map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </FilterSection>

              <FilterSection label="Chứng nhận">
                <ChipList options={CERTIFICATIONS} isOn={(v) => certs.includes(v)} onToggle={(v) => toggleInList("cert", v)} />
              </FilterSection>

              <FilterSection label="Đánh giá">
                <ChipList
                  options={["4", "3", "2"]}
                  render={(v) => `${v}+ ★`}
                  isOn={(v) => search.rating === v}
                  onToggle={(v) => apply({ rating: search.rating === v ? undefined : v })}
                />
              </FilterSection>

              <FilterSection label="Thị trường xuất khẩu">
                <ChipList options={EXPORT_MARKETS} isOn={(v) => markets.includes(v)} onToggle={(v) => toggleInList("market", v)} />
              </FilterSection>

              {activeCount > 0 && (
                <button onClick={clearAll} className="inline-flex items-center gap-1 pt-1 text-xs text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" /> Xóa bộ lọc
                </button>
              )}
            </div>
          </aside>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {loading ? "Đang tải…" : (
                  <>Tìm thấy <span className="font-semibold text-foreground">{rows.length}</span>{total > 0 && <>/{total}</>} nhà máy</>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <label className="text-muted-foreground">Sắp xếp:</label>
                <select
                  value={sort}
                  onChange={(e) => apply({ sort: e.target.value })}
                  className="rounded-md border bg-card px-2 py-1"
                >
                  <option value="featured">Nổi bật</option>
                  <option value="name">Tên A→Z</option>
                  <option value="province">Tỉnh/TP</option>
                  <option value="industry">Ngành</option>
                  <option value="rating">Đánh giá</option>
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

            {!loading && search.q && aiTerms.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 p-2">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3 w-3" /> AI mở rộng:
                </span>
                {aiTerms.map((t) => (
                  <button
                    key={t}
                    onClick={() => { setQ(t); apply({ q: t }); }}
                    className="rounded-full border bg-card px-2 py-0.5 text-xs hover:border-primary hover:text-primary"
                    title={`Tìm với "${t}"`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {loading ? (
              <SkeletonGrid count={6} cols={3} />
            ) : rows.length === 0 ? (
              <EmptyState
                title="Không tìm thấy kết quả"
                description="Thử bỏ bớt bộ lọc hoặc tìm với từ khóa khác."
                action={<button onClick={clearAll} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Xóa toàn bộ bộ lọc</button>}
              />
            ) : (
              <>
                <CardGrid cols={3}>
                  {shown.map((c) => <CompanyCard key={c.slug} {...c} />)}
                </CardGrid>
                {visible < rows.length && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className="rounded-md border px-5 py-2 text-sm font-semibold hover:border-brand hover:text-brand"
                    >
                      Xem thêm {Math.min(PAGE_SIZE, rows.length - visible)} nhà máy
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Container>

      {/* Sticky nút Tìm trên mobile */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
        <button
          onClick={() => { apply({ q: q || undefined }); setShowFilters(false); }}
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-brand-foreground shadow-sm"
        >
          Tìm {rows.length > 0 && !loading ? `(${rows.length} kết quả)` : ""}
        </button>
      </div>

      <SiteFooter />
    </div>
  );
}

function FilterSection({ label, defaultOpen = false, children }: { label: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border pt-2 first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
      >
        {label}
        <ChevronDown className={"h-3.5 w-3.5 transition-transform " + (open ? "rotate-180" : "")} />
      </button>
      {open && <div className="pb-2 pt-1.5">{children}</div>}
    </div>
  );
}

function ChipList({
  options,
  isOn,
  onToggle,
  render,
}: {
  options: string[];
  isOn: (v: string) => boolean;
  onToggle: (v: string) => void;
  render?: (v: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = isOn(o);
        return (
          <button key={o} onClick={() => onToggle(o)}
            className={"rounded-full border px-2.5 py-1 text-xs transition " + (active ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary hover:text-primary")}>
            {render ? render(o) : o}
          </button>
        );
      })}
    </div>
  );
}
