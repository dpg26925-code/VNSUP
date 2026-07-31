import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, CheckCircle2, AlertTriangle, SkipForward, RefreshCw } from "lucide-react";

type ResultRow = {
  name: string; slug: string | null; status: "imported" | "updated" | "skipped" | "error";
  id?: string | null; score?: number; reason?: string; message: string;
};
type Summary = { total: number; imported: number; updated: number; skipped: number; errors: number; avg_score: number };
type LogRow = { import_id: string; summary: Summary; performed_at: string };

export const Route = createFileRoute("/_authenticated/dashboard/admin/import")({
  head: () => ({ meta: [{ title: "Import doanh nghiệp hàng loạt | VNSupplier Admin" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
    if (!r) throw redirect({ to: "/dashboard" });
  },
  component: ImportPage,
});

function ImportPage() {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isCsv, setIsCsv] = useState(false);
  const [opts, setOpts] = useState({ auto_publish: false, skip_duplicates: true, enrich_with_ai: false, notify_on_complete: false, dry_run: false, min_quality_score: 0 });
  const [running, setRunning] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [results, setResults] = useState<ResultRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);

  async function authHeaders() {
    const { data } = await supabase.auth.getSession();
    return { Authorization: `Bearer ${data.session?.access_token ?? ""}`, "content-type": "application/json" };
  }

  async function loadLogs() {
    const res = await fetch("/api/public/admin/companies/batch?limit=10", { headers: await authHeaders() });
    if (!res.ok) return;
    const body = (await res.json()) as { data?: LogRow[] };
    setLogs(body.data ?? []);
  }
  useEffect(() => { loadLogs(); }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setIsCsv(f.name.toLowerCase().endsWith(".csv"));
    setText(await f.text());
  }

  async function run() {
    setErr(null); setRunning(true); setSummary(null); setResults([]);
    try {
      const body: Record<string, unknown> = { options: opts };
      if (isCsv) body.csv = text;
      else {
        const parsed = JSON.parse(text);
        body.companies = Array.isArray(parsed) ? parsed : parsed.companies;
        if (parsed.options) body.options = { ...parsed.options, ...opts };
      }
      const res = await fetch("/api/public/admin/companies/batch", {
        method: "POST", headers: await authHeaders(), body: JSON.stringify(body),
      });
      const json = (await res.json()) as { summary?: Summary; results?: ResultRow[]; message?: string; error?: string };
      if (!res.ok) { setErr(json.message ?? json.error ?? "Import thất bại"); return; }
      setSummary(json.summary ?? null);
      setResults(json.results ?? []);
      await loadLogs();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import doanh nghiệp hàng loạt</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tải lên JSON hoặc CSV từ crawler Hermes, chấm điểm chất lượng và nhập vào danh bạ.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 rounded-lg border bg-card p-4 lg:col-span-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Tệp JSON / CSV</label>
            <input type="file" accept=".json,.csv,application/json,text/csv" onChange={onFile} className="block w-full text-sm" />
            {fileName && <p className="mt-1 text-xs text-muted-foreground">Đã chọn: {fileName} ({isCsv ? "CSV" : "JSON"})</p>}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Hoặc dán nội dung</label>
            <textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} spellCheck={false}
              placeholder='{"companies":[{"name":"Công ty TNHH ABC","industry":"nhua","province":"TP.HCM"}]}'
              className="w-full rounded-md border bg-background p-3 font-mono text-xs outline-none" />
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" checked={isCsv} onChange={(e) => setIsCsv(e.target.checked)} /> Xử lý nội dung dưới dạng CSV
          </label>
        </div>

        <div className="space-y-3 rounded-lg border bg-card p-4">
          <h2 className="text-sm font-semibold">Tuỳ chọn</h2>
          {([
            ["auto_publish", "Tự động duyệt (approved)"],
            ["skip_duplicates", "Bỏ qua bản trùng"],
            ["enrich_with_ai", "Làm giàu bằng AI"],
            ["notify_on_complete", "Thông báo khi xong"],
            ["dry_run", "Chạy thử (không ghi DB)"],
          ] as const).map(([k, label]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={opts[k]} onChange={(e) => setOpts({ ...opts, [k]: e.target.checked })} />
              {label}
            </label>
          ))}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Điểm chất lượng tối thiểu (0–100)</label>
            <input type="number" min={0} max={100} value={opts.min_quality_score}
              onChange={(e) => setOpts({ ...opts, min_quality_score: Number(e.target.value) })}
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none" />
          </div>
          <button onClick={run} disabled={running || !text.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
            {running ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {running ? "Đang import…" : "Bắt đầu import"}
          </button>
          {err && <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">{err}</div>}
        </div>
      </div>

      {summary && (
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Tổng" value={summary.total} />
          <Stat label="Đã nhập" value={summary.imported} tone="ok" />
          <Stat label="Cập nhật" value={summary.updated} tone="ok" />
          <Stat label="Bỏ qua" value={summary.skipped} />
          <Stat label="Lỗi" value={summary.errors} tone="bad" />
          <Stat label="Điểm TB" value={summary.avg_score} />
        </div>
      )}

      {results.length > 0 && (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr><th className="p-3 text-left">Doanh nghiệp</th><th className="p-3 text-left">Trạng thái</th><th className="p-3 text-left">Điểm</th><th className="p-3 text-left">Ghi chú</th></tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={`${r.slug ?? r.name}-${i}`} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{r.name}</div>
                    {r.slug && <div className="text-xs text-muted-foreground">{r.slug}</div>}
                  </td>
                  <td className="p-3"><StatusBadge status={r.status} /></td>
                  <td className="p-3 tabular-nums">{r.score ?? "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">{r.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Lịch sử import gần đây</h2>
        {logs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Chưa có lần import nào.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {logs.map((l) => (
              <li key={l.import_id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-background px-3 py-2">
                <span className="font-mono">{l.import_id}</span>
                <span className="text-muted-foreground">
                  {new Date(l.performed_at).toLocaleString("vi-VN")} · mới {l.summary?.imported ?? 0} · cập nhật {l.summary?.updated ?? 0} · bỏ qua {l.summary?.skipped ?? 0} · lỗi {l.summary?.errors ?? 0}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "ok" | "bad" }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold tabular-nums ${tone === "ok" ? "text-primary" : tone === "bad" ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: ResultRow["status"] }) {
  const map = {
    imported: { cls: "bg-primary/10 text-primary", icon: CheckCircle2, label: "Đã nhập" },
    updated: { cls: "bg-primary/10 text-primary", icon: RefreshCw, label: "Cập nhật" },
    skipped: { cls: "bg-muted text-muted-foreground", icon: SkipForward, label: "Bỏ qua" },
    error: { cls: "bg-destructive/10 text-destructive", icon: AlertTriangle, label: "Lỗi" },
  }[status];
  const Icon = map.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${map.cls}`}>
      <Icon className="h-3 w-3" />{map.label}
    </span>
  );
}
