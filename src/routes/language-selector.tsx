import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Container } from "@/components/primitives";
import { Globe, Check, ArrowRight, Sparkles, Building2, Search, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/language-selector")({
  head: () => ({
    meta: [
      { title: "Select Language / Chọn ngôn ngữ | VNSupplier" },
      { name: "description", content: "Select your preferred language for VNSupplier Vietnam Manufacturing Directory." },
    ],
  }),
  component: LanguageSelectorPage,
});

const LANGUAGES = [
  {
    code: "vi",
    name: "Tiếng Việt",
    native: "Tiếng Việt",
    flag: "🇻🇳",
    badge: "Mặc định (Default)",
    desc: "Cổng thông tin tra cứu hồ sơ năng lực nhà máy & gửi yêu cầu báo giá B2B trực tiếp tại Việt Nam.",
    current: true,
  },
  {
    code: "en",
    name: "English",
    native: "English (Global)",
    flag: "🌐",
    badge: "International",
    desc: "Vietnam OEM/ODM supplier & manufacturing directory. Connect with verified factories across Vietnam.",
    current: false,
  },
  {
    code: "ja",
    name: "Japanese",
    native: "日本語",
    flag: "🇯🇵",
    badge: "Japan Market",
    desc: "ベトナムの製造業・委託製造（OEM/ODM）サプライヤー検索ポータル。認証済み工場と直接取引。",
    current: false,
  },
  {
    code: "ko",
    name: "Korean",
    native: "한국어",
    flag: "🇰🇷",
    badge: "Korea Market",
    desc: "베트남 제조 공장 및 OEM/ODM 공급업체 디렉토리. 검증된 베트남 공장과 직접 연결.",
    current: false,
  },
];

function LanguageSelectorPage() {
  const [selected, setSelected] = useState("vi");

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col justify-between">
      <SiteHeader />
      <main className="py-12 flex-1">
        <Container size="md">
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand mb-4">
              <Globe className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Chọn ngôn ngữ / Select Language
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              VNSupplier hỗ trợ kết nối chuỗi cung ứng giữa các nhà máy sản xuất tại Việt Nam và các đối tác thương mại quốc tế.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {LANGUAGES.map((lang) => {
              const isChosen = selected === lang.code;
              return (
                <div
                  key={lang.code}
                  onClick={() => setSelected(lang.code)}
                  className={`cursor-pointer rounded-2xl border p-6 transition-all shadow-sm ${
                    isChosen
                      ? "border-brand bg-card ring-2 ring-brand/20 shadow-md"
                      : "border-border bg-card hover:border-brand/40 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{lang.flag}</span>
                      <div>
                        <div className="font-bold text-foreground text-base flex items-center gap-2">
                          {lang.native}
                          <span className="text-xs font-normal text-muted-foreground">({lang.name})</span>
                        </div>
                        <span className="inline-block rounded-full bg-brand-soft px-2.5 py-0.5 text-[10px] font-semibold text-brand mt-1">
                          {lang.badge}
                        </span>
                      </div>
                    </div>
                    {isChosen ? (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                    ) : null}
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{lang.desc}</p>

                  <div className="mt-6 border-t pt-4 flex items-center justify-between">
                    <Link
                      to="/"
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                        isChosen ? "text-brand hover:underline" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Truy cập trang chủ <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Feature Highlights */}
          <div className="mt-12 rounded-2xl border bg-card p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3 text-center">
              <div className="p-3">
                <Building2 className="mx-auto h-6 w-6 text-brand mb-2" />
                <h4 className="font-bold text-sm text-foreground">Hồ sơ nhà máy xác thực</h4>
                <p className="text-xs text-muted-foreground mt-1">Tra cứu năng lực máy móc, chứng chỉ ISO/FDA/CE và vị trí KCN.</p>
              </div>
              <div className="p-3">
                <Search className="mx-auto h-6 w-6 text-brand mb-2" />
                <h4 className="font-bold text-sm text-foreground">Báo giá RFQ trực tiếp</h4>
                <p className="text-xs text-muted-foreground mt-1">Gửi yêu cầu báo giá tới nhà máy không qua trung gian trong 24h.</p>
              </div>
              <div className="p-3">
                <ShieldCheck className="mx-auto h-6 w-6 text-brand mb-2" />
                <h4 className="font-bold text-sm text-foreground">Kết nối Đa quốc gia</h4>
                <p className="text-xs text-muted-foreground mt-1">Hỗ trợ đối tác Việt Nam, Nhật Bản, Hàn Quốc, Mỹ và Châu Âu.</p>
              </div>
            </div>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
