import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Container } from "@/components/primitives";

export const Route = createFileRoute("/language-selector")({
  component: LanguageSelectorPage,
});

function LanguageSelectorPage() {
  const text = `Có. 3 cải thiện chính cần làm trên VNSupplier:

🔴 Cần sửa code/Lovable

Company profile metadata đang sai — /company/{slug} và /companies/{province}/{slug} đang trả SEO metadata của /search

Thiếu canonical/hreflang — /pricing, /auth, /blog, /province/*, /industry/*

🟠 Cần bổ sung data

Companies thiếu thông tin pháp lý — tax_code, legal_representative, business_registration_number đang null ở phần lớn records

Một số tỉnh còn ít companies — có thể crawl thêm từ Google Maps hoặc web scrapers`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="py-20">
        <Container size="sm">
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <h1 className="mb-6 text-xl font-bold">Kế hoạch cải thiện VNSupplier</h1>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {text}
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
