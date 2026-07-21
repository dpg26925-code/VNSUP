import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { CompanyCard, type CompanyCardProps } from "@/components/company-card";
import { industrySlug, provinceSlug, truncate, abs } from "@/lib/factory";
import { BadgeCheck, Globe, Mail, MapPin, Phone, Sparkles, Star, Users } from "lucide-react";

type Company = {
  id: string; slug: string; name: string;
  province: string | null; district: string | null;
  industry: string | null; sub_industry: string | null;
  employee_range: string | null; founded_year: number | null;
  website: string | null; phone: string | null; email: string | null; address: string | null;
  description: string | null; ai_summary: string | null;
  capabilities: unknown; verified: boolean; featured: boolean;
  stock_exchange: string | null; stock_ticker: string | null;
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
    const title = `${c.name} | ${c.industry ?? "Sản xuất"} tại ${c.province ?? "Việt Nam"} | FactoryHub`;
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
  component: CompanyPage,
});


function CompanyPage() {
  const c = Route.useLoaderData() as Company;
  const caps = Array.isArray(c.capabilities) ? (c.capabilities as string[]) : [];
  const [similar, setSimilar] = useState<CompanyCardProps[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; category: string | null; description: string | null }[]>([]);

  useEffect(() => {
    supabase.from("companies").select("slug,name,province,industry,employee_range,ai_summary,capabilities,verified,featured")
      .eq("industry", c.industry ?? "").neq("id", c.id).limit(4)
      .then(({ data }) => setSimilar((data ?? []) as CompanyCardProps[]));
    supabase.from("products").select("id,name,category,description").eq("company_id", c.id).limit(20)
      .then(({ data }) => setProducts(data ?? []));
  }, [c.id, c.industry]);

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

        {/* Header */}
        <div className="rounded-lg border bg-card p-6">
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
            <div className="flex gap-2">
              {c.verified && <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success"><BadgeCheck className="h-3.5 w-3.5" /> Đã xác thực</span>}
              {c.featured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700"><Star className="h-3.5 w-3.5" /> Nổi bật</span>}
            </div>
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

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {c.description && (
              <section className="rounded-lg border bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">Giới thiệu</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">{c.description}</p>
              </section>
            )}

            {caps.length > 0 && (
              <section className="rounded-lg border bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">Năng lực sản xuất</h2>
                <div className="flex flex-wrap gap-2">
                  {caps.map((cap) => (
                    <span key={cap} className="rounded-md border bg-background px-2.5 py-1 text-sm">{cap}</span>
                  ))}
                </div>
              </section>
            )}

            {products.length > 0 && (
              <section className="rounded-lg border bg-card p-6">
                <h2 className="mb-3 text-lg font-semibold">Sản phẩm</h2>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {products.map((p) => (
                    <li key={p.id} className="rounded border p-3 text-sm">
                      <div className="font-medium">{p.name}</div>
                      {p.category && <div className="text-xs text-muted-foreground">{p.category}</div>}
                    </li>
                  ))}
                </ul>
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

            <ContactForm companyId={c.id} companyName={c.name} />
          </aside>
        </div>

        {similar.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold">Nhà cung cấp tương tự</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {similar.map((s) => <CompanyCard key={s.slug} {...s} />)}
            </div>
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

  return (
    <section className="rounded-lg border bg-card p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Liên hệ {companyName}</h3>
      {status === "sent" ? (
        <div className="mt-3 rounded-md bg-success/10 p-3 text-sm text-success">Đã gửi. Nhà máy sẽ liên hệ lại sớm.</div>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-2 text-sm">
          <input required maxLength={100} placeholder="Họ và tên *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 outline-none" />
          <input required type="email" maxLength={200} placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 outline-none" />
          <input maxLength={30} placeholder="Số điện thoại" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 outline-none" />
          <input maxLength={150} placeholder="Công ty" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 outline-none" />
          <textarea required maxLength={2000} rows={4} placeholder="Mô tả nhu cầu (số lượng, ngành, thời gian giao) *" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 outline-none" />
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button disabled={status === "sending"} className="w-full rounded-md bg-primary py-2 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {status === "sending" ? "Đang gửi…" : "Gửi yêu cầu"}
          </button>
        </form>
      )}
    </section>
  );
}
