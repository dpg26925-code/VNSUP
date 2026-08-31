import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyCompanyLeads } from "@/lib/rfq.functions";
import { SkeletonList, EmptyState, ErrorState } from "@/components/skeleton-card";
import {
  Inbox,
  Mail,
  Phone,
  Building2,
  Clock,
  Search,
  ExternalLink,
  Copy,
  Check,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/leads")({
  head: () => ({ meta: [{ title: "Hộp thư Yêu cầu Báo giá (RFQ Inbox) | VNSupplier" }, { name: "robots", content: "noindex" }] }),
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
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const companyList = Array.from(
    new Map(
      rows
        .filter((r) => r.companies?.id)
        .map((r) => [r.companies!.id, r.companies!.name])
    ).entries()
  );

  const filtered = rows.filter((l) => {
    if (selectedCompanyId !== "all" && l.company_id !== selectedCompanyId) {
      return false;
    }
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

  function copyInfo(l: LeadItem) {
    const text = `Khách hàng: ${l.name || "Khách mua"}\nCông ty: ${l.company || "—"}\nEmail: ${l.email || "—"}\nSố điện thoại: ${l.phone || "—"}\nNội dung: ${l.message || "—"}`;
    navigator.clipboard.writeText(text);
    setCopiedId(l.id);
    toast.success("Đã copy toàn bộ thông tin yêu cầu báo giá!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-16">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header Title */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-0.5 text-xs font-bold text-brand mb-2">
              <Inbox className="h-3.5 w-3.5" /> B2B Inquiry & RFQ Inbox
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              Hộp thư Yêu cầu Báo giá
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin
                ? `Tổng cộng ${rows.length} yêu cầu báo giá trên toàn hệ thống.`
                : `Danh sách yêu cầu báo giá gửi trực tiếp đến các nhà máy của bạn (${rows.length}).`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {companyList.length > 1 && (
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="rounded-xl border border-input bg-background px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand"
              >
                <option value="all">Tất cả nhà máy ({rows.length})</option>
                {companyList.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm khách mua, email, công ty..."
                className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        {/* Tip banner */}
        <div className="mt-6 rounded-2xl border border-brand/20 bg-brand/5 p-4 text-xs text-foreground/90 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand shrink-0" />
            <span>
              <strong>Mẹo tăng tỷ lệ chốt đơn:</strong> Phản hồi lại khách mua qua Email hoặc Điện thoại trong vòng <strong>24 giờ làm việc</strong> kể từ lúc nhận được yêu cầu.
            </span>
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
                className="rounded-2xl border bg-card p-5 shadow-2xs transition hover:border-brand/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-foreground text-base">{l.name || "Khách hàng"}</span>
                      {l.company && (
                        <span className="rounded-md bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand">
                          {l.company}
                        </span>
                      )}
                    </div>
                    {l.companies && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 text-brand" /> Gửi tới nhà máy:{" "}
                        <Link
                          to="/company/$slug"
                          params={{ slug: l.companies.slug }}
                          target="_blank"
                          className="font-bold text-foreground hover:text-brand hover:underline inline-flex items-center gap-1"
                        >
                          {l.companies.name} <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(l.created_at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>

                {/* Contact info pills */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                  {l.email && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <a
                        href={`mailto:${l.email}?subject=Phản hồi yêu cầu báo giá từ ${l.companies?.name || "VNSupplier"}`}
                        className="text-foreground hover:text-brand hover:underline"
                      >
                        {l.email}
                      </a>
                    </div>
                  )}
                  {l.phone && (
                    <div className="flex items-center gap-1.5 font-medium">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <a href={`tel:${l.phone}`} className="text-foreground hover:text-brand hover:underline">
                        {l.phone}
                      </a>
                    </div>
                  )}
                  {l.source_page && (
                    <div className="text-muted-foreground text-[11px] ml-auto">
                      Nguồn: {l.source_page}
                    </div>
                  )}
                </div>

                {/* Message Body */}
                <div className="mt-3.5 rounded-xl bg-muted/40 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap border border-border/50">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Nội dung yêu cầu báo giá:
                  </div>
                  {l.message || "—"}
                </div>

                {/* Action footer */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2">
                  <button
                    onClick={() => copyInfo(l)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary transition"
                  >
                    {copiedId === l.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" /> Đã copy
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy thông tin liên hệ
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    {l.phone && (
                      <a
                        href={`tel:${l.phone}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand/10 transition"
                      >
                        <Phone className="h-3.5 w-3.5" /> Gọi điện ({l.phone})
                      </a>
                    )}
                    {l.email && (
                      <a
                        href={`mailto:${l.email}?subject=Phản hồi yêu cầu báo giá từ ${l.companies?.name || "VNSupplier"}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-brand/90 transition"
                      >
                        <Send className="h-3.5 w-3.5" /> Soạn Email phản hồi
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

