import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Container } from "@/components/primitives";

export const Route = createFileRoute("/language-selector")({
  component: LanguageSelectorPage,
});

function LanguageSelectorPage() {
  const text = `Tổng quan

Bảng điều khiển VNSupplier Admin.

Supabase env not configured`;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="py-20">
        <Container size="sm">
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <h1 className="mb-6 text-xl font-bold">Trạng thái Hệ thống</h1>
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
