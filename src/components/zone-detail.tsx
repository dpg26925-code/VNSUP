import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { parseFaqs, ZONE_META, type ZoneKind, type ZoneRow } from "@/lib/zones";
import { Building2, Calendar, Globe, Mail, MapPin, Phone, Ruler, TrendingUp, DollarSign, Sparkles, HelpCircle, BadgeCheck } from "lucide-react";

type ZoneCompany = { id: string; slug: string; name: string; logo_url: string | null; industry: string | null; sub_industry: string | null; employee_range: string | null; verified: boolean };

export function ZoneDetail({ zone }: { zone: ZoneRow }) {
  const M = ZONE_META[zone.kind as ZoneKind];
  const faqs = parseFaqs(zone.faqs);
  const mapEmbed = zone.latitude != null && zone.longitude != null
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${zone.longitude - 0.03}%2C${zone.latitude - 0.02}%2C${zone.longitude + 0.03}%2C${zone.latitude + 0.02}&layer=mapnik&marker=${zone.latitude}%2C${zone.longitude}`
    : null;

  const [companies, setCompanies] = useState<ZoneCompany[]>([]);
  useEffect(() => {
    supabase
      .from("companies")
      .select("id,slug,name,logo_url,industry,sub_industry,employee_range,verified")
      .eq("industrial_zone_id", zone.id)
      .eq("status", "approved")
      .order("verified", { ascending: false })
      .order("name", { ascending: true })
      .limit(60)
      .then(({ data }) => setCompanies((data ?? []) as ZoneCompany[]));
  }, [zone.id]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-card">
        {zone.banner_url && (
          <div className="absolute inset-0">
            <img src={zone.banner_url} alt="" className="h-full w-full object-cover opacity-25" />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-background/30" />
          </div>
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-10">
          <nav className="mb-3 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Trang chủ</Link>
            <span className="mx-1">/</span>
            {zone.kind === "kcn" ? (
              <Link to="/khu-cong-nghiep" className="hover:text-foreground">{M.fullLabel}</Link>
            ) : (
              <Link to="/cum-cong-nghiep" className="hover:text-foreground">{M.fullLabel}</Link>
            )}
            <span className="mx-1">/</span>
            <span className="text-foreground">{zone.name}</span>
          </nav>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">{M.label}</span>
              <h1 className="mt-2 text-3xl font-bold md:text-4xl">{zone.name}</h1>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {zone.province && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{[zone.district, zone.province].filter(Boolean).join(", ")}</span>}
                {zone.developer && <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4" />{zone.developer}</span>}
                {zone.established_year && <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" />Từ {zone.established_year}</span>}
              </div>
              {zone.ai_summary && (
                <p className="mt-4 max-w-3xl rounded-xl border border-border bg-card/80 p-3 text-sm text-foreground">
                  <span className="mr-1 inline-flex items-center gap-1 text-brand"><Sparkles className="h-3.5 w-3.5" /> Tóm tắt:</span>
                  {zone.ai_summary}
                </p>
              )}
            </div>
            <a
              href="#contact"
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow-sm hover:bg-brand/90"
            >
              Yêu cầu tư vấn
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Quick info */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <QuickCard icon={<Ruler className="h-4 w-4" />} label="Diện tích" value={zone.area_ha ? `${zone.area_ha} ha` : "—"} />
          <QuickCard icon={<TrendingUp className="h-4 w-4" />} label="Tỷ lệ lấp đầy" value={typeof zone.occupancy_percent === "number" ? `${zone.occupancy_percent}%` : "—"} />
          <QuickCard icon={<DollarSign className="h-4 w-4" />} label="Giá thuê tham khảo" value={zone.land_price_usd_m2_year ? `${zone.land_price_usd_m2_year} USD/m²` : "—"} />
          <QuickCard icon={<Calendar className="h-4 w-4" />} label="Năm hoạt động" value={zone.established_year ? String(zone.established_year) : "—"} />
        </section>

        {/* Highlights + Industries */}
        {(zone.highlights?.length || zone.industries?.length) && (
          <section className="mt-8 grid gap-6 md:grid-cols-2">
            {zone.highlights && zone.highlights.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-3 text-sm font-semibold">Điểm nổi bật</h2>
                <ul className="space-y-2 text-sm">
                  {zone.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2"><span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{h}</li>
                  ))}
                </ul>
              </div>
            )}
            {zone.industries && zone.industries.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-3 text-sm font-semibold">Ngành nghề ưu tiên</h2>
                <div className="flex flex-wrap gap-2">
                  {zone.industries.map((i) => (
                    <span key={i} className="rounded-full bg-secondary px-3 py-1 text-xs text-foreground">{i}</span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Description */}
        {zone.description && (
          <section className="mt-8 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-lg font-semibold">Giới thiệu {M.label} {zone.name}</h2>
            <div className="whitespace-pre-line text-sm leading-relaxed text-foreground">{zone.description}</div>
          </section>
        )}

        {/* Map */}
        {mapEmbed && (
          <section className="mt-8 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-lg font-semibold">Vị trí</h2>
            {zone.address && <p className="mb-3 text-sm text-muted-foreground"><MapPin className="mr-1 inline h-4 w-4" />{zone.address}</p>}
            <div className="aspect-[16/9] overflow-hidden rounded-xl border border-border">
              <iframe
                src={mapEmbed}
                title={`Bản đồ ${zone.name}`}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        )}

        {/* Companies in this zone */}
        <section className="mt-8 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold">
              <Building2 className="h-5 w-5 text-brand" /> Doanh nghiệp trong {M.label} ({companies.length})
            </h2>
            <Link to="/search" search={{ zone: zone.id }} className="text-sm text-brand hover:underline">Xem tất cả →</Link>
          </div>
          {companies.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Chưa có doanh nghiệp nào được liên kết với {M.label} này.
              <div className="mt-2">
                <Link to="/dashboard/submit-company" className="text-brand hover:underline">Đăng ký doanh nghiệp của bạn →</Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((co) => (
                <Link
                  key={co.id}
                  to="/company/$slug"
                  params={{ slug: co.slug }}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-background p-3 transition hover:border-brand hover:shadow-sm"
                >
                  <div className="grid h-12 w-12 flex-shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-muted">
                    {co.logo_url ? (
                      <img src={co.logo_url} alt={co.name} className="h-full w-full object-contain" loading="lazy" />
                    ) : (
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="truncate text-sm font-semibold group-hover:text-brand">{co.name}</div>
                      {co.verified && <BadgeCheck className="h-4 w-4 flex-shrink-0 text-brand" />}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {co.industry ?? "—"}{co.sub_industry ? ` · ${co.sub_industry}` : ""}
                      {co.employee_range ? ` · ${co.employee_range}` : ""}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* FAQ */}
        {faqs.length > 0 && (
          <section className="mt-8 rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 inline-flex items-center gap-2 text-lg font-semibold"><HelpCircle className="h-5 w-5 text-brand" /> Câu hỏi thường gặp</h2>
            <div className="space-y-3">
              {faqs.map((f, idx) => (
                <details key={idx} className="group rounded-lg border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium marker:hidden">{f.q}</summary>
                  <div className="mt-2 text-sm text-muted-foreground">{f.a}</div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Contact */}
        <section id="contact" className="mt-8 rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-3 text-lg font-semibold">Liên hệ chủ đầu tư</h2>
          <div className="grid gap-2 text-sm md:grid-cols-3">
            {zone.contact_phone && <a href={`tel:${zone.contact_phone}`} className="inline-flex items-center gap-2 hover:text-brand"><Phone className="h-4 w-4" />{zone.contact_phone}</a>}
            {zone.contact_email && <a href={`mailto:${zone.contact_email}`} className="inline-flex items-center gap-2 hover:text-brand"><Mail className="h-4 w-4" />{zone.contact_email}</a>}
            {zone.website_url && <a href={zone.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-brand"><Globe className="h-4 w-4" />Website</a>}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Cần tư vấn chọn KCN/CCN phù hợp?{" "}
            <Link to="/search" className="text-brand hover:underline">Tìm nhà máy đang thuê trong khu này</Link>{" "}
            hoặc <a href={`mailto:${zone.contact_email ?? "hello@vnsupplier.cloud"}`} className="text-brand hover:underline">gửi yêu cầu tư vấn</a>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function QuickCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">{icon} {label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

/** Build head() meta+links+scripts for a zone detail page */
export function buildZoneHead(zone: ZoneRow) {
  const M = ZONE_META[zone.kind as ZoneKind];
  const url = `https://vnsupplier.cloud${M.path}/${zone.slug}`;
  const title = (zone.meta_title ?? `${zone.name} — ${M.label} tại ${zone.province ?? "Việt Nam"} | VNSupplier`).slice(0, 160);
  const desc = (zone.meta_description ?? zone.ai_summary ?? "").slice(0, 160);
  const image = zone.banner_url ?? undefined;

  const faqs = parseFaqs(zone.faqs);
  const scripts: { type: string; children: string }[] = [
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Place",
        "@id": url,
        name: zone.name,
        url,
        image,
        description: desc,
        address: zone.address ? {
          "@type": "PostalAddress",
          streetAddress: zone.address,
          addressLocality: zone.district ?? undefined,
          addressRegion: zone.province ?? undefined,
          addressCountry: "VN",
        } : undefined,
        geo: (zone.latitude != null && zone.longitude != null) ? {
          "@type": "GeoCoordinates",
          latitude: zone.latitude,
          longitude: zone.longitude,
        } : undefined,
        telephone: zone.contact_phone ?? undefined,
        email: zone.contact_email ?? undefined,
        sameAs: zone.website_url ? [zone.website_url] : undefined,
      }),
    },
    {
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Trang chủ", item: "https://vnsupplier.cloud/" },
          { "@type": "ListItem", position: 2, name: M.fullLabel, item: `https://vnsupplier.cloud${M.path}` },
          { "@type": "ListItem", position: 3, name: zone.name, item: url },
        ],
      }),
    },
  ];
  if (faqs.length > 0) {
    scripts.push({
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }),
    });
  }

  return {
    meta: [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { property: "og:url", content: url },
      ...(image ? [
        { property: "og:image", content: image },
        { name: "twitter:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
      ] : []),
    ],
    links: [
      { rel: "canonical", href: url },
      { rel: "alternate", hrefLang: "vi", href: url },
      { rel: "alternate", hrefLang: "x-default", href: url },
    ],
    scripts,
  };
}
