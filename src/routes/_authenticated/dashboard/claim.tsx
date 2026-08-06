import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Container } from "@/components/primitives";
import { Search, Building2, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/claim")({
  head: () => ({ meta: [{ title: "Xác thực doanh nghiệp | VNSupplier" }, { name: "robots", content: "noindex" }] }),
  component: ClaimPage,
});

function ClaimPage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("id,name,slug,province,industry,verified")
      .ilike("name", `%${q.trim()}%`)
      .limit(10);
    if (error) {
      toast.error("Lỗi tìm kiếm");
    } else {
      setResults(data || []);
    }
    setLoading(false);
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      toast.error("Vui lòng đăng nhập");
      return;
    }

    const { error } = await supabase.from("company_claims").insert({
      company_id: selected.id,
      user_id: userData.user.id,
      requester_name: userData.user.user_metadata?.full_name || userData.user.email?.split("@")[0],
      requester_email: userData.user.email || "",
      note: note.trim() || null,
      status: "pending",
    });

    if (error) {
      toast.error("Gửi yêu cầu thất bại");
    } else {
      toast.success("Đã gửi yêu cầu xác thực");
      navigate({ to: "/dashboard/my-companies" });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="py-12">
        <Container className="max-w-2xl">
          <div className="mb-10">
            <h1 className="text-3xl font-bold">Xác thực doanh nghiệp</h1>
            <p className="mt-2 text-muted-foreground">Tìm và yêu cầu quyền quản trị hồ sơ nhà máy của bạn.</p>
          </div>

          {!selected ? (
            <div className="space-y-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Nhập tên doanh nghiệp hoặc mã số thuế..."
                    className="w-full rounded-md border bg-card py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-brand px-6 py-2 font-semibold text-white hover:bg-brand/90 disabled:opacity-50"
                >
                  {loading ? "Đang tìm..." : "Tìm kiếm"}
                </button>
              </form>

              <div className="space-y-3">
                {results.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
                    <div>
                      <div className="font-bold">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.industry} · {c.province}</div>
                    </div>
                    {c.verified ? (
                      <div className="flex items-center gap-1 text-xs text-success">
                        <CheckCircle className="h-3 w-3" /> Đã xác thực
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelected(c)}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline"
                      >
                        Claim ngay <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {q && !loading && results.length === 0 && (
                  <div className="rounded-xl border border-dashed p-8 text-center">
                    <Building2 className="mx-auto h-8 w-8 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">Không tìm thấy doanh nghiệp nào khớp.</p>
                    <Link to="/dashboard/submit-company" className="mt-4 inline-block text-sm font-semibold text-brand hover:underline">
                      Đăng ký doanh nghiệp mới →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleClaim} className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Xác nhận Claim</h2>
                <button type="button" onClick={() => setSelected(null)} className="text-sm text-muted-foreground hover:text-foreground">Thay đổi</button>
              </div>
              
              <div className="rounded-lg bg-secondary/30 p-4">
                <div className="font-bold">{selected.name}</div>
                <div className="text-xs text-muted-foreground">{selected.industry} · {selected.province}</div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold">Minh chứng (tùy chọn)</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ví dụ: Tôi là giám đốc điều hành của công ty này. GPKD số..."
                  rows={4}
                  className="w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="rounded-lg bg-amber-50 p-4 text-xs text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                <Clock className="mb-1 h-4 w-4" />
                Yêu cầu của bạn sẽ được Admin xem xét trong vòng 24-48h làm việc. Chúng tôi có thể liên hệ qua email để yêu cầu thêm giấy tờ.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-md bg-brand py-2.5 font-bold text-white hover:bg-brand/90 disabled:opacity-50"
              >
                {submitting ? "Đang gửi..." : "Gửi yêu cầu xác thực"}
              </button>
            </form>
          )}
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
