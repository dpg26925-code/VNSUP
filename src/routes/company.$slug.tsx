import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { CompanyCard, type CompanyCardProps } from "@/components/company-card";
import { industrySlug, provinceSlug, truncate, abs } from "@/lib/factory";
import { BadgeCheck, Building2, Calendar, DollarSign, Globe, Mail, MapPin, Newspaper, Phone, Play, Sparkles, Star, Users, ShieldQuestion, Award, Image as ImageIcon, HelpCircle, Package, Globe2, MessageSquare } from "lucide-react";

type FAQ = { q: string; a: string };
type Certification = { name: string; issuer?: string; year?: number | string };
type Review = { id: string; rating: number; title: string | null; content: string; reviewer_name: string | null; created_at: string; user_id: string };

type Company = {
  id: string; slug: string; name: string;
  province: string | null; district: string | null;
  industry: string | null; sub_industry: string | null;
  employee_range: string | null; founded_year: number | null;
  revenue_range: string | null; company_type: string | null;
  website: string | null; phone: string | null; email: string | null; address: string | null;
  logo_url: string | null; cover_url: string | null; video_url: string | null;
  description: string | null; ai_summary: string | null;
  capabilities: unknown; certifications: unknown; gallery_urls: unknown; faqs: unknown;
  export_markets: unknown;
  verified: boolean; featured: boolean;
  stock_exchange: string | null; stock_ticker: string | null;
  submitted_by: string | null;
};



async function loadCompany(slug: string) {
  const { data, error } = await supabase.from("companies").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) throw notFound();
  return data as Company;
}

export const Route = createFileRoute("/company/$slug")({
  loader: async ({ params }) => loadCompany(params.slug),
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [{ title: "Không tìm thấy nhà máy" }, { name: "robots", content: "noindex" }] };
    const c = loaderData;
    const title = `${c.name} | ${c.industry ?? "Sản xuất"} tại ${c.province ?? "Việt Nam"} | VNSupplier`;
    const desc = truncate(c.ai_summary ?? c.description, 155);
    const url = abs(`/company/${params.slug}`);
    const breadcrumbs: { "@type": "ListItem"; position: number; name: string; item: string }[] = [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: abs("/") },
    ];
    if (c.industry) {
      const iSlug = industrySlug(c.industry);
      if (iSlug) breadcrumbs.push({ "@type": "ListItem", position: breadcrumbs.length + 1, name: c.industry, item: abs(`/industry/${iSlug}`) });
    }
    if (c.province) {
      const pSlug = provinceSlug(c.province);
      if (pSlug) breadcrumbs.push({ "@type": "ListItem", position: breadcrumbs.length + 1, name: c.province, item: abs(`/province/${pSlug}`) });
    }
    breadcrumbs.push({ "@type": "ListItem", position: breadcrumbs.length + 1, name: c.name, item: url });

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: `${c.name} — ${c.sub_industry ?? c.industry ?? ""}` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": url,
            name: c.name,
            url,
            logo: c.logo_url ?? undefined,
            image: c.logo_url ?? undefined,
            address: c.address ? {
              "@type": "PostalAddress",
              streetAddress: c.address,
              addressLocality: c.district ?? undefined,
              addressRegion: c.province ?? undefined,
              addressCountry: "VN",
            } : undefined,
            telephone: c.phone ?? undefined,
            email: c.email ?? undefined,
            sameAs: c.website ? [c.website] : undefined,
            areaServed: c.province ?? undefined,
            foundingDate: c.founded_year ? String(c.founded_year) : undefined,
            tickerSymbol: c.stock_ticker ? `${c.stock_exchange ?? ""}:${c.stock_ticker}`.replace(/^:/, "") : undefined,
            description: desc,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbs,
          }),
        },
      ],
    };
  },
  notFoundComponent: CompanyNotFound,
  component: CompanyPage,
});

function CompanyNotFound() {
  const { slug } = Route.useParams();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">404 · Không tìm thấy</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Không có nhà máy với đường dẫn này</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Slug <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">{slug}</code> không khớp hồ sơ đã duyệt nào. Có thể liên kết đã cũ hoặc bạn gõ nhầm.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to="/search" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Tìm nhà máy</Link>
          <Link to="/" className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-secondary">Về trang chủ</Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}


function initials(name: string) {
  return name.replace(/(Công ty|TNHH|Cổ phần|CP|MTV)/gi, "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "F";
}

function CompanyPage() {
  const c = Route.useLoaderData() as Company;
  const caps = Array.isArray(c.capabilities) ? (c.capabilities as string[]) : [];
  const certs: Certification[] = Array.isArray(c.certifications)
    ? (c.certifications as unknown[]).map((v) => (typeof v === "string" ? { name: v } : (v as Certification))).filter((v) => v && v.name)
    : [];
  const gallery: string[] = Array.isArray(c.gallery_urls) ? (c.gallery_urls as string[]).filter((u) => typeof u === "string" && u) : [];
  const faqs: FAQ[] = Array.isArray(c.faqs) ? (c.faqs as FAQ[]).filter((f) => f && f.q && f.a) : [];
  const exportMarkets: string[] = Array.isArray(c.export_markets) ? (c.export_markets as string[]).filter((v) => typeof v === "string" && v) : [];
  const [similar, setSimilar] = useState<CompanyCardProps[]>([]);
  const [showAllSimilar, setShowAllSimilar] = useState(false);
  const [products, setProducts] = useState<{ id: string; name: string; category: string | null; description: string | null }[]>([]);
  const [updates, setUpdates] = useState<{ id: string; title: string; content: string | null; update_type: string | null; published_at: string | null }[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsVersion, setReviewsVersion] = useState(0);

  useEffect(() => {
    supabase.from("companies").select("slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured,logo_url")
      .eq("industry", c.industry ?? "").neq("id", c.id).limit(18)
      .then(({ data }) => setSimilar((data ?? []) as CompanyCardProps[]));
    supabase.from("products").select("id,name,category,description").eq("company_id", c.id).limit(20)
      .then(({ data }) => setProducts(data ?? []));
    supabase.from("company_updates").select("id,title,content,update_type,published_at")
      .eq("company_id", c.id).not("published_at", "is", null)
      .order("published_at", { ascending: false }).limit(6)
      .then(({ data }) => setUpdates(data ?? []));
    supabase.from("company_reviews").select("id,rating,title,content,reviewer_name,created_at,user_id")
      .eq("company_id", c.id).eq("status", "published")
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => setReviews((data ?? []) as Review[]));
  }, [c.id, c.industry, reviewsVersion]);

  const mapQuery = encodeURIComponent([c.name, c.address, c.district, c.province].filter(Boolean).join(", "));
  const mapEmbed = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapLink = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;
  const shownSimilar = showAllSimilar ? similar : similar.slice(0, 6);
  const videoEmbed = getVideoEmbed(c.video_url);
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;



  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="mb-4 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Trang chủ</Link> <span className="mx-1">/</span>
          {c.industry && <>
            <Link to="/industry/$slug" params={{ slug: industrySlug(c.industry) || "cnc" }} className="hover:text-foreground">{c.industry}</Link>
            <span className="mx-1">/</span>
          </>}
          <span className="text-foreground">{c.name}</span>
        </nav>

        {/* Hero header with gradient banner */}
        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary via-primary to-brand md:h-48">
            {c.cover_url ? (
              <img src={c.cover_url} alt={`Banner ${c.name}`} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.5) 0, transparent 40%), radial-gradient(circle at 80% 60%, rgba(255,255,255,0.3) 0, transparent 35%)" }} />
            )}
            {c.logo_url ? (
              <img src={c.logo_url} alt={`Logo ${c.name}`} className="absolute -bottom-8 left-6 h-20 w-20 rounded-2xl border-4 border-card bg-background object-contain p-1.5 shadow-md" />
            ) : (
              <div className="absolute -bottom-8 left-6 grid h-20 w-20 place-items-center rounded-2xl border-4 border-card bg-gradient-to-br from-brand to-primary text-2xl font-bold text-primary-foreground shadow-md">
                {initials(c.name)}
              </div>
            )}
            <div className="absolute right-4 top-4 flex flex-wrap gap-2">
              {c.verified && <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-success-foreground shadow"><BadgeCheck className="h-3.5 w-3.5" fill="currentColor" strokeWidth={2.25} /> Đã xác thực</span>}
              {c.featured && <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-brand-foreground shadow"><Star className="h-3.5 w-3.5" fill="currentColor" /> Nổi bật</span>}
            </div>
          </div>
          <div className="px-6 pb-6 pt-12">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold md:text-3xl">{c.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  {c.province && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{c.province}{c.district && `, ${c.district}`}</span>}
                  {c.industry && (
                    <Link to="/industry/$slug" params={{ slug: industrySlug(c.industry) || "cnc" }} className="rounded bg-secondary px-2 py-0.5 text-xs font-medium hover:bg-primary hover:text-primary-foreground">{c.industry}{c.sub_industry ? ` · ${c.sub_industry}` : ""}</Link>
                  )}
                  {c.employee_range && <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />{c.employee_range}</span>}
                  {c.founded_year && <span>Thành lập {c.founded_year}</span>}
                </div>
              </div>
              {c.stock_ticker && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary" title={c.stock_exchange ? `Niêm yết trên ${c.stock_exchange}` : "Đã niêm yết"}>
                  {c.stock_exchange ?? "STOCK"}: {c.stock_ticker}
                </span>
              )}
            </div>

            {/* AI Summary */}
            {c.ai_summary && (
              <div className="mt-5 rounded-md border border-primary/30 bg-primary/5 p-4">
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                  <Sparkles className="h-3 w-3" /> AI Summary
                </div>
                <p className="text-sm leading-relaxed">{c.ai_summary}</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Info Stats */}
        <QuickInfoStats c={c} />


        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {c.description && (
              <section className="rounded-lg border bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">Giới thiệu</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{c.description}</p>
              </section>
            )}

            <section className="rounded-lg border bg-card p-6">
              <h2 className="mb-3 text-lg font-semibold">Năng lực sản xuất</h2>
              {caps.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {caps.map((cap) => (
                      <span key={cap} className="inline-flex items-center gap-1 rounded-md border border-brand/30 bg-brand-soft px-2.5 py-1 text-sm font-medium text-brand">
                        <BadgeCheck className="h-3.5 w-3.5" strokeWidth={2.25} />{cap}
                      </span>
                    ))}
                  </div>
                  <dl className="mt-5 grid gap-3 border-t pt-5 text-sm sm:grid-cols-2">
                    <div className="rounded-md bg-secondary/50 p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quy mô</dt>
                      <dd className="mt-1 font-medium">{c.employee_range ?? "Chưa cập nhật"} lao động</dd>
                    </div>
                    <div className="rounded-md bg-secondary/50 p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ngành</dt>
                      <dd className="mt-1 font-medium">{c.industry ?? "-"}{c.sub_industry ? ` · ${c.sub_industry}` : ""}</dd>
                    </div>
                    <div className="rounded-md bg-secondary/50 p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kinh nghiệm</dt>
                      <dd className="mt-1 font-medium">{c.founded_year ? `${new Date().getFullYear() - c.founded_year}+ năm` : "Chưa cập nhật"}</dd>
                    </div>
                    <div className="rounded-md bg-secondary/50 p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vị trí</dt>
                      <dd className="mt-1 font-medium">{c.province ?? "-"}</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Nhà máy chưa cập nhật danh sách năng lực chi tiết. Vui lòng liên hệ trực tiếp để trao đổi.</p>
              )}
            </section>

            {products.length > 0 && (
              <section className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Package className="h-5 w-5 text-brand" />Sản phẩm & dịch vụ</h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {products.map((p) => (
                    <li key={p.id} className="rounded-lg border bg-background p-3.5 text-sm transition hover:border-brand/40">
                      <div className="font-semibold">{p.name}</div>
                      {p.category && <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{p.category}</div>}
                      {p.description && <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {certs.length > 0 && (
              <section className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Award className="h-5 w-5 text-brand" />Chứng nhận</h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {certs.map((cert, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-md border border-success/20 bg-success/5 p-3">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold">{cert.name}</div>
                        {(cert.issuer || cert.year) && (
                          <div className="text-[11px] text-muted-foreground">{[cert.issuer, cert.year].filter(Boolean).join(" · ")}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {gallery.length > 0 && (
              <section className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><ImageIcon className="h-5 w-5 text-brand" />Hình ảnh nhà máy</h2>
                <div className="grid gap-2 sm:grid-cols-3">
                  {gallery.slice(0, 9).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener" className="group relative aspect-square overflow-hidden rounded-lg border bg-secondary">
                      <img src={url} alt={`Ảnh nhà máy ${c.name} ${i + 1}`} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            {videoEmbed && (
              <section className="overflow-hidden rounded-lg border bg-card">
                <div className="flex items-center gap-2 p-4">
                  <h2 className="flex items-center gap-2 text-lg font-semibold"><Play className="h-5 w-5 text-brand" />Video giới thiệu</h2>
                </div>
                <div className="aspect-video w-full bg-black">
                  <iframe src={videoEmbed} title={`Video ${c.name}`} className="h-full w-full border-0" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                </div>
              </section>
            )}

            {faqs.length > 0 && (
              <section className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><HelpCircle className="h-5 w-5 text-brand" />Câu hỏi thường gặp</h2>
                <div className="divide-y">
                  {faqs.map((f, i) => (
                    <details key={i} className="group py-3">
                      <summary className="flex cursor-pointer items-start justify-between gap-3 text-sm font-semibold marker:content-none">
                        <span>{f.q}</span>
                        <span className="text-muted-foreground transition group-open:rotate-45">+</span>
                      </summary>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{f.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}

            {exportMarkets.length > 0 && (
              <section className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Globe2 className="h-5 w-5 text-brand" />Thị trường xuất khẩu</h2>
                <div className="flex flex-wrap gap-2">
                  {exportMarkets.map((m) => (
                    <span key={m} className="inline-flex items-center gap-1 rounded-full border bg-secondary/60 px-3 py-1 text-sm font-medium">
                      <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />{m}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <ReviewsSection
              companyId={c.id}
              companyName={c.name}
              reviews={reviews}
              avgRating={avgRating}
              onChange={() => setReviewsVersion((v) => v + 1)}
            />


            {updates.length > 0 && (
              <section className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Newspaper className="h-5 w-5 text-brand" />Tin tức & cập nhật</h2>
                <ul className="space-y-3">
                  {updates.map((u) => (
                    <li key={u.id} className="rounded-md border-l-2 border-brand bg-secondary/40 p-3">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        {u.update_type && <span className="rounded bg-brand/10 px-1.5 py-0.5 font-semibold text-brand">{u.update_type}</span>}
                        {u.published_at && <span>{new Date(u.published_at).toLocaleDateString("vi-VN")}</span>}
                      </div>
                      <div className="mt-1 text-sm font-semibold">{u.title}</div>
                      {u.content && <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{u.content}</p>}
                    </li>
                  ))}
                </ul>
              </section>
            )}



            {/* Map */}
            {(c.address || c.province) && (
              <section className="overflow-hidden rounded-lg border bg-card">
                <div className="flex items-center justify-between p-4">
                  <h2 className="text-lg font-semibold">Vị trí nhà máy</h2>
                  <a href={mapLink} target="_blank" rel="noopener" className="text-xs font-semibold text-brand hover:underline">Mở Google Maps →</a>
                </div>
                <iframe
                  title={`Bản đồ ${c.name}`}
                  src={mapEmbed}
                  className="h-64 w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <section className="rounded-lg border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Liên hệ</h3>
              <ul className="space-y-2 text-sm">
                {c.address && <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />{c.address}</li>}
                {c.phone && <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><a className="hover:text-primary" href={`tel:${c.phone}`}>{c.phone}</a></li>}
                {c.email && <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><a className="hover:text-primary" href={`mailto:${c.email}`}>{c.email}</a></li>}
                {c.website && <li className="flex gap-2"><Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><a className="truncate hover:text-primary" href={c.website} target="_blank" rel="noopener">{c.website.replace(/^https?:\/\//, "")}</a></li>}
              </ul>
            </section>

            {!c.submitted_by && <ClaimCard companyId={c.id} companyName={c.name} />}

            <ContactForm companyId={c.id} companyName={c.name} />
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Nhà cung cấp tương tự</h2>
              <span className="text-xs text-muted-foreground">{similar.length} kết quả</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shownSimilar.map((s) => <CompanyCard key={s.slug} {...s} />)}
            </div>
            {similar.length > 6 && (
              <div className="mt-4 text-center">
                <button onClick={() => setShowAllSimilar((v) => !v)} className="rounded-md border px-4 py-2 text-sm font-semibold hover:border-brand hover:text-brand">
                  {showAllSimilar ? "Thu gọn" : `Xem thêm ${similar.length - 6} nhà máy`}
                </button>
              </div>
            )}
          </section>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

function ContactForm({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending"); setErr(null);
    if (form.name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(form.email) || form.message.trim().length < 10) {
      setStatus("error"); setErr("Vui lòng nhập tên, email hợp lệ và tin nhắn ≥ 10 ký tự."); return;
    }
    const { error } = await supabase.from("leads").insert({
      company_id: companyId, name: form.name.trim(), email: form.email.trim(),
      phone: form.phone.trim() || null, company: form.company.trim() || null,
      message: form.message.trim(), source_page: typeof window !== "undefined" ? window.location.pathname : null,
    });
    if (error) { setStatus("error"); setErr(error.message); return; }
    setStatus("sent");
    setForm({ name: "", email: "", phone: "", company: "", message: "" });
  }

  const inputCls = "w-full rounded-md border bg-background px-3 py-2 outline-none transition focus:ring-2 focus:ring-primary/20";

  return (
    <section className="rounded-lg border bg-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Yêu cầu báo giá</h3>
      <p className="mt-1 text-xs text-muted-foreground">Gửi trực tiếp đến {companyName}. Phản hồi trong 24h.</p>
      {status === "sent" ? (
        <div className="mt-4 rounded-md border border-success/30 bg-success/10 p-4 text-sm">
          <div className="font-semibold text-success">✓ Đã gửi yêu cầu</div>
          <p className="mt-1 text-muted-foreground">{companyName} sẽ liên hệ lại qua email/điện thoại bạn đã cung cấp.</p>
          <button onClick={() => setStatus("idle")} className="mt-3 text-xs font-semibold text-primary hover:underline">Gửi yêu cầu khác</button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-2 text-sm">
          <input required maxLength={100} placeholder="Họ và tên (VD: Nguyễn Văn A) *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
          <input required type="email" maxLength={200} placeholder="Email công việc (VD: buyer@congty.com) *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
          <input maxLength={30} placeholder="Số điện thoại (VD: 0901 234 567)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
          <input maxLength={150} placeholder="Tên công ty (VD: Công ty ABC)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputCls} />
          <textarea required maxLength={2000} rows={4} placeholder="Mô tả nhu cầu: sản phẩm, số lượng/tháng, ngành, thời gian giao hàng… *" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputCls} />
          {err && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{err}</div>}
          <button disabled={status === "sending"} className="w-full rounded-md bg-primary py-2.5 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {status === "sending" ? "Đang gửi…" : "Gửi yêu cầu báo giá"}
          </button>
          <p className="text-center text-[11px] text-muted-foreground">Miễn phí · Không spam · Bảo mật thông tin</p>
        </form>
      )}
    </section>
  );
}

function ClaimCard({ companyId, companyName }: { companyId: string; companyName: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error" | "exists">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setEmail(data.user.email ?? "");
        setName((data.user.user_metadata?.full_name as string) ?? "");
        const { data: existing } = await supabase
          .from("company_claims")
          .select("id,status")
          .eq("company_id", companyId)
          .eq("user_id", data.user.id)
          .maybeSingle();
        if (existing) setStatus("exists");
      }
    })();
  }, [open, companyId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending"); setErr(null);
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      setStatus("error");
      setErr("Bạn cần đăng nhập để gửi yêu cầu xác thực quyền sở hữu.");
      return;
    }
    if (name.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus("error"); setErr("Nhập họ tên và email hợp lệ."); return;
    }
    const { error } = await supabase.from("company_claims").insert({
      company_id: companyId,
      user_id: userRes.user.id,
      requester_email: email.trim(),
      requester_name: name.trim(),
      note: note.trim() || null,
    });
    if (error) { setStatus("error"); setErr(error.message); return; }
    setStatus("sent");
  }

  const inputCls = "w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <section className="rounded-lg border border-brand/30 bg-brand-soft/40 p-5">
      <div className="flex items-start gap-2">
        <ShieldQuestion className="mt-0.5 h-5 w-5 text-brand" />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Bạn là chủ nhà máy này?</h3>
          <p className="mt-1 text-xs text-muted-foreground">Yêu cầu xác thực quyền sở hữu để cập nhật thông tin, phản hồi báo giá và mở khoá các tính năng nâng cao.</p>
        </div>
      </div>
      {!open ? (
        <button onClick={() => setOpen(true)} className="mt-3 w-full rounded-md bg-brand py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90">
          Yêu cầu xác thực (Claim)
        </button>
      ) : status === "sent" ? (
        <div className="mt-3 rounded-md border border-success/30 bg-success/10 p-3 text-xs">
          <div className="font-semibold text-success">✓ Đã gửi yêu cầu</div>
          <p className="mt-1 text-muted-foreground">Admin VNSupplier sẽ liên hệ xác minh trong 1–2 ngày làm việc.</p>
        </div>
      ) : status === "exists" ? (
        <div className="mt-3 rounded-md border bg-card p-3 text-xs text-muted-foreground">
          Bạn đã gửi yêu cầu cho nhà máy này. Xem trạng thái trong <Link to="/dashboard/my-companies" className="font-semibold text-brand hover:underline">Doanh nghiệp của tôi</Link>.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-2">
          <input placeholder="Họ và tên *" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
          <input type="email" placeholder="Email công việc *" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} required />
          <textarea rows={3} placeholder={`Chứng minh bạn là đại diện hợp pháp của ${companyName} (chức vụ, giấy tờ, website nội bộ…)`} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} />
          {err && <div className="rounded border border-destructive/30 bg-destructive/10 p-2 text-[11px] text-destructive">{err}</div>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-md border py-2 text-sm hover:bg-accent">Hủy</button>
            <button disabled={status === "sending"} className="flex-1 rounded-md bg-brand py-2 text-sm font-semibold text-brand-foreground hover:bg-brand/90 disabled:opacity-60">
              {status === "sending" ? "Đang gửi…" : "Gửi yêu cầu"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function getVideoEmbed(url: string | null): string | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function QuickInfoStats({ c }: { c: Company }) {
  const items: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (c.founded_year) items.push({ icon: <Calendar className="h-4 w-4" />, label: "Thành lập", value: `${c.founded_year} (${new Date().getFullYear() - c.founded_year}+ năm)` });
  if (c.employee_range) items.push({ icon: <Users className="h-4 w-4" />, label: "Quy mô", value: `${c.employee_range} lao động` });
  if (c.revenue_range) items.push({ icon: <DollarSign className="h-4 w-4" />, label: "Doanh thu", value: c.revenue_range });
  if (c.company_type) items.push({ icon: <Building2 className="h-4 w-4" />, label: "Loại hình", value: c.company_type });
  if (items.length === 0) return null;
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">{it.icon}</div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{it.label}</div>
            <div className="mt-0.5 truncate text-sm font-semibold">{it.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={n <= rounded ? "text-brand" : "text-muted-foreground/30"} style={{ width: size, height: size }} fill="currentColor" strokeWidth={0} />
      ))}
    </span>
  );
}

function ReviewsSection({
  companyId, companyName, reviews, avgRating, onChange,
}: {
  companyId: string; companyName: string; reviews: Review[]; avgRating: number; onChange: () => void;
}) {
  const [me, setMe] = useState<{ id: string; email: string | null; name: string | null } | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return setMe(null);
      setMe({
        id: data.user.id,
        email: data.user.email ?? null,
        name: (data.user.user_metadata?.full_name as string) ?? (data.user.user_metadata?.name as string) ?? null,
      });
    });
  }, []);

  const myReview = me ? reviews.find((r) => r.user_id === me.id) ?? null : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me) { setErr("Bạn cần đăng nhập để đánh giá."); setStatus("error"); return; }
    if (content.trim().length < 10) { setErr("Nội dung đánh giá cần ít nhất 10 ký tự."); setStatus("error"); return; }
    setStatus("sending"); setErr(null);
    const payload = {
      company_id: companyId,
      user_id: me.id,
      rating,
      title: title.trim() || null,
      content: content.trim(),
      reviewer_name: me.name,
    };
    const { error } = myReview
      ? await supabase.from("company_reviews").update(payload).eq("id", myReview.id)
      : await supabase.from("company_reviews").insert(payload);
    if (error) { setErr(error.message); setStatus("error"); return; }
    setStatus("sent"); setTitle(""); setContent(""); setRating(5);
    onChange();
  }

  async function remove(id: string) {
    if (!confirm("Xoá đánh giá của bạn?")) return;
    const { error } = await supabase.from("company_reviews").delete().eq("id", id);
    if (!error) onChange();
  }

  return (
    <section className="rounded-lg border bg-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><MessageSquare className="h-5 w-5 text-brand" />Đánh giá từ khách hàng</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Stars value={avgRating} size={16} />
            <span className="font-semibold">{avgRating.toFixed(1)}</span>
            <span className="text-muted-foreground">· {reviews.length} đánh giá</span>
          </div>
        )}
      </div>

      {me ? (
        <form onSubmit={submit} className="mb-6 space-y-2 rounded-md border bg-background p-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Đánh giá của bạn:</span>
            {[1, 2, 3, 4, 5].map((n) => (
              <button type="button" key={n} onClick={() => setRating(n)} aria-label={`${n} sao`}>
                <Star className={n <= rating ? "text-brand" : "text-muted-foreground/30"} fill="currentColor" strokeWidth={0} width={20} height={20} />
              </button>
            ))}
          </div>
          <input maxLength={120} placeholder="Tiêu đề (tuỳ chọn)" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          <textarea required rows={3} maxLength={2000} placeholder={`Chia sẻ trải nghiệm làm việc với ${companyName}…`} value={content} onChange={(e) => setContent(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20" />
          {err && <div className="rounded border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">{err}</div>}
          {status === "sent" && <div className="rounded border border-success/30 bg-success/10 p-2 text-xs text-success">✓ Đã lưu đánh giá.</div>}
          <button disabled={status === "sending"} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {status === "sending" ? "Đang gửi…" : myReview ? "Cập nhật đánh giá" : "Đăng đánh giá"}
          </button>
        </form>
      ) : (
        <div className="mb-6 rounded-md border bg-secondary/40 p-3 text-sm text-muted-foreground">
          <Link to="/auth" className="font-semibold text-brand hover:underline">Đăng nhập</Link> để đánh giá nhà cung cấp này.
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ trải nghiệm.</p>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-md border bg-background p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-sm font-semibold">{r.reviewer_name ?? "Khách hàng"}</span>
                  <span className="text-[11px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("vi-VN")}</span>
                </div>
                {me?.id === r.user_id && (
                  <button onClick={() => remove(r.id)} className="text-[11px] font-semibold text-destructive hover:underline">Xoá</button>
                )}
              </div>
              {r.title && <div className="mt-1 text-sm font-semibold">{r.title}</div>}
              <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{r.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}


