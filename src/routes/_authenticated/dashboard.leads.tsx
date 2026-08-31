import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyCompanyLeads } from "@/lib/rfq.functions";
import { SectionHeader } from "@/components/primitives";
import { SkeletonList, EmptyState, ErrorState } from "@/components/skeleton-card";
import { Inbox, Mail, Phone, Building2, Clock, Search, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/leads")({
  head: () => ({ meta: [{ title: "Hộp thư Yêu cầu báo giá | VNSupplier" }, { name: "robots", content: "noindex" }] }),
  component: LeadsPage,
});

type LeadItem = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  company_id: string | null;
  message: string | null;
  created_at: string;
  source_page: string | null;
  companies?: { id: string; name: string; slug: string } | null;
};

function LeadsPage() {
  const fetchLeadsFn = useServerFn(getMyCompanyLeads);
  const [rows, setRows] = useState<LeadItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchLeadsFn();
        setRows(res.leads as unknown as LeadItem[]);
        setIsAdmin(res.isAdmin);
      } catch (e: any) {
        setErr(e?.message || "Lỗi tải danh sách yêu cầu.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = rows.filter((l) => {
    if (!q.trim()) return true;
    const term = q.toLowerCase();
    return (
      (l.name && l.name.toLowerCase().includes(term)) ||
      (l.email && l.email.toLowerCase().includes(term)) ||
      (l.phone && l.phone.includes(term)) ||
      (l.company && l.company.toLowerCase().includes(term)) ||
      (l.message && l.message.toLowerCase().includes(term)) ||
      (l.companies?.name && l.companies.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Hộp thư Yêu cầu báo giá (RFQ Inbox)
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin
                ? `Tổng cộng ${rows.length} yêu cầu báo giá trên toàn hệ thống.`
                : `Danh sách yêu cầu báo giá gửi trực tiếp đến các nhà máy của bạn (${rows.length}).`}
            </p>
          </div>

          <div className="w-full sm:w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm người gửi, email, công ty..."
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        {err ? (
          <div className="mt-6">
            <ErrorState description={err} />
          </div>
        ) : loading ? (
          <div className="mt-6">
            <SkeletonList rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<Inbox className="h-6 w-6" />}
              title={q ? "Không tìm thấy kết quả" : "Chưa có yêu cầu báo giá nào"}
              description={
                q
                  ? "Thử tìm kiếm với từ khóa khác."
                  : "Khi khách hàng gửi yêu cầu qua hồ sơ nhà máy, thông tin liên hệ và đơn hàng sẽ xuất hiện tại đây."
              }
            />
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {filtered.map((l) => (
              <div
                key={l.id}
                className="rounded-xl border bg-card p-5 shadow-sm transition hover:border-brand/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-base">{l.name || "Khách hàng"}</span>
                      {l.company && (
                        <span className="rounded bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">
                          {l.company}
                        </span>
                      )}
                    </div>
                    {l.companies && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5" /> Gửi tới nhà máy:{" "}
                        <Link
                          to="/company/$slug"
                          params={{ slug: l.companies.slug }}
                          target="_blank"
                          className="font-semibold text-foreground hover:underline inline-flex items-center gap-0.5"
                        >
                          {l.companies.name} <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(l.created_at).toLocaleString("vi-VN")}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-5 text-xs">
                  {l.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <a href={`mailto:${l.email}`} className="font-medium text-foreground hover:underline">
                        {l.email}
                      </a>
                    </div>
                  )}
                  {l.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <a href={`tel:${l.phone}`} className="font-medium text-foreground hover:underline">
                        {l.phone}
                      </a>
                    </div>
                  )}
                  {l.source_page && (
                    <div className="text-muted-foreground text-[11px]">
                      Nguồn: {l.source_page}
                    </div>
                  )}
                </div>

                <div className="mt-3 rounded-lg bg-muted/50 p-3.5 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                  {l.message || "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
